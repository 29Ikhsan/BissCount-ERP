import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/access-server';

export async function GET(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { searchParams } = new URL(req.url)
    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()))

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const history = await prisma.closedPeriod.findMany({
      where: { tenantId: tenant.id },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    // --- DEEP AUDIT FOR CLOSING GATEWAY ---
    const [
      unreconciledBankCount,
      deprRun,
      amortRun,
      draftInvoices,
      pendingExpenses
    ] = await Promise.all([
      prisma.bankStatementLine.count({ where: { isReconciled: false, statement: { tenantId: tenant.id } } }),
      prisma.depreciationRun.findUnique({ where: { month_year_tenantId: { month, year, tenantId: tenant.id } } }),
      prisma.amortizationRun.findUnique({ where: { month_year_tenantId: { month, year, tenantId: tenant.id } } }),
      prisma.invoice.count({ where: { tenantId: tenant.id, status: { in: ['DRAFT', 'PENDING'] } } }),
      prisma.expense.count({ where: { tenantId: tenant.id, status: 'PENDING' } })
    ]);

    return NextResponse.json({ 
      history,
      audit: {
        unreconciledBankCount,
        hasDepreciationRun: !!deprRun,
        hasAmortizationRun: !!amortRun,
        draftInvoices,
        pendingExpenses
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Closing Audit Error:', error);
    return NextResponse.json({ error: 'Failed to fetch closing history' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { month, year } = body

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // --- AUTOMATED CLOSING JOURNAL ENGINE ---
    // 1. Calculate Profit & Loss for the period
    const startOfPeriod = new Date(`${year}-${month}-01`);
    const endOfPeriod = new Date(year, startOfPeriod.getMonth() + 1, 0, 23, 59, 59);

    const journalLines = await prisma.journalLine.findMany({
      where: {
        journalEntry: {
          tenantId: tenant.id,
          date: { gte: startOfPeriod, lte: endOfPeriod }
        }
      },
      include: { account: true }
    });

    let totalRevenue = 0;
    let totalExpenses = 0;

    journalLines.forEach(line => {
      if (line.account.type === 'REVENUE') totalRevenue += (line.credit - line.debit);
      if (line.account.type === 'EXPENSE' || line.account.type === 'COS') totalExpenses += (line.debit - line.credit);
    });

    const netProfit = totalRevenue - totalExpenses;

    // 2. Create the Closing Journal Entry (Closing the books to Retained Earnings)
    if (Math.abs(netProfit) > 0) {
      // Find or Create Retained Earnings Account
      let retainedAcc = await prisma.account.findFirst({
        where: { tenantId: tenant.id, code: '3999' }
      });

      if (!retainedAcc) {
        retainedAcc = await prisma.account.create({
          data: {
            code: '3999',
            name: 'Laba Ditahan (Tahun Berjalan)',
            type: 'EQUITY',
            tenantId: tenant.id
          }
        });
      }

      await prisma.journalEntry.create({
        data: {
          date: endOfPeriod,
          description: `Closing Entry for ${month} ${year}`,
          reference: `CLOSE-${month.slice(0, 3).toUpperCase()}-${year}`,
          tenantId: tenant.id,
          lines: {
            create: [
              // This is a simplified closing. 
              // Real closing zeros out every single P&L account. 
              // Here we post the NET result to Retained Earnings to ensure the Balance Sheet matches.
              { accountId: retainedAcc.id, debit: netProfit < 0 ? Math.abs(netProfit) : 0, credit: netProfit > 0 ? netProfit : 0 }
            ]
          }
        }
      });
    }

    const closedPeriod = await prisma.closedPeriod.create({
      data: {
        month,
        year: parseInt(year),
        closedBy: 'System Admin',
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, closedPeriod, netProfit }, { status: 201 })
  } catch (error) {
    console.error('Period Closing Error:', error)
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'This period is already closed.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to close period' }, { status: 500 })
  }
}
