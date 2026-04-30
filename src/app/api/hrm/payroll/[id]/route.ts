import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { id } = await params;
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const payroll = await prisma.payroll.findUnique({
      where: { 
        id,
        tenantId: tenant.id
      },
      include: {
        employee: true,
        tenant: true
      }
    });

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    return NextResponse.json(payroll);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
