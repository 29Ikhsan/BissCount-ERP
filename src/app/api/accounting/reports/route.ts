// Bizzcount Financial Reports API - v2.2.0 (Added Tag Filtering)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireSession } from '@/lib/access-server';

interface ReportPeriod {
  label: string;
  bs: {
    assets: { cash: number; ar: number; inventory: number; total: number };
    liabilities: { ap: number; taxes: number; total: number };
  };
  pl: { revenue: number; cogs: number; expenses: number; netProfit: number };
  cf?: any;
}

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const rangeType = searchParams.get('type') || 'month';
    const periodStr = searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const comparisonCount = parseInt(searchParams.get('comparisonCount') || '0');
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');
    
    // Tag Filtering (Comma-separated IDs)
    const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean) || [];
    
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const tenantId = tenant.id;

    const reportPeriods: ReportPeriod[] = [];

    for (let i = 0; i <= comparisonCount; i++) {
        let start: Date;
        let end: Date;
        let label: string;

        if (rangeType === 'custom' && customStart && customEnd) {
            start = new Date(customStart);
            end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);
            label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
            if (i > 0) break;
        } else if (rangeType === 'year') {
            const year = parseInt(periodStr.split('-')[0]) - i;
            start = new Date(year, 0, 1);
            end = new Date(year, 11, 31, 23, 59, 59, 999);
            label = `${year}`;
        } else if (rangeType === 'quarter') {
            const [y, qStr] = periodStr.split('-');
            const year = parseInt(y);
            const q = parseInt(qStr.replace('Q', ''));
            const baseMonth = (q - 1) * 3 - (i * 3);
            start = new Date(year, baseMonth, 1);
            const endMonth = start.getMonth() + 3;
            end = new Date(start.getFullYear(), endMonth, 0, 23, 59, 59, 999);
            const actualQ = Math.floor(start.getMonth() / 3) + 1;
            label = `Q${actualQ} ${start.getFullYear()}`;
        } else {
            const [y, m] = periodStr.split('-').map(Number);
            const baseDate = new Date(y, m - 1 - i, 1);
            start = baseDate;
            end = new Date(y, m - i, 0, 23, 59, 59, 999);
            label = start.toLocaleString('default', { month: 'short', year: 'numeric' });
        }

        // Shared Filter for Project/Tag
        const tagFilter = tagIds.length > 0 ? { costCenterId: { in: tagIds } } : {};

        // 2. FETCH DATA
        const arInvoices = await prisma.invoice.findMany({ 
            where: { tenantId, date: { lte: end }, ...tagFilter } 
        });
        const arValuation = arInvoices.reduce((sum, inv) => {
            const isPaidInPeriod = inv.status === 'PAID' && inv.date <= end;
            return sum + (isPaidInPeriod ? 0 : (inv.grandTotal - inv.paidAmount));
        }, 0);

        const products = await prisma.product.findMany({ where: { tenantId }, include: { inventoryLevels: true } });
        const invValuation = products.reduce((sum, p) => {
            const qty = p.inventoryLevels.reduce((q, l) => q + l.quantity, 0);
            return sum + (qty * p.cost);
        }, 0);

        // Assets are global, but keep the cash filter if needed (usually cash is not tagged)
        const bankLines = await prisma.bankStatementLine.findMany({ where: { date: { lte: end }, statement: { tenantId } } });
        const cashValuation = bankLines.reduce((sum, line) => sum + line.amount, 0);

        // PL (Filtered by Tag/Project)
        const periodInvoices = await prisma.invoice.findMany({ 
            where: { tenantId, date: { gte: start, lte: end }, ...tagFilter } 
        });
        const periodRevenue = periodInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        
        const periodExpenses = await prisma.expense.findMany({ 
            where: { tenantId, date: { gte: start, lte: end }, ...tagFilter } 
        });
        const periodOperatingExpenses = periodExpenses.reduce((sum, exp) => sum + exp.grandTotal, 0);
        
        const heuristicCOGS = tagIds.length > 0 ? (periodRevenue * 0.45) : (invValuation * 0.3); // Adjust COGS if project-filtered
        const netProfit = periodRevenue - heuristicCOGS - periodOperatingExpenses;

        reportPeriods.push({
            label,
            bs: {
                assets: { cash: cashValuation, ar: arValuation, inventory: invValuation, total: arValuation + invValuation + cashValuation },
                liabilities: { ap: periodOperatingExpenses * 0.15, taxes: periodRevenue * 0.12, total: (periodOperatingExpenses * 0.15) + (periodRevenue * 0.12) }
            },
            pl: { revenue: periodRevenue, cogs: heuristicCOGS, expenses: periodOperatingExpenses, netProfit: netProfit }
        });
    }

    for (let i = 0; i < reportPeriods.length; i++) {
        const current = reportPeriods[i];
        const previous = reportPeriods[i+1];
        if (previous) {
            const deltaAR = current.bs.assets.ar - previous.bs.assets.ar;
            const deltaInv = current.bs.assets.inventory - previous.bs.assets.inventory;
            const deltaLiab = current.bs.liabilities.total - previous.bs.liabilities.total;
            current.cf = {
                operating: { netIncome: current.pl.netProfit, depreciation: 0, changeInAR: -deltaAR, changeInInv: -deltaInv, changeInLiab: deltaLiab, netCashOperating: current.pl.netProfit - deltaAR - deltaInv + deltaLiab },
                netCashChange: current.pl.netProfit - deltaAR - deltaInv + deltaLiab
            };
        } else {
            current.cf = { operating: { netIncome: current.pl.netProfit, depreciation: 0, changeInAR: 0, changeInInv: 0, changeInLiab: 0, netCashOperating: current.pl.netProfit }, netCashChange: current.pl.netProfit };
        }
    }

    return NextResponse.json({ periods: reportPeriods });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
