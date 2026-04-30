import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensurePeriodOpen } from '@/lib/periodGuard'
import { requireSession } from '@/lib/access-server';

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { date, description, reference, lines } = body

    if (!description || !lines || lines.length < 2) {
      return NextResponse.json({ error: 'Manual Journal requires at least 2 balanced lines' }, { status: 400 })
    }

    // Workaround: Get default Tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      return NextResponse.json({ error: 'System Error: No Master Tenant Found' }, { status: 500 })
    }

    // 1. Check Period Lock
    const journalDate = new Date(date || Date.now());
    await ensurePeriodOpen(journalDate, tenant.id)

    // Calculate Totals to verify accounting equation Debit = Credit
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (parseFloat(line.debit) || 0), 0)
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (parseFloat(line.credit) || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return NextResponse.json({ error: `Unbalanced journal! Debit: ${totalDebit}, Credit: ${totalCredit}` }, { status: 400 })
    }

    // Process Transaction
    const newJournal = await prisma.$transaction(async (tx) => {
      
      const journalEntry = await tx.journalEntry.create({
        data: {
          date: journalDate,
          description,
          reference: reference || null,
          tenantId: tenant.id
        }
      })

      for (const line of lines) {
        const debit = parseFloat(line.debit) || 0;
        const credit = parseFloat(line.credit) || 0;

        await tx.journalLine.create({
          data: {
            journalEntryId: journalEntry.id,
            accountId: line.accountId,
            debit,
            credit,
            ...(line.costCenterId ? { costCenterId: line.costCenterId } : {})
          }
        })

        // Update Account Running Balances
        const account = await tx.account.findUnique({ where: { id: line.accountId } })
        if (account) {
          let balanceDiff = 0;
          if (['ASSET', 'EXPENSE'].includes(account.type)) {
            balanceDiff = debit - credit;
          } else {
            balanceDiff = credit - debit;
          }
          await tx.account.update({
            where: { id: account.id },
            data: { balance: { increment: balanceDiff } }
          })
        }
      }

      return journalEntry;
    })

    return NextResponse.json({ success: true, journal: newJournal }, { status: 201 })
  } catch (error: any) {
    console.error('[Create Journal Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const journals = await prisma.journalEntry.findMany({
      where: { tenantId: tenant.id },
      include: {
        lines: {
          include: { account: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 100
    })

    return NextResponse.json({ journals }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 })
  }
}
