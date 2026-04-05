import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { leadId } = await req.json();

    if (!leadId) return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { tenant: true }
    });

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // 1. Create a Contact from Lead
    const contact = await prisma.contact.create({
      data: {
        type: 'INDIVIDUAL',
        role: 'Customer',
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        tenantId: tenant.id
      }
    });

    // 2. Update Lead Status to QUALIFIED
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'QUALIFIED'
      }
    });

    return NextResponse.json({ 
      success: true, 
      contact, 
      lead: updatedLead 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
