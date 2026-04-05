import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // 1. Search Accounts (by Code or Name)
    const accounts = await prisma.account.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5
    });

    // 2. Search Invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { invoiceNo: { contains: query, mode: 'insensitive' } },
          { clientName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5
    });

    // 3. Search Contacts
    const contacts = await prisma.contact.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5
    });

    // Format Results
    const results = [
      ...accounts.map(a => ({ id: a.id, title: `${a.code} - ${a.name}`, type: 'ACCOUNT', path: `/settings/coa` })),
      ...invoices.map(i => ({ id: i.id, title: i.invoiceNo, subtitle: i.clientName, type: 'INVOICE', path: `/invoices` })),
      ...contacts.map(c => ({ id: c.id, title: c.name, subtitle: c.role, type: 'CONTACT', path: `/contacts` })),
    ];

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
