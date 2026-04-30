import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: { leads: true }
        },
        leads: true // Fetch actual leads to calculate their values
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate ROI metrics for each campaign
    const enhancedCampaigns = campaigns.map((c) => {
      const allLeads = c._count ? (c as any).leads || [] : [];
      
      // We sum the value of ALL leads to get total pipeline
      const totalValue = allLeads.reduce((sum: number, l: any) => sum + (l.value || 0), 0);
      
      // We only count 'QUALIFIED' leads as 'WON REVENUE' (Since QUALIFIED promotes to Customer)
      const wonValue = allLeads.filter((l: any) => l.status === 'QUALIFIED').reduce((sum: number, l: any) => sum + (l.value || 0), 0);
      
      const leadCount = c._count.leads;

      return {
        ...c,
        totalValue,
        wonValue,
        leadCount,
        roi: c.actualSpend > 0 ? ((wonValue / c.actualSpend) * 100).toFixed(2) : 0
      };
    });

    return NextResponse.json(enhancedCampaigns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

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
