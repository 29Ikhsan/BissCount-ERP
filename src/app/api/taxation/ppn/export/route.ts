import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { create } from 'xmlbuilder2';

export async function POST(request: NextRequest) {
  try {
    const { month, year, format } = await request.json();

    if (!month || !year || !format) {
      return NextResponse.json({ error: 'Missing parameters (month/year/format)' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant record not initialized' }, { status: 404 });

    // Fetch Invoices with PPN for the period (Include items for DetailFaktur)
    const invoices = await prisma.invoice.findMany({
      where: { 
        tenantId: tenant.id, 
        taxPeriod: parseInt(month),
        taxYear: parseInt(year),
        taxAmount: { gt: 0 } 
      },
      include: { 
        contact: true,
        items: true 
      },
      orderBy: { date: 'asc' }
    });

    if (format === 'xls') {
      const workbook = XLSX.utils.book_new();

      // --- SHEET 1: Faktur Header ---
      const fakturHeaders = [
        ["NPWP Penjual", null, tenant.taxId || "1090000000002325"],
        [],
        ["Baris", "Tanggal Faktur", "Jenis Faktur", "Kode Transaksi", "Keterangan Tambahan", "Dokumen Pendukung", "Period Dok Pendukung", "Referensi", "Cap Fasilitas", "ID TKU Penjual", "NPWP/NIK Pembeli", "Jenis ID Pembeli", "Negara Pembeli", "Nomor Dokumen Pembeli", "Nama Pembeli", "Alamat Pembeli", "Email Pembeli", "ID TKU Pembeli"]
      ];

      const fakturRows = invoices.map((inv, idx) => [
        idx + 1,
        new Date(inv.date).toLocaleDateString('id-ID'), // DD/MM/YYYY
        (inv as any).fakturType || "Normal",
        (inv as any).transactionCode || "01",
        (inv as any).additionalInfo || null,
        (inv as any).supportDoc || null,
        (inv as any).supportDocPeriod || null,
        inv.invoiceNo, // Referensi
        (inv as any).facilityCap || null,
        (inv as any).sellerTkuId || "0000000000000000000000",
        inv.contact?.taxId || inv.contact?.idNumber || "000000000000000",
        (inv.contact as any)?.idType || "NPWP",
        inv.contact?.country || "IDN",
        "-", // Nomor Dokumen Pembeli
        inv.clientName,
        inv.contact?.address || "-",
        inv.contact?.email || "-",
        (inv.contact as any)?.tkuId || "0000000000000000000000"
      ]);

      const fakturSheet = XLSX.utils.aoa_to_sheet([...fakturHeaders, ...fakturRows]);
      XLSX.utils.book_append_sheet(workbook, fakturSheet, "Faktur");

      // --- SHEET 2: DetailFaktur (Items) ---
      const detailHeaders = [
        ["Baris", "Barang/Jasa", "Kode Barang Jasa", "Nama Barang/Jasa", "Nama Satuan Ukur", "Harga Satuan", "Jumlah Barang Jasa", "Total Diskon", "DPP", "DPP Nilai Lain", "Tarif PPN", "PPN", "Tarif PPnBM", "PPnBM"]
      ];

      const detailRows: any[] = [];
      invoices.forEach((inv, invIdx) => {
        inv.items.forEach((item) => {
          detailRows.push([
            invIdx + 1, // Linking back to Faktur row
            (item as any).itemType || "A",
            (item as any).sku || "000000",
            item.description,
            (item as any).uomCode || "UM.0002",
            item.unitPrice,
            item.quantity,
            0, // Diskon
            item.total, // DPP
            (item as any).baseValueOther || 0,
            (item as any).ppnRate || 12,
            item.taxAmount, // PPN
            (item as any).ppnbmRate || 0,
            (item as any).ppnbmAmount || 0
          ]);
        });
      });

      const detailSheet = XLSX.utils.aoa_to_sheet([...detailHeaders, ...detailRows]);
      XLSX.utils.book_append_sheet(workbook, detailSheet, "DetailFaktur");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=Faktur_PK_${month}_${year}.xlsx`
        }
      });
    }

    if (format === 'xml') {
      // e-Faktur v1.6.1 XML (Reconstructed for Faktur PK)
      const root = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('FakturPK')
          .ele('Header')
            .ele('NPWPPenjual').txt(tenant.taxId || "1090000000002325").up()
            .ele('MasaPajak').txt(month).up()
            .ele('TahunPajak').txt(year).up()
          .up()
          .ele('DaftarFaktur');

      invoices.forEach(inv => {
        const fakturNode = root.ele('Faktur')
          .ele('FakturNo').txt(inv.invoiceNo).up()
          .ele('TanggalFaktur').txt(new Date(inv.date).toLocaleDateString('id-ID')).up()
          .ele('JenisFaktur').txt((inv as any).fakturType || 'Normal').up()
          .ele('KodeTransaksi').txt((inv as any).transactionCode || '01').up()
          .ele('NPWPPembeli').txt(inv.contact?.taxId || '000000000000000').up()
          .ele('NamaPembeli').txt(inv.clientName).up()
          .ele('AlamatPembeli').txt(inv.contact?.address || '-').up()
          .ele('DetailItems');

        inv.items.forEach(item => {
          fakturNode.ele('Item')
            .ele('Nama').txt(item.description).up()
            .ele('HargaSatuan').txt(item.unitPrice.toString()).up()
            .ele('Jumlah').txt(item.quantity.toString()).up()
            .ele('DPP').txt(item.total.toString()).up()
            .ele('PPN').txt(item.taxAmount.toString()).up()
          .up();
        });
        fakturNode.up();
      });

      const xml = root.end({ prettyPrint: true });

      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename=Faktur_PK_${month}_${year}.xml`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
