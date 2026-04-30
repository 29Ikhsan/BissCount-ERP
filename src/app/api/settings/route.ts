import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/access-server';

export async function GET() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst()
    const user = await prisma.user.findFirst()

    if (!tenant || !user) {
      return NextResponse.json({ error: 'No workspace context found' }, { status: 404 })
    }

    return NextResponse.json({ 
      tenant: {
        name: tenant.name,
        taxId: tenant.taxId || '',
        tkuId: tenant.tkuId || '0000000000000000000000',
        address: tenant.address || '',
        fiscalYear: tenant.fiscalYear || 'January to December',
        inventoryMethod: (tenant as any).inventoryMethod || 'AVERAGE',
        logoUrl: tenant.logoUrl || ''
      },
      user: {
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle || 'Senior Financial Controller',
        timezone: user.timezone || 'Eastern Standard Time (EST) - GMT-5',
        avatarUrl: user.avatarUrl || 'https://i.pravatar.cc/150?u=alex',
        notifications: user.notifications || {}
      }
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { type, data } = body

    const tenant = await prisma.tenant.findFirst()
    const user = await prisma.user.findFirst()

    if (!tenant || !user) return NextResponse.json({ error: 'No workspace context' }, { status: 404 })

    if (type === 'profile') {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name,
          email: data.email,
          jobTitle: data.jobTitle,
          timezone: data.timezone,
          notifications: data.notifications
        }
      })
      return NextResponse.json({ success: true, user: updatedUser })
    }

    if (type === 'organization') {
      const updatedTenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          name: data.name,
          taxId: data.taxId,
          tkuId: data.tkuId,
          address: data.address,
          fiscalYear: data.fiscalYear,
          inventoryMethod: data.inventoryMethod,
          logoUrl: data.logoUrl
        } as any
      })
      return NextResponse.json({ success: true, tenant: updatedTenant })
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
  } catch (error) {
    console.error('[Settings Update Error]:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
