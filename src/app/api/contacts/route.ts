import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: Create a new CRM Contact
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      type, role, name, email, phone, website, 
      currency, paymentTerms, address, city, postalCode, country,
      taxId, idType = "NPWP", idNumber, tkuId = "0000000000000000000000"
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
        taxId: taxId || null,
        idType,
        idNumber: idNumber || null,
        tkuId,
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

    // Mapping logic for UI display
    const contacts = contactsRaw.map((contact: any) => {
      const receivables = contact.invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0)
      const payables = contact.purchaseOrders.reduce((sum: number, po: any) => sum + po.amount, 0)
      
      const balance = receivables - payables;
      
      // Determine display type and styling
      let typeLabel = contact.role;
      let color = '#3B82F6'; // Default Blue
      let bg = '#DBEAFE';

      if (contact.role === 'Vendor') {
        color = '#F59E0B';
        bg = '#FEF3C7';
      } else if (contact.role === 'Both') {
        typeLabel = 'Customer & Vendor';
        color = '#8B5CF6'; // Purple
        bg = '#F3E8FF';
      } else if (contact.role === 'Employee') {
        color = '#10B981'; // Green
        bg = '#D1FAE5';
      }

      return {
        id: contact.id,
        code: contact.id.substring(0, 8).toUpperCase(),
        name: contact.name,
        type: typeLabel,
        role: contact.role,
        email: contact.email || '-',
        phone: contact.phone || '-',
        balance: balance,
        receivables,
        payables,
        creditLimit: contact.role === 'Customer' || contact.role === 'Both' ? 100000 : 0,
        color,
        bg,
      }
    })

    return NextResponse.json({ contacts }, { status: 200 })
  } catch (error) {
    console.error('[Get Contacts Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch CRM contacts' }, { status: 500 })
  }
}
