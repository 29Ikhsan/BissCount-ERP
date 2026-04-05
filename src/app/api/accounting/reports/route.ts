import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenantId = tenant.id;

    // 1. INVENTORY VALUATION (Physical Asset Value)
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: {
        inventoryLevels: true
      }
    });
    const inventoryValuation = products.reduce((sum, p) => {
      const totalQty = p.inventoryLevels.reduce((q, l) => q + l.quantity, 0);
      return sum + (totalQty * p.cost);
    }, 0);

    // 2. REVENUE (Total Invoiced Amount)
    const invoices = await prisma.invoice.findMany({ where: { tenantId } });
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // 3. EXPENSES (Total Operating Costs)
    const expenses = await prisma.expense.findMany({ where: { tenantId } });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.grandTotal, 0);

    // 4. CASH POSITION (Sum of bank statement balances)
    const bankLines = await prisma.bankStatementLine.findMany({
      where: { statement: { tenantId } }
    });
    const cashPosition = bankLines.reduce((sum, line) => sum + line.amount, 0);

    return NextResponse.json({
      balanceSheet: {
        currentAssets: {
          cash: cashPosition,
          inventory: inventoryValuation,
          accountsReceivable: invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + (i.grandTotal - i.paidAmount), 0),
          total: cashPosition + inventoryValuation
        },
        liabilities: {
          accountsPayable: 0, // Placeholder for bills
          taxesPayable: totalRevenue * 0.12 // Estimated PPN
        }
      },
      profitAndLoss: {
        revenue: totalRevenue,
        cogs: inventoryValuation * 0.4, // Heuristic COGS (Simplified)
        grossProfit: totalRevenue - (inventoryValuation * 0.4),
        expenses: totalExpenses,
        netProfit: totalRevenue - (inventoryValuation * 0.4) - totalExpenses
      },
      ratios: {
        grossMargin: totalRevenue > 0 ? ((totalRevenue - (inventoryValuation * 0.4)) / totalRevenue * 100).toFixed(1) : 0,
        netMargin: totalRevenue > 0 ? ((totalRevenue - (inventoryValuation * 0.4) - totalExpenses) / totalRevenue * 100).toFixed(1) : 0
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
