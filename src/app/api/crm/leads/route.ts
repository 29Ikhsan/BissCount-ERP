import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const leads = await prisma.lead.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      include: { campaign: true }
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json();
    const { name, email, phone, company, status, source, value, campaignId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        company,
        status: status || 'NEW',
        source,
        value: Number(value) || 0,
        campaignId,
        tenantId: tenant.id
      }
    });

    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
