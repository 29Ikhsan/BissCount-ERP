import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/access-server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { id } = await params
    
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { date: 'desc' },
          take: 10
        },
        purchaseOrders: {
          orderBy: { date: 'desc' },
          take: 10
        },
        opportunities: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Calculate aggregated financials
    const receivables = contact.invoices
      .filter(inv => ['PENDING', 'OVERDUE'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.grandTotal || inv.amount), 0)
    
    const payables = contact.purchaseOrders
      .filter(po => ['PENDING', 'APPROVED', 'SHIPPED'].includes(po.status))
      .reduce((sum, po) => sum + (po.grandTotal || po.amount), 0)

    return NextResponse.json({ 
      contact: {
        ...contact,
        receivables,
        payables,
        totalBalance: receivables - payables
      } 
    })
  } catch (error) {
    console.error('[Get Contact Detail Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { id } = await params
    const body = await req.json()
    
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        ...body,
        creditLimit: body.creditLimit !== undefined ? Number(body.creditLimit) : undefined
      }
    })

    return NextResponse.json({ success: true, contact: updatedContact })
  } catch (error: any) {
    console.error('[Update Contact Error]:', error)
    return NextResponse.json({ error: error.message || 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { id } = await params
    await prisma.contact.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Delete Contact Error]:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete contact' }, { status: 500 })
  }
}
