import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapPayrollToBp21, mapPayrollToBpa1, generateXlsxBuffer, generateXmlBuffer } from '@/lib/taxation/coretax-export';
import { requireSession } from '@/lib/access-server';

/**
 * API: CoreTax Export for PPH 21 (BP21 or BPA1)
 * Supports Monthly (BP21) and Annual (BPA1) exports.
 */

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');
    const format = searchParams.get('format') || 'xlsx';

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // 1. Aggregation Logic
    // If month 12, we might need BPA1 (Annual). For now, let's export the monthly PPh 21 (BP21).
    const payrolls = await prisma.payroll.findMany({
      where: {
        tenantId: tenant.id,
        month,
        year
      },
      include: {
        employee: true
      },
      orderBy: { employee: { name: 'asc' } }
    });

    if (payrolls.length === 0) {
      return NextResponse.json({ error: 'No payroll data found for this period' }, { status: 404 });
    }

    // 2. Generation Logic
    const isBPA1 = month === 12; // Simplified logic: Dec is annual month.
    const filename = isBPA1 ? `CoreTax_BPA1_${year}` : `CoreTax_BP21_${month}_${year}`;

    if (format === 'xml') {
      const xmlData = {
        PPh21Export: {
          Header: {
            NPWPPemotong: tenant.taxId || "000000000000000",
            MasaPajak: month,
            TahunPajak: year,
            JenisLaporan: isBPA1 ? 'ANNUAL' : 'MONTHLY'
          },
          DaftarPemotongan: payrolls.map(p => ({
            Bupot21: {
              IDBupot: p.id,
              NamaPegawai: p.employee.name,
              NPWPPegawai: p.employee.npwp || p.employee.nik || "000000000000000",
              Bruto: p.grossPay + p.allowances,
              PPh21: p.pph21,
              TER: p.terCategory || "N/A"
            }
          }))
        }
      };
      
      const xmlString = generateXmlBuffer('CoreTaxPPh21', xmlData);
      
      return new NextResponse(xmlString, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="${filename}.xml"`
        }
      });
    } else {
      // DEFAULT: XLSX (Excel)
      const coreTaxData = isBPA1 ? mapPayrollToBpa1(payrolls) : mapPayrollToBp21(payrolls);
      const buffer = generateXlsxBuffer(coreTaxData);
      const uint8 = new Uint8Array(buffer);

      return new NextResponse(uint8, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`
        }
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
