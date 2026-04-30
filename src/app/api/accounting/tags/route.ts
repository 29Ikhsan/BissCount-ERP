import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tags = await prisma.costCenter.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(tags);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
