import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // 1. Fetch real Bank/Cash accounts from COA
    const accounts = await prisma.account.findMany({
      where: { 
        tenantId: tenant.id,
        type: 'ASSET',
        code: { startsWith: '1' } 
      },
      orderBy: { code: 'asc' }
    })

    const accountsData = accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      number: acc.code,
      type: 'Bank / Cash',
      balance: acc.balance || 0,
      lastSynced: 'Live',
      status: 'Connected'
    }))

    // 2. Fetch Unreconciled Statement Lines
    const unprocessedLines = await prisma.bankStatementLine.findMany({
      where: { 
        isReconciled: false,
        statement: { tenantId: tenant.id }
      },
      include: { statement: true },
      orderBy: { date: 'desc' },
      take: 50
    })

    // 3. Smart Matcher Logic (Journal-based + Pending Expenses)
    const reconciliationLines = await Promise.all(unprocessedLines.map(async (line) => {
      let match = null

      // Fuzzy Date Window: 7 days window for bank processing
      const dateStart = new Date(line.date)
      dateStart.setDate(dateStart.getDate() - 5)
      const dateEnd = new Date(line.date)
      dateEnd.setDate(dateEnd.getDate() + 2)

      // A. Look for existing Journal Entries (exact match)
      const potentialMatch = await prisma.journalLine.findFirst({
        where: {
          journalEntry: {
            tenantId: tenant.id,
            date: { gte: dateStart, lte: dateEnd }
          },
          debit: line.amount < 0 ? Math.abs(line.amount) : 0, 
          credit: line.amount > 0 ? line.amount : 0,        
          NOT: { account: { code: { startsWith: '1' } } }
        },
        include: { journalEntry: true, account: true }
      })

      if (potentialMatch) {
         const score = potentialMatch.journalEntry.date.toDateString() === line.date.toDateString() ? 100 : 85;
         match = { 
           type: score === 100 ? 'exact' : 'suggested', 
           score, 
           aksiaRef: potentialMatch.journalEntry.description, 
           aksiaId: potentialMatch.journalEntryId,
           accountName: potentialMatch.account.name
         }
      }

      // B. Look for Pending Accrual Expenses (using referenceCode or Name/Amount)
      if (!match && line.amount < 0) {
        const absAmount = Math.abs(line.amount)
        const pendingExpense = await prisma.expense.findFirst({
          where: {
            tenantId: tenant.id,
            status: 'APPROVED',
            OR: [
              { referenceCode: { contains: line.description, mode: 'insensitive' } },
              { AND: [
                  { grandTotal: { gte: absAmount - 10, lte: absAmount + 10 } },
                  { merchant: { contains: line.description.split(' ')[0], mode: 'insensitive' } }
                ]
              }
            ]
          }
        })

        if (pendingExpense) {
           match = {
             type: 'suggested',
             score: 95,
             aksiaRef: `Expense for ${pendingExpense.merchant}`,
             aksiaId: `EXP:${pendingExpense.id}`, // Custom prefix to handle in POST
             accountName: 'Accounts Payable'
           }
        }
      }

      return {
        id: line.id,
        date: line.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        desc: line.description,
        amount: line.amount,
        type: line.amount > 0 ? 'deposit' : 'withdrawal',
        match
      }
    }))

    return NextResponse.json({ 
      accounts: accountsData, 
      reconciliationLines: reconciliationLines.length > 0 ? reconciliationLines : [] 
    }, { status: 200 })
  } catch (error) {
    console.error('Banking API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch banking feeds' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lineId, targetId, action } = body;
    
    if (action === 'reconcile') {
      const tenant = await prisma.tenant.findFirst()
      if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

      const result = await prisma.$transaction(async (tx) => {
        const line = await tx.bankStatementLine.findUnique({
          where: { id: lineId },
          include: { statement: true }
        })
        if (!line) throw new Error('Statement line not found')

        let finalJournalId = targetId;

        // HANDLE CUSTOM PREFIXES
        if (targetId && typeof targetId === 'string' && targetId.startsWith('EXP:')) {
           const expenseId = targetId.split(':')[1];
           const expense = await tx.expense.findUnique({
             where: { id: expenseId },
             include: { items: true }
           })
           if (!expense) throw new Error('Pending expense not found');

           // 1. Create Payment Journal (Clear AP)
           // Account Payable (2100) vs Bank (Statement Account)
           const apAcc = await tx.account.findFirst({ where: { tenantId: tenant.id, code: '2100' } });
           const bankAcc = await tx.account.findUnique({ where: { id: line.statement.accountId } });

           if (!apAcc || !bankAcc) throw new Error('AP Account (2100) or Bank Account missing');

           const paymentJournal = await tx.journalEntry.create({
             data: {
               date: line.date,
               description: `Payment for Expense ${expense.referenceCode}: ${expense.merchant}`,
               reference: `PAY-EXP-${expense.id.substring(0, 8)}`,
               tenantId: tenant.id,
               lines: {
                 create: [
                   { accountId: apAcc.id, debit: Math.abs(line.amount), credit: 0 },
                   { accountId: bankAcc.id, debit: 0, credit: Math.abs(line.amount) }
                 ]
               }
             }
           })

           // 2. Mark Expense as PAID
           await tx.expense.update({
             where: { id: expense.id },
             data: { status: 'PAID' }
           })

           finalJournalId = paymentJournal.id;
        } 
        else if (!finalJournalId) {
          // Manual/Create logic (Fallback to Suspense 999)
          const suspenseAcc = await tx.account.findFirst({ where: { tenantId: tenant.id, code: '999' } })
          const bankAccount = await tx.account.findUnique({ where: { id: line.statement.accountId } })
          if (!bankAccount || !suspenseAcc) throw new Error('COA setup missing (999 or Bank ID)');

          const journal = await tx.journalEntry.create({
            data: {
              date: line.date,
              description: `Reconciled: ${line.description}`,
              reference: `BANK-${line.id.substring(0, 8)}`,
              tenantId: tenant.id,
              lines: {
                create: [
                  { accountId: bankAccount.id, debit: line.amount > 0 ? line.amount : 0, credit: line.amount < 0 ? Math.abs(line.amount) : 0 },
                  { accountId: suspenseAcc.id, debit: line.amount < 0 ? Math.abs(line.amount) : 0, credit: line.amount > 0 ? line.amount : 0 }
                ]
              }
            }
          })
          finalJournalId = journal.id;
        }

        // Finalize statement line
        return await tx.bankStatementLine.update({
          where: { id: lineId },
          data: { 
            isReconciled: true, 
            reconciledAt: new Date(),
            journalEntryId: finalJournalId
          }
        })
      })

      return NextResponse.json({ success: true, line: result })
    }

    return NextResponse.json({ error: 'Invalid Action' }, { status: 400 })
  } catch (error: any) {
    console.error('[Reconciliation Error]:', error)
    return NextResponse.json({ error: error.message || 'Reconciliation Failed' }, { status: 500 })
  }
}
