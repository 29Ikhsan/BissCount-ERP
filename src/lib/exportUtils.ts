import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/** 
 * Export Report Data to PDF using jsPDF and jspdf-autotable
 */
export const exportToPDF = (reportName: string, title: string, data: any[]) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(39, 156, 90); // Brand Green
  doc.text('Bizzcount ERP', 15, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text(title, 15, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 36);

  // Table Generation
  const tableHeaders = data[0] ? Object.keys(data[0]).map(k => k.toUpperCase()) : [];
  const tableRows = data.map(row => Object.values(row));

  autoTable(doc, {
    startY: 45,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [39, 156, 90], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 15, right: 15 },
  });

  doc.save(`${reportName.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};

/** 
 * Export Report Data to Excel (.xlsx) using xlsx library
 */
export const exportToExcel = (reportName: string, sheets: { name: string, data: any[] }[]) => {
  const wb = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    
    // Simple Column Width Auto-Adjustment
    const colWidths = sheet.data.length > 0 ? Object.keys(sheet.data[0]).map(key => ({
      wch: Math.max(key.length, ...sheet.data.map(row => String(row[key]).length)) + 2
    })) : [];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  XLSX.writeFile(wb, `${reportName.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`);
};

/** 
 * Helper to flatten nested report objects for tabular export
 */
export const flattenReportData = (periods: any[], reportType: 'bs' | 'pl' | 'cf') => {
  if (reportType === 'bs') {
    return periods.map(p => ({
      Period: p.label,
      Cash: p.bs.assets.cash,
      'Accounts Receivable': p.bs.assets.ar,
      Inventory: p.bs.assets.inventory,
      'Total Assets': p.bs.assets.total,
      'Accounts Payable': p.bs.liabilities.ap,
      'Taxes Payable': p.bs.liabilities.taxes,
      'Total Liabilities': p.bs.liabilities.total
    }));
  }
  
  if (reportType === 'pl') {
    return periods.map(p => ({
      Period: p.label,
      Revenue: p.pl.revenue,
      COGS: p.pl.cogs,
      Expenses: p.pl.expenses,
      'Net Profit': p.pl.netProfit
    }));
  }

  if (reportType === 'cf') {
    return periods.map(p => ({
      Period: p.label,
      'Net Income': p.cf.operating.netIncome,
      'Depr Adjustment': p.cf.operating.depreciation,
      'Δ AR': p.cf.operating.changeInAR,
      'Δ Inventory': p.cf.operating.changeInInv,
      'Δ Liabilities': p.cf.operating.changeInLiab,
      'Net Cash Operating': p.cf.operating.netCashOperating,
      'Net Cash Flow': p.cf.netCashChange
    }));
  }

  return [];
};
