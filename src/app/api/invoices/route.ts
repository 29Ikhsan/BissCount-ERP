import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientName, contactId, date, dueDate, items } = body

    // Validate request
    if (!clientName || !date || !dueDate || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Workaround: Get the default Tenant since Authentication (Session/JWT) is not fully active yet
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      return NextResponse.json({ error: 'System Error: No Master Tenant Found' }, { status: 500 })
    }

    // Auto-generate invoice number (Example: INV-20240325-001)
    const count = await prisma.invoice.count({ where: { tenantId: tenant.id } })
    const invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`

    // Calculate Grand Total from items
    const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0)

    // Using Prisma Transaction to ensure Invoice and InvoiceItems are created together
    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        clientName,
        date: new Date(date),
        dueDate: new Date(dueDate),
        amount: totalAmount,
        status: 'PENDING',
        tenantId: tenant.id,
        ...(contactId ? { contactId } : {}),
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.quantity) * Number(item.unitPrice),
            ...(item.productId ? { productId: item.productId } : {}) // optional product mapping
          }))
        }
      },
      include: {
        items: true
      }
    })

    return NextResponse.json({ success: true, invoice: newInvoice }, { status: 201 })
  } catch (error) {
    console.error('[Create Invoice Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const invoices = await prisma.invoice.findMany({
      where: { tenantId: tenant.id },
      include: { items: true },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ invoices }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
