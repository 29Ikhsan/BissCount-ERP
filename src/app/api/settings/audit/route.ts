import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const logs = await prisma.auditLog.findMany({
      where: { 
        tenantId: tenant.id
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
      take: 100 // Limit for performance
    })

    return NextResponse.json({ logs }, { status: 200 })
  } catch (error: any) {
    console.error('Fetch Audit Logs Error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
