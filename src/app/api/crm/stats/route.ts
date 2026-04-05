import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenantId = tenant.id;

    // Date Filtering Logic
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    const [leads, opportunities, campaigns] = await Promise.all([
      prisma.lead.findMany({ where: { tenantId, ...dateFilter } }),
      prisma.opportunity.findMany({ 
        where: { tenantId, ...dateFilter }, 
        include: { contact: true, lead: true },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.marketingCampaign.findMany({ where: { tenantId } })
    ]);

    // Calculate Pipeline Stats
    const totalPipeline = opportunities.reduce((acc, op) => acc + op.value, 0);
    const weightedPipeline = opportunities.reduce((acc, op) => acc + (op.value * (op.probability / 100)), 0);
    const activeLeads = leads.filter(l => l.status !== 'LOST' && l.status !== 'QUALIFIED').length;

    // Funnel Data
    const funnel = [
      { name: 'Leads', value: leads.length, color: '#3B82F6' },
      { name: 'Qualified', value: leads.filter(l => l.status === 'QUALIFIED').length, color: '#8B5CF6' },
      { name: 'Opportunities', value: opportunities.length, color: '#F59E0B' },
      { name: 'Won', value: opportunities.filter(op => op.stage === 'WON').length, color: '#10B981' }
    ];

    // Stage Distribution
    const stages = {
      DISCOVERY: 0, PROPOSAL: 0, NEGOTIATION: 0, WON: 0, LOST: 0
    };
    opportunities.forEach(op => {
      if (stages[op.stage as keyof typeof stages] !== undefined) {
        stages[op.stage as keyof typeof stages] += op.value;
      }
    });

    return NextResponse.json({
      totalPipeline,
      weightedPipeline,
      activeLeads,
      funnel,
      stages,
      recentDeals: opportunities.slice(0, 5),
      campaignCount: campaigns.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
