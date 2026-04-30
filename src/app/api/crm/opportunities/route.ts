import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

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

    const opportunities = await prisma.opportunity.findMany({
      where: { tenantId: tenant.id, ...dateFilter },
      include: { contact: true, lead: true },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(opportunities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json();
    const { title, value, stage, probability, expectedClose, contactId, leadId } = body;

    if (!title || value === undefined) {
      return NextResponse.json({ error: 'Title and Value are required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const opportunity = await prisma.opportunity.create({
      data: {
        title,
        value: Number(value),
        stage: stage || 'DISCOVERY',
        probability: Number(probability) || 10,
        expectedClose: expectedClose ? new Date(expectedClose) : null,
        contactId: contactId || null,
        leadId: leadId || null,
        tenantId: tenant.id
      }
    });

    return NextResponse.json(opportunity);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json();
    const { id, title, value, stage, probability, contactId, leadId, expectedClose } = body;

    if (!id) return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });

    const updated = await prisma.opportunity.update({
      where: { id },
      data: {
        title: title || undefined,
        value: value !== undefined ? Number(value) : undefined,
        stage: stage || undefined,
        probability: probability !== undefined ? Number(probability) : undefined,
        contactId: contactId === '' ? null : contactId || undefined,
        leadId: leadId === '' ? null : leadId || undefined,
        expectedClose: expectedClose ? new Date(expectedClose) : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
