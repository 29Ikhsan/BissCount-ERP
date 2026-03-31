import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: Create a new CRM Contact
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      type, role, name, email, phone, website, 
      currency, paymentTerms, address, city, postalCode, country 
    } = body

    // Validation
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and Type are required' }, { status: 400 })
    }

    // Workaround: Get default Tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      return NextResponse.json({ error: 'System Error: No Master Tenant Found' }, { status: 500 })
    }

    // Save Contact to Database
    // @ts-ignore
    const newContact = await prisma.contact.create({
      data: {
        type: type || 'COMPANY',
        role: role || 'Customer',
        name,
        email: email || null,
        phone: phone || null,
        website: website || null,
        currency: currency || 'USD',
        paymentTerms: paymentTerms || 'Due on Receipt',
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null,
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, contact: newContact }, { status: 201 })
  } catch (error) {
    console.error('[Create Contact Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET: Retrieve all Contacts with their real Outstanding Balance (Invoices AR / Purchase AP)
export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // Fetch Contacts and dynamically fetch their linked ledgers
    // @ts-ignore
    const contactsRaw = await prisma.contact.findMany({
      where: { tenantId: tenant.id },
      include: {
        invoices: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } }, // AR balance
          select: { amount: true }
        },
        purchaseOrders: {
          where: { status: { in: ['PENDING', 'APPROVED', 'SHIPPED'] } }, // AP balance
          select: { amount: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Compute balance (Invoices = Positive AR, Purchases = Negative AP)
    const contacts = contactsRaw.map((contact: any) => {
      const receivables = contact.invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0)
      const payables = contact.purchaseOrders.reduce((sum: number, po: any) => sum + po.amount, 0)
      
      const balance = receivables - payables;

      return {
        id: contact.id, // For UI row keys
        code: contact.id.substring(0, 8).toUpperCase(), // e.g. CUST-UUID
        name: contact.name,
        type: contact.role, // 'Customer', 'Vendor'
        email: contact.email || '-',
        phone: contact.phone || '-',
        balance: balance,
        creditLimit: contact.role === 'Customer' ? 100000 : 0, // Mock limit for now
        color: contact.role === 'Customer' ? '#3B82F6' : '#F59E0B',
        bg: contact.role === 'Customer' ? '#DBEAFE' : '#FEF3C7',
      }
    })

    return NextResponse.json({ contacts }, { status: 200 })
  } catch (error) {
    console.error('[Get Contacts Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch CRM contacts' }, { status: 500 })
  }
}
