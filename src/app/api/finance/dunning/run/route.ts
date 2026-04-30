import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { postToLedger, findAccountByCode } from '@/lib/ledgerUtility';
import { requireSession } from '@/lib/access-server';

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant found' }, { status: 500 });

    // Find all invoices that are pending and overdue
    const today = new Date();
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenant.id,
        status: 'PENDING',
        dueDate: { lt: today },
        dunningStatus: 'NONE' // Only penalize those not yet penalized
      },
      include: { contact: true }
    });

    if (overdueInvoices.length === 0) {
      return NextResponse.json({ message: 'No eligible overdue invoices found for dunning sweep.', count: 0 });
    }

    const results = [];
    const penaltyRate = 0.02; // 2% Corporate Penalty Standard

    for (const invoice of overdueInvoices) {
      try {
        await prisma.$transaction(async (tx) => {
          const lateFeeAmount = invoice.amount * penaltyRate;

          // Update the invoice
          const updatedInvoice = await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              dunningStatus: 'PENALIZED',
              lateFee: lateFeeAmount,
              amount: invoice.amount + lateFeeAmount // Increment total bill
            }
          });

          // Post Late Fee to Ledger (Debit AR, Credit Late Fee Revenue)
          const accAR = await findAccountByCode(tenant.id, '1200', tx); // Accounts Receivable
          const accLateFeeRev = await findAccountByCode(tenant.id, '4100', tx) || await findAccountByCode(tenant.id, '4000', tx); // Other Revenue

          if (accAR && accLateFeeRev) {
            await postToLedger(tx, {
              date: new Date(),
              description: `Automated Dunning Penalty (2% Late Fee) for Invoice ${invoice.invoiceNo}`,
              reference: `DUN-${invoice.id.slice(0, 8)}`,
              tenantId: tenant.id,
              lines: [
                { accountId: accAR.id, debit: lateFeeAmount, credit: 0 },
                { accountId: accLateFeeRev.id, debit: 0, credit: lateFeeAmount }
              ]
            });
          }

          results.push(updatedInvoice.invoiceNo);
        });
      } catch (e: any) {
         console.error(`Failed dunning on invoice ${invoice.id}:`, e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Dunning Sweep Complete. Penalized ${results.length} invoices.`,
      penalizedInvoices: results
    });

  } catch (error: any) {
    console.error('[Dunning Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
