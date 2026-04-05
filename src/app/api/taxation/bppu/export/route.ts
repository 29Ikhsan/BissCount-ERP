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

    // Fetch Expenses with Withholding for the period
    const expenses = await prisma.expense.findMany({
      where: { 
        tenantId: tenant.id, 
        taxPeriod: parseInt(month),
        taxYear: parseInt(year),
        items: {
          some: {
            whtAmount: { gt: 0 }
          }
        }
      },
      include: { 
        contact: true,
        items: {
          where: { whtAmount: { gt: 0 } }
        }
      },
      orderBy: { date: 'asc' }
    });

    if (format === 'xls') {
      const workbook = XLSX.utils.book_new();

      // --- SHEET: DATA ---
      const headers = [
        ["NPWP Pemotong", tenant.taxId || "3172022407981234"],
        [],
        [],
        [null, "Masa Pajak", "Tahun Pajak", "Status Pegawai", "NPWP/NIK/TIN", "Nomor Passport", "Status", "Posisi", "Sertifikat/Fasilitas", "Kode Objek Pajak", "Penghasilan Kotor", "Tarif", "ID TKU", "Tgl Pemotongan", null, "TER A", "TER B", "TER C"]
      ];

      const dataRows: any[] = [];
      expenses.forEach((expense) => {
        expense.items.forEach((item) => {
          dataRows.push([
            null,
            expense.taxPeriod,
            expense.taxYear,
            item.workerStatus || "Resident",
            expense.contact?.taxId || expense.contact?.idNumber || "3172024806201234",
            item.passportNo || null,
            item.ptkpStatus || "TK/0",
            item.position || "N/A",
            item.facilityCap || "N/A",
            item.taxObjectCode || "24-101-01", // Default to Dividen if null
            item.amount, // Penghasilan Kotor
            item.whtRate,
            item.tkuId || "0000000000000000000000",
            Math.floor(new Date(expense.date).getTime() / (24 * 60 * 60 * 1000) + 25569), // Excel Date format
            null,
            0, // TER A
            0, // TER B
            0  // TER C
          ]);
        });
      });

      const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "DATA");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=BPPU_Unifikasi_${month}_${year}.xlsx`
        }
      });
    }

    if (format === 'xml') {
      // e-Bupot Unifikasi XML (Reconstructed for BPPU)
      const root = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('Unifikasi')
          .ele('Header')
            .ele('NPWPPemotong').txt(tenant.taxId || "3172022407981234").up()
            .ele('MasaPajak').txt(month).up()
            .ele('TahunPajak').txt(year).up()
          .up()
          .ele('DaftarBPPU');

      expenses.forEach(expense => {
        expense.items.forEach(item => {
          root.ele('BPPU')
            .ele('NoBukti').txt(`BUPOT-${expense.id.substring(0,8)}`).up()
            .ele('TglBukti').txt(new Date(expense.date).toISOString().split('T')[0]).up()
            .ele('Identitas')
              .ele('NPWP').txt(expense.contact?.taxId || "000000000000000").up()
              .ele('Nama').txt(expense.merchant).up()
            .up()
            .ele('Pajak')
              .ele('KodeObjekPajak').txt(item.taxObjectCode || "24-101-01").up()
              .ele('PenghasilanBruto').txt(item.amount.toString()).up()
              .ele('Tarif').txt(item.whtRate.toString()).up()
              .ele('PPhDipotong').txt(item.whtAmount.toString()).up()
            .up()
          .up();
        });
      });

      const xml = root.end({ prettyPrint: true });

      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename=BPPU_Unifikasi_${month}_${year}.xml`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
