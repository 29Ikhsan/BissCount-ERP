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
        desc: `${inv.clientName || inv.contact?.name || 'Customer'} • Rp${(inv.grandTotal || inv.amount || 0).toLocaleString('id-ID')}`,
        rawDate: inv.date,
        time: inv.date.toLocaleDateString(),
        type: 'invoice',
        status: inv.status,
        emailStatus: inv.emailStatus
      })),
      ...lastExpenses.map(exp => ({
        id: exp.id,
        title: `Expense recorded`,
        desc: `${exp.merchant || 'Merchant'} • Rp${(exp.grandTotal || exp.amount || 0).toLocaleString('id-ID')}`,
        rawDate: exp.date,
        time: exp.date.toLocaleDateString(),
        type: 'expense',
        status: exp.status
      }))
    ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()).slice(0, 8)

    // 5. Latest Ledger Table (Unified View)
    const latestLedger = [
      ...lastInvoices.map(inv => ({
        id: `INV-${inv.invoiceNo}`,
        entity: inv.clientName || inv.contact?.name || 'Customer',
        rawDate: inv.date,
        date: inv.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        category: 'REVENUE',
        amount: (inv.grandTotal || inv.amount || 0),
        status: inv.status === 'PAID' ? 'CLEARED' : 'PENDING'
      })),
      ...lastExpenses.map(exp => ({
        id: `EXP-${exp.id.slice(0,5)}`,
        entity: exp.merchant || 'General Merchant',
        rawDate: exp.date,
        date: exp.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        category: 'OPERATING',
        amount: -(exp.grandTotal || exp.amount || 0),
        status: exp.status === 'APPROVED' ? 'CLEARED' : 'PENDING'
      }))
    ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()).slice(0, 10)

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

    // 6. Inventory Summary
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      include: { inventoryLevels: true }
    });

    let totalInventoryValue = 0;
    let lowStockCount = 0;
    const topInventory = products.map(p => {
      const qty = p.inventoryLevels.reduce((sum, l) => sum + l.quantity, 0);
      const minQty = p.inventoryLevels.reduce((sum, l) => sum + l.minQuantity, 0);
      const value = qty * (p.cost || 0);
      totalInventoryValue += value;
      if (qty < minQty && minQty > 0) lowStockCount++;
      return { name: p.name, sku: p.sku, quantity: qty, value };
    }).sort((a, b) => b.value - a.value).slice(0, 5);

    // 7. Tax Summary & Turnover Compliance (WP OP Monitoring)
    const currentYearStart = new Date(new Date().getFullYear(), 0, 1)
    const ytdInvoices = await prisma.invoice.findMany({
      where: { 
        tenantId: tenant.id,
        date: { gte: currentYearStart }
      }
    })
    const ytdTurnover = ytdInvoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.amount), 0)
    
    // Thresholds: Rp20M (Moderate), Rp50M (Critical) - [TEST MODE ACTIVE]
    let complianceStatus = 'NORMAL'
    if (ytdTurnover >= 50000000) complianceStatus = 'CRITICAL'
    else if (ytdTurnover >= 20000000) complianceStatus = 'WARNING'

    const totalPPNOut = invoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);
    const expenses = await prisma.expense.findMany({ where: { tenantId: tenant.id } });
    const totalPPNIn = expenses.reduce((sum, exp) => sum + (exp.taxAmount || 0), 0);
    const netTaxPayable = totalPPNOut - totalPPNIn;

    // --- NEW INTELLIGENCE LAYERS ---
    
    // 8. Banking Automation Readiness
    const unreconciledBankCount = await prisma.bankStatementLine.count({
      where: { isReconciled: false, statement: { tenantId: tenant.id } }
    });

    // 9. Credit Risk Intelligence
    const contacts = await prisma.contact.findMany({
      where: { tenantId: tenant.id, creditLimit: { gt: 0 } },
      include: { 
        invoices: { where: { status: 'PENDING' } }
      }
    });
    
    let highRiskContactCount = 0;
    let totalARExposure = 0;
    
    contacts.forEach(c => {
      const balance = c.invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      totalARExposure += balance;
      if (c.creditLimit && balance >= (c.creditLimit * 0.9)) {
        highRiskContactCount++;
      }
    });

    // 10. Payroll Tax (PPh 21) Monitoring
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const payrolls = await prisma.payroll.findMany({
      where: { tenantId: tenant.id, month: currentMonth, year: currentYear }
    });
    const totalPPh21Liability = payrolls.reduce((sum, p) => sum + (p.pph21 || 0), 0);

    // 11. Distribution KPIs (New)
    const emailSucceeded = invoices.filter(inv => inv.emailStatus === 'SENT').length;
    const totalWithSentStatus = invoices.filter(inv => inv.emailStatus !== 'NOT_SENT').length;
    const emailSuccessRate = totalWithSentStatus > 0 ? ((emailSucceeded / totalWithSentStatus) * 100).toFixed(1) : 100;

    return NextResponse.json({ 
      kpis: {
        totalRevenue: totalRevenue || 0,
        totalPending: totalPending || 0,
        pendingCount: pendingCount || 0,
        netProfit: netProfit || 0,
        netMargin: netMargin || 0,
        totalCashBalance: totalCashBalance || 0,
        totalInventoryValue,
        lowStockCount,
        totalPPNOut,
        totalPPNIn,
        netTaxPayable,
        // New metrics
        unreconciledBankCount,
        highRiskContactCount,
        totalARExposure,
        totalPPh21Liability,
        emailSuccessRate: Number(emailSuccessRate),
        emailSucceeded,
        totalWithSentStatus
      },
      cashFlowData: monthlyData,
      recentActivity: recentActivity.length > 0 ? recentActivity : null,
      ledgerData: latestLedger.length > 0 ? latestLedger : null,
      inventorySummary: {
        totalValue: totalInventoryValue,
        lowStockCount,
        topProducts: topInventory
      },
      taxSummary: {
        ppnOut: totalPPNOut,
        ppnIn: totalPPNIn,
        pph21: totalPPh21Liability,
        netPayable: netTaxPayable + totalPPh21Liability,
        ytdTurnover,
        complianceStatus
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Analytics Error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
