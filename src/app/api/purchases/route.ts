import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { supplier, contactId, date, expectedDate, amount } = body

    if (!supplier || !date || typeof amount === 'undefined') {
      return NextResponse.json({ error: 'Missing required PO configuration fields.' }, { status: 400 })
    }

    // Workaround: Get default Tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      return NextResponse.json({ error: 'System Error: No Master Tenant Found' }, { status: 500 })
    }

    // Auto generate PO Number
    const count = await prisma.purchaseOrder.count({ where: { tenantId: tenant.id } })
    const poNumber = `PO-${new Date().toISOString().slice(0, 4)}-${String(count + 1).padStart(3, '0')}`

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplier,
        date: new Date(date),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        ...(contactId ? { contactId } : {}),
        // @ts-ignore - Prisma types catch up later
        amount: parseFloat(amount) || 0,
        status: 'PENDING',
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, purchaseOrder }, { status: 201 })
  } catch (error) {
    console.error('[Create PO Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { tenantId: tenant.id },
      orderBy: { date: 'desc' },
      take: 100
    })

    return NextResponse.json({ purchaseOrders }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}
