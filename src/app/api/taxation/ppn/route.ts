import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenantId = tenant.id;

    // Period Filtering Logic
    const whereClause: any = { 
      tenantId: tenant.id,
      taxAmount: { gt: 0 } 
    };
    
    if (month && year) {
      whereClause.taxPeriod = parseInt(month);
      whereClause.taxYear = parseInt(year);
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: { 
        contact: true 
      },
      orderBy: { date: 'asc' }
    });

    const ppnData = invoices.map(inv => {
      const isComplete = inv.contact?.taxId && inv.contact?.taxId !== '';
      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        date: inv.date,
        clientName: inv.clientName,
        npwp: inv.contact?.taxId || 'Missing NPWP',
        address: inv.contact?.address || 'Missing Address',
        dpp: inv.grandTotal - inv.taxAmount, // Dasar Pengenaan Pajak
        ppn: inv.taxAmount,
        status: isComplete ? 'READY' : 'INCOMPLETE'
      };
    });

    return NextResponse.json(ppnData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
