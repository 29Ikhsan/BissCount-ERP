import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get('month') || '0');
    const year = parseInt(url.searchParams.get('year') || '0');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and Year parameters required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const expenses = await prisma.expense.findMany({
      where: {
        tenantId: tenant.id,
        taxPeriod: month,
        taxYear: year
      },
      include: {
        contact: true,
        items: true
      }
    });

    const tenantNpwp = tenant.taxId?.replace(/[^0-9]/g, '') || '0000000000000000';
    const tenantTku = tenant.tkuId || (tenantNpwp + '000000'); // Use configured NITKU or legacy fallback

    // DJP BPPU Template Structure
    const wsData: any[][] = [];
    
    // Row 1: NPWP Pemotong (Cell A1, C1)
    wsData.push(['NPWP Pemotong', null, tenantNpwp]);
    // Row 2: Empty
    wsData.push([]);
    // Row 3: Headers (offset by 1 column)
    wsData.push([
      null,
      'Masa Pajak',
      'Tahun Pajak',
      'NPWP',
      'ID TKU Penerima Penghasilan',
      'Fasilitas',
      'Kode Objek Pajak',
      'DPP',
      'Tarif',
      'Jenis Dok. Referensi',
      'Nomor Dok. Referensi',
      'Tanggal Dok. Referensi',
      'ID TKU Pemotong',
      'Opsi Pembayaran (IP)',
      'Nomor SP2D (IP)',
      'Tanggal Pemotongan'
    ]);

    for (const exp of expenses) {
      if (!exp.contact) continue; // Must have merchant mapped to contact
      
      const vendorNpwp = exp.contact.taxId?.replace(/[^0-9]/g, '') || '0000000000000000';
      const vendorTku = exp.contact.tkuId || (vendorNpwp + '000000');
      
      for (const item of exp.items) {
        if (item.whtRate > 0) { // Only Unifikasi items
          const itemDate = new Date(exp.date);
          // Format excel serial date or use standard string. DJP XLS accepts numbers as excel serial or text. We use text for safety.
          const dateStr = itemDate.toISOString().split('T')[0];

          wsData.push([
            null,
            month,
            year,
            vendorNpwp,
            vendorTku,
            item.facilityCap || 'N/A',
            item.taxObjectCode || '24-104-01', // Default to Jasa PPh 23
            item.total, // DPP
            item.whtRate / 100, // Tarif in decimal (e.g., 0.02 for 2%)
            'CommercialInvoice',
            exp.referenceCode || `EXP-${exp.id.substring(0, 8)}`,
            dateStr,
            tenantTku,
            'N/A', // Opsi IP
            null, // SP2D
            dateStr
          ]);
        }
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BPPU");
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="BPPU_Excel_to_XML_${month}_${year}.xlsx"`
      }
    });

  } catch (error: any) {
    console.error("XLS BPPU Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
