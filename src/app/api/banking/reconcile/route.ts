import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findAccountByCode } from '@/lib/ledgerUtility';
import { requireSession } from '@/lib/access-server';

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // 1. Fetch all unreconciled bank statement lines
    const unreconciledLines = await prisma.bankStatementLine.findMany({
      where: { 
        isReconciled: false,
        statement: { tenantId: tenant.id }
      },
      include: { statement: { include: { account: true } } }
    });

    if (unreconciledLines.length === 0) {
      return NextResponse.json({ message: 'No unreconciled lines found.', matches: 0 });
    }

    // 2. Fetch Pending Invoices & Pending/Accrued Expenses
    const pendingInvoices = await prisma.invoice.findMany({
      where: { tenantId: tenant.id, status: { in: ['PENDING', 'SENT'] } }
    });

    const pendingExpenses = await prisma.expense.findMany({
      where: { tenantId: tenant.id, status: { in: ['PENDING', 'APPROVED'] } } // APPROVED implies accrued/unpaid
    });

    // Accounting Setup
    const accAR = await findAccountByCode(tenant.id, '1002');
    const accAP = await findAccountByCode(tenant.id, '2100');
    
    // 2.2 Fetch all Bank Rules for this tenant
    const rules = await prisma.bankRule.findMany({
      where: { tenantId: tenant.id }
    });
    
    let matchCount = 0;
    const dbUpdates = [];

    // 3. Auto-Match Logic
    for (const line of unreconciledLines) {
      let matched = false;
      const bankAccount = line.statement.account;
      
      // DEPOSIT MATCHING (Inwards -> Invoices)
      if (line.amount > 0) {
        for (const inv of pendingInvoices) {
          if (inv.status === 'PAID') continue; // already matched in this loop

          const amountDiff = Math.abs(inv.grandTotal - line.amount);
          const dateBank = new Date(line.date).getTime();
          const dateInv = new Date(inv.date).getTime();
          const daysDiff = Math.abs(dateBank - dateInv) / (1000 * 60 * 60 * 24);

          if (amountDiff < 0.01 && daysDiff <= 30) {
            // EXACT MATCH!
            matched = true;
            inv.status = 'PAID'; // update local reference for loop safety

            dbUpdates.push(
              prisma.bankStatementLine.update({
                where: { id: line.id },
                data: { isReconciled: true, matchedDocumentId: inv.id, matchedDocumentType: 'INVOICE' }
              }),
              prisma.invoice.update({
                where: { id: inv.id },
                data: { status: 'PAID', paidAmount: inv.grandTotal }
              }),
              // Post to Ledger: Dr Bank, Cr AR
              prisma.journalEntry.create({
                 data: {
                     date: line.date,
                     description: `Auto-Reconciliation: Payment for ${inv.invoiceNo}`,
                     reference: `REC-${inv.invoiceNo}`,
                     tenantId: tenant.id,
                     lines: {
                         create: [
                             { accountId: bankAccount.id, debit: line.amount, credit: 0 },
                             { accountId: accAR!.id, debit: 0, credit: line.amount }
                         ]
                     }
                 }
              })
            );
            break; 
          }
        }
      } 
      // WITHDRAWAL MATCHING (Outwards -> Expenses)
      else if (line.amount < 0) {
        const absAmount = Math.abs(line.amount);
        for (const exp of pendingExpenses) {
          if (exp.status === 'PAID') continue;

          const amountDiff = Math.abs(exp.grandTotal - absAmount);
          const dateBank = new Date(line.date).getTime();
          const dateExp = new Date(exp.date).getTime();
          const daysDiff = Math.abs(dateBank - dateExp) / (1000 * 60 * 60 * 24);

          if (amountDiff < 0.01 && daysDiff <= 14) {
            // EXACT MATCH!
            matched = true;
            exp.status = 'PAID';

            dbUpdates.push(
              prisma.bankStatementLine.update({
                where: { id: line.id },
                data: { isReconciled: true, matchedDocumentId: exp.id, matchedDocumentType: 'EXPENSE' }
              }),
              prisma.expense.update({
                where: { id: exp.id },
                data: { status: 'PAID' }
              }),
              // Post to Ledger: Dr AP (or direct cash), Cr Bank
              // Assuming 'APPROVED' expense already accrued to AP.
              prisma.journalEntry.create({
                 data: {
                     date: line.date,
                     description: `Auto-Reconciliation: Pymt for ${exp.merchant}`,
                     reference: `REC-EXP-${exp.id.slice(0,6)}`,
                     tenantId: tenant.id,
                     lines: {
                         create: [
                             { accountId: accAP!.id, debit: absAmount, credit: 0 },
                             { accountId: bankAccount.id, debit: 0, credit: absAmount }
                         ]
                     }
                 }
              })
            );
            break;
          }
        }
      }

      // --- STAGE 2: BANK RULES MATCHING (If no document match found) ---
      if (!matched && rules.length > 0) {
        for (const rule of rules) {
          const descClean = line.desc.toUpperCase();
          const keyword = rule.keywords.toUpperCase();
          
          let isRuleMatch = false;
          if (rule.condition === 'EXACT' && descClean === keyword) isRuleMatch = true;
          if (rule.condition === 'CONTAINS' && descClean.includes(keyword)) isRuleMatch = true;
          
          if (isRuleMatch) {
            // Check if rule type matches direction
            const isMoneyIn = line.amount > 0;
            if (rule.type === 'BOTH' || 
               (rule.type === 'DEBIT' && !isMoneyIn) || 
               (rule.type === 'CREDIT' && isMoneyIn)) {
              
              matched = true;
              const absAmount = Math.abs(line.amount);
              
              dbUpdates.push(
                prisma.bankStatementLine.update({
                  where: { id: line.id },
                  data: { isReconciled: true, matchedDocumentType: 'BANK_RULE' }
                }),
                prisma.journalEntry.create({
                  data: {
                    date: line.date,
                    description: `Rule: ${rule.name}`,
                    reference: `RULE-${rule.id.slice(0,6)}`,
                    tenantId: tenant.id,
                    lines: {
                      create: [
                        { 
                          accountId: isMoneyIn ? bankAccount.id : rule.targetAccountId, 
                          debit: absAmount, 
                          credit: 0,
                          costCenterId: rule.costCenterId 
                        },
                        { 
                          accountId: isMoneyIn ? rule.targetAccountId : bankAccount.id, 
                          debit: 0, 
                          credit: absAmount,
                          costCenterId: rule.costCenterId
                        }
                      ]
                    }
                  }
                })
              );
              break;
            }
          }
        }
      }

      if (matched) matchCount++;
    }

    // 4. Exec Transaction
    if (dbUpdates.length > 0) {
      await prisma.$transaction(dbUpdates);
    }

    return NextResponse.json({ success: true, matches: matchCount, totalScanned: unreconciledLines.length });

  } catch (error: any) {
    console.error('Auto-Reconciliation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
