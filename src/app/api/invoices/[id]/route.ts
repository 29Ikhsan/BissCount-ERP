import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/access-server';

// PATCH /api/invoices/[id] — Record Payment or Update Full Document
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { id } = await params
    const body = await req.json()
    const { 
      payment, 
      status,
      clientName,
      contactId,
      costCenterId,
      date,
      dueDate,
      items,
      discountAmount,
      isVatTaxable,
      whtAmount,
      whtRate,
      invoiceNo // Optional: if user wants to change reference
    } = body

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: tenant.id }
    })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    // A. Handle simple payment recording
    if (payment !== undefined && items === undefined) {
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

    // B. Handle full document update (Items, Dates, etc.)
    if (items && Array.isArray(items)) {
      const updatedInvoice = await prisma.$transaction(async (tx) => {
        let subtotal = 0
        let totalTax = 0

        const invoiceItems = items.map((item: any) => {
          const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
          const itemTaxBase = isVatTaxable ? (itemSubtotal * (11/12)) : itemSubtotal
          const itemTax = itemTaxBase * ((Number(item.taxRate) || 0) / 100)
          
          subtotal += itemSubtotal
          totalTax += itemTax

          return {
            sku: item.sku || "000000",
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            taxId: item.taxId || null,
            taxRate: Number(item.taxRate) || 0,
            taxAmount: itemTax,
            total: itemSubtotal,
            productId: item.productId || null,
            itemType: item.itemType || "A",
            uomCode: item.uomCode || "UM.0002"
          }
        })

        const grandTotal = subtotal + totalTax - (Number(discountAmount) || 0)

        // 1. Delete old items
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })

        // 2. Update Invoice Header
        return await tx.invoice.update({
          where: { id },
          data: {
            clientName: clientName || invoice.clientName,
            invoiceNo: invoiceNo || invoice.invoiceNo,
            date: date ? new Date(date) : invoice.date,
            dueDate: dueDate ? new Date(dueDate) : invoice.dueDate,
            amount: subtotal,
            taxAmount: totalTax,
            discountAmount: Number(discountAmount) ?? invoice.discountAmount,
            whtAmount: Number(whtAmount) ?? invoice.whtAmount,
            whtRate: Number(whtRate) ?? invoice.whtRate,
            grandTotal: grandTotal,
            status: status || invoice.status,
            contactId: contactId || invoice.contactId,
            costCenterId: costCenterId || invoice.costCenterId,
            items: { create: invoiceItems }
          },
          include: { items: true }
        })
      })

      return NextResponse.json({ success: true, invoice: updatedInvoice })
    }

    // C. Handle direct status update (Cancel, etc.)
    if (status && !items) {
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
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { id } = await params
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const invoice = await prisma.invoice.findFirst({
      where: { tenantId: tenant.id, OR: [{ id }, { invoiceNo: id }] },
      include: {
        items: { include: { product: true, tax: true } },
        contact: true,
        costCenter: true,
        tenant: true
      }
    })

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ invoice })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}
