import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const rules = await prisma.bankRule.findMany({
      where: { tenantId: tenant.id },
      include: { targetAccount: true, costCenter: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ rules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json();
    const { name, keywords, condition, type, targetAccountId, costCenterId } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const newRule = await prisma.bankRule.create({
      data: {
        name,
        keywords: keywords.toUpperCase(),
        condition: condition || 'CONTAINS',
        type: type || 'BOTH',
        targetAccountId,
        costCenterId: costCenterId || null,
        tenantId: tenant.id
      },
      include: { targetAccount: true, costCenter: true }
    });

    return NextResponse.json({ success: true, rule: newRule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
