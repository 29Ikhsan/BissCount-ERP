import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/invoices/[id] — Record Payment or Update Status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { payment, status } = body

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: tenant.id }
    })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    // Handle payment recording
    if (payment !== undefined) {
      const paymentAmount = Number(payment)
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
      }

      const alreadyPaid = Number(invoice.paidAmount) || 0
      const newPaid = alreadyPaid + paymentAmount
      const grandTotal = Number(invoice.grandTotal)
      const newStatus = newPaid >= grandTotal ? 'PAID' : 'PARTIAL'

      const updated = await prisma.invoice.update({
        where: { id },
        data: {
          paidAmount: newPaid,
          status: newStatus
        }
      })

      return NextResponse.json({ success: true, invoice: updated })
    }

    // Handle direct status update
    if (status) {
      const updated = await prisma.invoice.update({
        where: { id },
        data: { status }
      })
      return NextResponse.json({ success: true, invoice: updated })
    }

    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  } catch (error) {
    console.error('[Patch Invoice Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET /api/invoices/[id] — Fetch single invoice with items
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const invoice = await prisma.invoice.findFirst({
      where: { tenantId: tenant.id, OR: [{ id }, { invoiceNo: id }] },
      include: {
        items: { include: { product: true, tax: true } },
        contact: true,
        costCenter: true
      }
    })

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ invoice })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}
