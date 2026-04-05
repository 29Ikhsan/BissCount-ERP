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

    // 3. Smart Matcher Logic (Journal-based)
    const reconciliationLines = await Promise.all(unprocessedLines.map(async (line) => {
      let match = null

      // Fuzzy Date Window: 3 days before/after statement date
      const dateStart = new Date(line.date)
      dateStart.setDate(dateStart.getDate() - 3)
      const dateEnd = new Date(line.date)
      dateEnd.setDate(dateEnd.getDate() + 3)

      // Find the offset JournalLine for context
      const potentialMatch = await prisma.journalLine.findFirst({
        where: {
          journalEntry: {
            tenantId: tenant.id,
            date: { gte: dateStart, lte: dateEnd }
          },
          // Amount matches the offset side
          // Withdrawal (-777k) should find the Debit offset side (+777k)
          // Deposit (+777k) should find the Credit offset side (-777k)
          debit: line.amount < 0 ? Math.abs(line.amount) : 0, 
          credit: line.amount > 0 ? line.amount : 0,        
          // Exclude bank account itself (starts with 1) to show the 'Categorized' account
          NOT: {
            account: { code: { startsWith: '1' } }
          }
        },
        include: { journalEntry: true, account: true }
      })

      if (potentialMatch) {
         const score = potentialMatch.journalEntry.date.toDateString() === line.date.toDateString() ? 100 : 85;

         match = { 
           type: score === 100 ? 'exact' : 'suggested', 
           score, 
           bizzcountRef: potentialMatch.journalEntry.description, 
           bizzcountId: potentialMatch.journalEntryId,
           accountName: potentialMatch.account.name
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
    console.log('[Banking POST Payload]:', JSON.stringify(body, null, 2));
    const { lineId, targetId, costCenterId, action } = body;
    
    if (action === 'reconcile') {
      const tenant = await prisma.tenant.findFirst()
      if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

      const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch the Statement Line
        const line = await tx.bankStatementLine.findUnique({
          where: { id: lineId },
          include: { statement: true }
        })
        if (!line) throw new Error('Statement line not found')

        let journalEntryId = targetId;
        console.log('[Reconcile Debug]: journalEntryId received:', journalEntryId);

        // 2. Scenario: Create New Entry (if no match)
        if (!journalEntryId) {
          console.log('[Reconcile Debug]: No targetId, creating new JournalEntry...');
          const suspenseAcc = await tx.account.findFirst({
            where: { tenantId: tenant.id, code: '999' }
          })
          const bankAccount = await tx.account.findFirst({
            where: { id: line.statement.accountId }
          })
          
          if (!bankAccount) throw new Error(`Bank Account with ID ${line.statement.accountId} not found in COA`);
          if (!suspenseAcc) throw new Error('Suspense Account (999) not found. Run account setup.');

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
          journalEntryId = journal.id;
        }

        console.log('[Reconcile Debug]: Finalizing update for line', lineId, 'with journal', journalEntryId);

        // 3. Mark Reconciled & Link
        return await tx.bankStatementLine.update({
          where: { id: lineId },
          data: { 
            isReconciled: true, 
            reconciledAt: new Date(),
            journalEntryId: journalEntryId
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
