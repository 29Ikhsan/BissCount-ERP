import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const currencies = await prisma.currency.findMany({
      where: { tenantId: tenant.id },
      orderBy: { id: 'asc' }
    })

    return NextResponse.json({ currencies }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, name, rate } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'ISO Code and Name are required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const currency = await prisma.currency.upsert({
      where: {
        id_tenantId: {
          id,
          tenantId: tenant.id
        }
      },
      update: {
        name,
        rate: parseFloat(rate) || 0,
        lastUpdated: new Date()
      },
      create: {
        id,
        name,
        rate: parseFloat(rate) || 0,
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, currency }, { status: 201 })
  } catch (error) {
    console.error('[Currency Update Error]:', error)
    return NextResponse.json({ error: 'Failed to update currency config' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Currency ID is required' }, { status: 400 })

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    await prisma.currency.delete({
      where: {
        id_tenantId: {
          id,
          tenantId: tenant.id
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Currency revoked' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove currency' }, { status: 500 })
  }
}
