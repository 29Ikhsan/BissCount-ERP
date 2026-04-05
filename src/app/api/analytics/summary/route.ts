import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // 1. Calculate Gross Revenue
    const invoices = await prisma.invoice.findMany({ where: { tenantId: tenant.id } })
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.amount), 0)
    
    const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING')
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.amount), 0)
    const pendingCount = pendingInvoices.length

    // 2. Fetch Expenses
    const expensesAgg = await prisma.expense.aggregate({
      where: { tenantId: tenant.id },
      _sum: { grandTotal: true }
    })
    const totalExpenses = expensesAgg._sum.grandTotal || 0

    // 3. Net Profit
    const netProfit = totalRevenue - totalExpenses
    const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0

    // 4. Calculate Cash Balance from Accounts
    const accounts = await prisma.account.findMany({ where: { tenantId: tenant.id, type: 'ASSET' } })
    const totalCashBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

    // 5. Activity Feed (Last 10 events across all modules)
    // For demo MVP, we aggregate these with a common interface
    const [lastInvoices, lastExpenses] = await Promise.all([
      prisma.invoice.findMany({ where: { tenantId: tenant.id }, orderBy: { date: 'desc' }, take: 5, include: { contact: true } }),
      prisma.expense.findMany({ where: { tenantId: tenant.id }, orderBy: { date: 'desc' }, take: 5 })
    ])

    const recentActivity = [
      ...lastInvoices.map(inv => ({
        id: inv.id,
        title: `Invoice #${inv.invoiceNo} ${inv.status.toLowerCase()}`,
        desc: `${inv.clientName || inv.contact?.name || 'Customer'} • Rp${(inv.grandTotal || inv.amount).toLocaleString('id-ID')}`,
        time: inv.date.toLocaleDateString(),
        type: 'invoice',
        status: inv.status
      })),
      ...lastExpenses.map(exp => ({
        id: exp.id,
        title: `Expense recorded`,
        desc: `${exp.merchant || 'Merchant'} • Rp${(exp.grandTotal || exp.amount).toLocaleString('id-ID')}`,
        time: exp.date.toLocaleDateString(),
        type: 'expense',
        status: exp.status
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8)

    // 5. Latest Ledger Table (Unified View)
    const latestLedger = [
      ...lastInvoices.map(inv => ({
        id: `INV-${inv.invoiceNo}`,
        entity: inv.clientName || inv.contact?.name || 'Customer',
        date: inv.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        category: 'REVENUE',
        amount: (inv.grandTotal || inv.amount), // Return as number for client-side formatCurrency
        status: inv.status === 'PAID' ? 'CLEARED' : 'PENDING'
      })),
      ...lastExpenses.map(exp => ({
        id: `EXP-${exp.id.slice(0,5)}`,
        entity: exp.merchant || 'General Merchant',
        date: exp.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        category: 'OPERATING',
        amount: -(exp.grandTotal || exp.amount), // Return as negative number
        status: exp.status === 'APPROVED' ? 'CLEARED' : 'PENDING'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    // --- REAL MONTHLY AGGREGATION ENGINE ---
    const now = new Date()
    const monthlyData: any[] = []
    
    // Generate last 6 months of data points
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthName = monthDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      
      const monthLines = await prisma.journalLine.findMany({
        where: {
          journalEntry: {
            tenantId: tenant.id,
            date: { gte: monthDate, lt: nextMonthDate }
          }
        },
        include: { account: true, journalEntry: true }
      })

      let monthlyRevenue = 0
      let monthlyExpenses = 0
      let monthlyCOGS = 0

      monthLines.forEach((line: any) => {
        if (line.account.type === 'REVENUE') {
          monthlyRevenue += (line.credit - line.debit)
        } else if (line.account.type === 'COS') {
          monthlyCOGS += (line.debit - line.credit)
        } else if (line.account.type === 'EXPENSE') {
          monthlyExpenses += (line.debit - line.credit)
        }
      })

      monthlyData.push({
        name: monthName,
        Revenue: Math.max(0, monthlyRevenue),
        Expenses: Math.max(0, monthlyExpenses),
        COGS: Math.max(0, monthlyCOGS)
      })
    }

    return NextResponse.json({ 
      kpis: {
        totalRevenue: totalRevenue || 0,
        totalPending: totalPending || 0,
        pendingCount: pendingCount || 0,
        netProfit: netProfit || 0,
        netMargin: netMargin || 0,
        totalCashBalance: totalCashBalance || 0
      },
      cashFlowData: monthlyData,
      recentActivity: recentActivity.length > 0 ? recentActivity : null,
      ledgerData: latestLedger.length > 0 ? latestLedger : null
    }, { status: 200 })
  } catch (error) {
    console.error('Analytics Error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
