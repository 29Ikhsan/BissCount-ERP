import * as XLSX from 'xlsx';
import { create } from 'xmlbuilder2';

/**
 * UTILITY: CoreTax Export Library (AKSIA ERP)
 * Handles mapping of domain data to CoreTax-compliant XML and XLSX structures.
 */

// --- Types ---
export interface CoreTaxData {
  headers: string[];
  rows: any[][];
}

// --- XLSX Helpers ---
export function generateXlsxBuffer(data: CoreTaxData, extraSheets?: { name: string; data: CoreTaxData }[]): Buffer {
  const wb = XLSX.utils.book_new();
  
  // Main Sheet
  const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  // Extra Sheets (for multi-document formats like PPh 21)
  if (extraSheets) {
    extraSheets.forEach(sheet => {
      const extraWs = XLSX.utils.aoa_to_sheet([sheet.data.headers, ...sheet.data.rows]);
      XLSX.utils.book_append_sheet(wb, extraWs, sheet.name);
    });
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf;
}

// --- XML Helpers ---
export function generateXmlBuffer(rootName: string, data: any): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele(rootName, data);
  return doc.end({ prettyPrint: true });
}

// --- Mappers ---

/**
 * MAPPER: Invoice to PPN Keluaran (Sample Faktur PK v.1.4)
 */
export function mapInvoicesToPpn(invoices: any[]): CoreTaxData {
  const headers = [
    "Baris", "Tanggal Faktur", "Jenis Faktur", "Kode Transaksi", 
    "Keterangan Tambahan", "Dokumen Pendukung", "Period Dok Pendukung", 
    "Referensi", "Cap Fasilitas", "ID TKU Penjual", "NPWP/NIK Pembeli", 
    "Jenis ID Pembeli", "Negara Pembeli", "Nomor Dokumen Pembeli", 
    "Nama Pembeli", "Alamat Pembeli", "Email Pembeli", "ID TKU Pembeli"
  ];

  const rows = invoices.map((inv, index) => [
    (index + 1).toString(),
    inv.date, // Format should ideally be numeric for Excel date or YYYY-MM-DD
    inv.fakturType || "Normal",
    inv.transactionCode || "01",
    inv.additionalInfo || "",
    inv.supportDoc || "",
    inv.supportDocPeriod || "",
    inv.invoiceNo || inv.reference || "",
    inv.facilityCap || "",
    inv.sellerTkuId || "0000000000000000000000",
    inv.contact?.taxId || inv.contact?.idNumber || "",
    inv.contact?.idType || "TIN",
    inv.contact?.country || "IDN",
    "-",
    inv.contact?.name || inv.clientName || "",
    inv.contact?.address || "",
    inv.contact?.email || "",
    inv.contact?.tkuId || "0000000000000000000000"
  ]);

  return { headers, rows };
}

/**
 * MAPPER: Expense Items to BPPU (Bukti Pemotongan Unifikasi v.3)
 */
export function mapExpensesToBppu(expenseItems: any[]): CoreTaxData {
  const headers = [
    "Masa Pajak", "Tahun Pajak", "NPWP/NIK", "ID TKU Penerima", 
    "Fasilitas", "Kode Objek Pajak", "DPP", "Tarif", 
    "Jenis Dok. Referensi", "Nomor Dok. Referensi", "Tanggal Dok. Referensi", 
    "ID TKU Pemotong", "Opsi Pembayaran", "Nomor SP2D", "Tanggal Pemotongan"
  ];

  const rows = expenseItems.map(item => [
    item.expense.taxPeriod || (new Date(item.expense.date).getMonth() + 1),
    item.expense.taxYear || new Date(item.expense.date).getFullYear(),
    item.expense.contact?.taxId || item.expense.contact?.idNumber || "",
    item.expense.contact?.tkuId || "0000000000000000000000",
    item.facilityCap || "N/A",
    item.taxObjectCode || "22-100-07", // Default if missing
    item.amount,
    (item.whtRate / 100),
    "CommercialInvoice",
    item.expense.referenceCode || item.expense.id,
    item.expense.date,
    item.tkuId || "0000000000000000000000",
    "N/A",
    null,
    item.expense.date
  ]);

  return { headers, rows };
}

/**
 * MAPPER: Payroll to BPA1 (Annual Dec PPh 21 v.final)
 */
export function mapPayrollToBpa1(payrolls: any[]): CoreTaxData {
  const headers = [
    "No", "Start Month", "End Month", "Year", "Resident Status", "NPWP/NIK", 
    "PTKP Status", "Name", "Tax Object Code", "Income Type", "Salary", "Allowances", 
    "Honorarium", "Insurance", "Natura", "THR/Bonus", "Pension/THT", "Zakat", 
    "Prev Bupot Num", "Tax Facility", "PPh 21 Payable", "ID TKU Pemotong", "Tgl Pemotongan"
  ];

  const rows = payrolls.map((p, i) => [
    (i + 1),
    1, // Assuming full year for now or handle partial
    12,
    p.year,
    p.employee.workerStatus || "Resident",
    p.employee.npwp || p.employee.nik || "",
    p.employee.ptkpStatus || "TK/0",
    p.employee.name,
    "21-100-01",
    "Annualized",
    p.grossPay,
    p.allowances,
    0, // Honorarium
    p.jkkJkm || 0, // Insurance/Asuransi
    0, // Natura
    p.thrBonus || 0,
    p.iuranPensiun || 0,
    0, // Zakat
    null,
    p.employee.facilityCap || "N/A",
    p.pph21,
    p.employee.tkuId || "0000000000000000000000",
    new Date(p.createdAt).toISOString().split('T')[0]
  ]);

  return { headers, rows };
}

/**
 * MAPPER: Payroll to BP21 (PPh 21 Tahunan/Bulanan v.4)
 */
export function mapPayrollToBp21(payrolls: any[]): CoreTaxData {
  const headers = [
    "Masa Pajak", "Tahun Pajak", "Status Pegawai", "NPWP/NIK/TIN", 
    "Nomor Passport", "Status", "Posisi", "Sertifikat/Fasilitas", 
    "Kode Objek Pajak", "Penghasilan Kotor", "Tarif", "ID TKU", "Tgl Pemotongan"
  ];

  const rows = payrolls.map(p => [
    p.month,
    p.year,
    p.employee.workerStatus || "Resident",
    p.employee.npwp || p.employee.nik || "",
    p.employee.passportNo || null,
    p.employee.ptkpStatus || "TK/0",
    p.employee.jobTitle || "Staff",
    p.employee.facilityCap || "N/A",
    "21-100-01", // Code for permanent employees
    p.grossPay,
    (p.terRate / 100),
    p.employee.tkuId || "0000000000000000000000",
    new Date(p.createdAt).toISOString().split('T')[0]
  ]);

  return { headers, rows };
}
