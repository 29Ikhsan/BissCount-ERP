import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenantId = tenant.id;

    const [leads, opportunities] = await Promise.all([
      prisma.lead.findMany({ where: { tenantId } }),
      prisma.opportunity.findMany({ where: { tenantId }, include: { lead: true } })
    ]);

    // 1. FORECASTING (Weighted Revenue by Next 6 Months)
    const now = new Date();
    const forecast: any = {};
    for (let i = 0; i < 6; i++) {
       const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
       const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
       const monthLabel = date.getMonth() === 0 || i === 0
         ? `${date.toLocaleString('default', { month: 'short' })} '${String(date.getFullYear()).slice(-2)}`
         : date.toLocaleString('default', { month: 'short' });

       forecast[key] = { month: monthLabel, weighted: 0, gross: 0 };
    }

    opportunities.forEach(op => {
      if (op.expectedClose) {
        const d = new Date(op.expectedClose);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (forecast[key]) {
          forecast[key].gross += op.value;
          forecast[key].weighted += op.value * (op.probability / 100);
        }
      }
    });

    // 2. VELOCITY (Average Days in Stage - Heuristic)
    // Avg days to WON
    const wonDeals = opportunities.filter(op => op.stage === 'WON');
    const avgVelocity = wonDeals.length > 0 
      ? wonDeals.reduce((sum, op) => sum + (new Date(op.updatedAt).getTime() - new Date(op.createdAt).getTime()), 0) / wonDeals.length / (1000 * 60 * 60 * 24)
      : 0;

    // 3. ROI BY SOURCE
    const sourceROI: any = {};
    leads.forEach(l => {
      const src = l.source || 'Direct';
      if (!sourceROI[src]) sourceROI[src] = { count: 0, revenue: 0, won: 0 };
      sourceROI[src].count += 1;
    });

    opportunities.forEach(op => {
      const src = op.lead?.source || 'Direct';
      if (sourceROI[src]) {
        sourceROI[src].revenue += op.value;
        if (op.stage === 'WON') sourceROI[src].won += 1;
      }
    });

    // 4. TARA TAX INSIGHTS (12% PPN, 25% Est Income Tax for Won deals)
    const totalWonRevenue = wonDeals.reduce((sum, op) => sum + op.value, 0);
    const estPPN = totalWonRevenue * 0.12;
    const estIncomeTax = (totalWonRevenue - estPPN) * 0.25; 
    const netProfit = totalWonRevenue - estPPN - estIncomeTax;

    return NextResponse.json({
      forecast: Object.values(forecast),
      velocity: {
        avgDaysToWon: Math.round(avgVelocity),
        totalWonCount: wonDeals.length
      },
      roi: Object.entries(sourceROI).map(([name, val]: any) => ({
        name,
        ...val,
        conversion: val.count > 0 ? (val.won / val.count * 100).toFixed(1) : 0
      })).sort((a: any, b: any) => b.revenue - a.revenue),
      taxIntelligence: {
        totalWonRevenue,
        estPPN,
        estIncomeTax,
        netProfit,
        profitMargin: totalWonRevenue > 0 ? (netProfit / totalWonRevenue * 100).toFixed(1) : 0
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
