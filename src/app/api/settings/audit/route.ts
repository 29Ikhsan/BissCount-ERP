import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAccess } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  try {
    const { authorized, session } = await checkAdminAccess();
    if (!authorized) {
      return NextResponse.json({ error: 'Access Denied: Admin authorization required.' }, { status: 403 });
    }

    const sessionTenantId = (session?.user as any)?.tenantId;
    const dbTenant = await prisma.tenant.findFirst({
      where: sessionTenantId ? { id: sessionTenantId } : {},
      select: { id: true }
    });
    const tenantId = dbTenant?.id;

    if (!tenantId) {
      return NextResponse.json({ error: 'No active institutional workspace found in system.' }, { status: 500 });
    }

    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('[Audit API Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch logs', details: error?.message }, { status: 500 });
  }
}
