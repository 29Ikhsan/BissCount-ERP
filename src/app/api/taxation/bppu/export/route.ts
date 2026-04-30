import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapExpensesToBppu, generateXlsxBuffer, generateXmlBuffer } from '@/lib/taxation/coretax-export';
import { requireSession } from '@/lib/access-server';

/**
 * API: CoreTax Export for PPH Unifikasi (BPPU)
 * Supports XML and XLSX formats.
 */

export async function POST(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { month, year, format } = await request.json();

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // 1. Aggregation Logic - BPPU comes from ExpenseItems with withholding tax
    const expenseItems = await prisma.expenseItem.findMany({
      where: {
        expense: {
          tenantId: tenant.id,
          taxPeriod: month,
          taxYear: year
        },
        whtAmount: { gt: 0 }
      },
      include: {
        expense: {
          include: { contact: true }
        }
      },
      orderBy: { expense: { date: 'asc' } }
    });

    if (expenseItems.length === 0) {
      return NextResponse.json({ error: 'No withholding tax data found for this period' }, { status: 404 });
    }

    // 2. Generation Logic
    if (format === 'xml') {
      const xmlData = {
        BupotUnifikasi: {
          Header: {
            NPWPPemotong: tenant.taxId || "000000000000000",
            MasaPajak: month,
            TahunPajak: year,
          },
          DaftarBupot: expenseItems.map(item => ({
            Bupot: {
              IDBupot: item.id,
              NamaPenerima: item.expense.contact?.name || item.expense.merchant,
              NPWPPenerima: item.expense.contact?.taxId || "000000000000000",
              KodeObjekPajak: item.taxObjectCode || "22-100-07",
              DPP: item.amount,
              PPH: item.whtAmount
            }
          }))
        }
      };
      
      const xmlString = generateXmlBuffer('CoreTaxBPPU', xmlData);
      
      return new NextResponse(xmlString, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="BPPU_Unifikasi_${month}_${year}.xml"`
        }
      });
    } else {
      // DEFAULT: XLSX (Excel)
      const coreTaxData = mapExpensesToBppu(expenseItems);
      const buffer = generateXlsxBuffer(coreTaxData);
      const uint8 = new Uint8Array(buffer);

      return new NextResponse(uint8, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="BPPU_Unifikasi_${month}_${year}.xlsx"`
        }
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
