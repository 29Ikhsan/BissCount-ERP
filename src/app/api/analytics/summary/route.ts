import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // 1. Calculate Gross Revenue (from PAID Invoices or all invoices depending on biz logic)
    const invoices = await prisma.invoice.findMany({ where: { tenantId: tenant.id } })
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    
    const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING')
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const pendingCount = pendingInvoices.length

    // 2. Fetch Expenses (Total recorded expenses)
    const expensesAgg = await prisma.expense.aggregate({
      where: { tenantId: tenant.id },
      _sum: { amount: true }
    })
    const totalExpenses = expensesAgg._sum.amount || 0

    // 3. Net Profit
    const netProfit = totalRevenue - totalExpenses
    const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0

    // 4. Fallback Chart Data (For Demo MVP, merging real totals with a trend curve)
    const mockCashFlowData = [
      { name: 'JAN', Revenue: 4000, Expenses: 2400 },
      { name: 'FEB', Revenue: 5000, Expenses: 3200 },
      { name: 'MAR', Revenue: 6200, Expenses: 4100 },
      { name: 'APR', Revenue: 5800, Expenses: 5100 },
      { name: 'MAY', Revenue: 4800, Expenses: 3800 },
      { name: 'JUN', Revenue: totalRevenue > 0 ? totalRevenue : 7500, Expenses: totalExpenses > 0 ? totalExpenses : 4300 },
    ]

    return NextResponse.json({ 
      kpis: {
        totalRevenue,
        totalPending,
        pendingCount,
        netProfit,
        netMargin
      },
      cashFlowData: mockCashFlowData
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
