import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: { leads: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate ROI metrics for each campaign
    const enhancedCampaigns = await Promise.all(campaigns.map(async (c) => {
      const opportunities = await prisma.opportunity.findMany({
        where: {
          lead: { campaignId: c.id }
        }
      });

      const totalValue = opportunities.reduce((sum, op) => sum + op.value, 0);
      const wonValue = opportunities.filter(op => op.stage === 'WON').reduce((sum, op) => sum + op.value, 0);
      const leadCount = c._count.leads;

      return {
        ...c,
        totalValue,
        wonValue,
        leadCount,
        roi: c.actualSpend > 0 ? (wonValue / c.actualSpend * 1).toFixed(2) : 0
      };
    }));

    return NextResponse.json(enhancedCampaigns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await request.json();
    const { name, type, budget, actualSpend, status, startDate, endDate } = body;

    if (!name) return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });

    const campaign = await prisma.marketingCampaign.create({
      data: {
        name,
        type: type || 'OTHERS',
        status: status || 'PLANNING',
        budget: Number(budget) || 0,
        actualSpend: Number(actualSpend) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        tenantId: tenant.id
      }
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
