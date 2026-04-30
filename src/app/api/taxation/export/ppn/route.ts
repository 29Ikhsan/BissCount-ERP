import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapInvoicesToPpn, generateXlsxBuffer, generateXmlBuffer } from '@/lib/taxation/coretax-export';

/**
 * API: CoreTax Export for PPN Keluaran
 * Supports XML and XLSX formats.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const format = searchParams.get('format') || 'xlsx';

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // 1. Aggregation Logic
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
        contact: true,
        items: true
      },
      orderBy: { date: 'asc' }
    });

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'No VAT data found for this period' }, { status: 404 });
    }

    // 2. Generation Logic
    if (format === 'xml') {
      const xmlData = {
        FakturPajak: {
          Header: {
            NPWPPemotong: tenant.taxId || "000000000000000",
            MasaPajak: month,
            TahunPajak: year,
          },
          DaftarFaktur: invoices.map(inv => ({
            Faktur: {
              NomorFaktur: inv.invoiceNo,
              TanggalFaktur: inv.date.toISOString().split('T')[0],
              NamaPembeli: inv.contact?.name || inv.clientName,
              NPWPPembeli: inv.contact?.taxId || "000000000000000",
              DPP: inv.grandTotal - inv.taxAmount,
              PPN: inv.taxAmount
            }
          }))
        }
      };
      
      const xmlString = generateXmlBuffer('CoreTaxExport', xmlData);
      
      return new NextResponse(xmlString, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="PPN_Keluaran_${month}_${year}.xml"`
        }
      });
    } else {
      // DEFAULT: XLSX (Excel)
      const coreTaxData = mapInvoicesToPpn(invoices);
      const buffer = generateXlsxBuffer(coreTaxData);
      const uint8 = new Uint8Array(buffer);

      return new NextResponse(uint8, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="PPN_Keluaran_${month}_${year}.xlsx"`
        }
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
