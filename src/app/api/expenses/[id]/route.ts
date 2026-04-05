import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/client';
import { postToLedger, findAccountByCode } from '@/lib/ledgerUtility';
import { recordAudit } from '@/lib/audit';

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const body = await req.json();
    const { status, merchant, date, items, costCenterId } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 });

    // Handle status transition
    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    // Based on user feedback: "Confirm & Post"
    try {
      const updated = await prisma.$transaction(async (tx) => {
        // 1. Delete and Re-create Items based on the Review Form edits
        // Important: Items sent from frontend now drive the record, replacing original scan data
        if (items && Array.isArray(items)) {
          await tx.expenseItem.deleteMany({ where: { expenseId: id } });
          
          let subtotal = 0;
          let totalTax = 0;
          let totalWht = 0;
          
          const createdItems = [];
          for (const it of items) {
            const amt = Number(it.amount || 0);
            const tRate = Number(it.taxRate || 0);
            const wRate = Number(it.whtRate || 0);
            const tax = amt * (tRate / 100);
            const wht = amt * (wRate / 100);
            
            subtotal += amt;
            totalTax += tax;
            totalWht += wht;

            const newItem = await tx.expenseItem.create({
               data: {
                expenseId: id,
                accountId: it.accountId || null,
                description: it.description || 'Verified Line',
                amount: amt,
                taxRate: tRate,
                taxAmount: tax,
                whtRate: wRate,
                whtAmount: wht,
                total: amt + tax - wht
              }
            });
            createdItems.push(newItem);
          }

          const finalGrandTotal = subtotal + totalTax - totalWht;
          
          const finalExp = await tx.expense.update({
            where: { id },
            data: { 
              status,
              merchant: merchant || existing.merchant,
              date: date ? new Date(date) : existing.date,
              costCenterId: costCenterId || existing.costCenterId,
              amount: subtotal,
              taxAmount: totalTax,
              grandTotal: finalGrandTotal
            },
            include: { items: true }
          });

          if (status === 'APPROVED') {
            // Find necessary accounts for Ledger Impact
            const accCash = await findAccountByCode(tenant.id, '1001');
            const accVat = await findAccountByCode(tenant.id, '2002');
            const accWht = await findAccountByCode(tenant.id, '2003') || await findAccountByCode(tenant.id, '2002');

            const journalLines = [
              ...createdItems.map((it: any) => ({
                accountId: it.accountId || '',
                debit: it.amount,
                credit: 0
              })),
              { accountId: accCash?.id || '', debit: 0, credit: finalGrandTotal }
            ];

            if (totalTax > 0 && accVat) {
              journalLines.push({ accountId: accVat.id, debit: totalTax, credit: 0 });
            }
            if (totalWht > 0 && accWht) {
              journalLines.push({ accountId: accWht.id, debit: 0, credit: totalWht });
            }

            // Post to Ledger only if all accounts are mapped correctly
            if (journalLines.every(l => l.accountId)) {
              await postToLedger(tx, {
                date: new Date(finalExp.date),
                description: `Audit Verified: ${finalExp.merchant}`,
                reference: `EXP-${finalExp.id.slice(0, 8)}`,
                tenantId: tenant.id,
                lines: journalLines
              });
            }
          }
          return finalExp;
        }
        
        // Simple status update for Rejected cases
        return await tx.expense.update({ where: { id }, data: { status } });
      });

      await recordAudit('UPDATE', 'Expense', id, tenant.id, undefined, { action: status });
      return NextResponse.json({ success: true, expense: updated });
    } catch (txError: any) {
      console.error('[Transaction Error]:', txError);
      return NextResponse.json({ error: txError.message || 'Transaction failed' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Expense Patch Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
