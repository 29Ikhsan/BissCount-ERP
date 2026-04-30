'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/context/LanguageContext';

export default function PayslipPdfPreview() {
  const params = useParams();
  const id = params.id as string;
  const { formatCurrency } = useLanguage();
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const generatePdf = async () => {
      try {
        const res = await fetch(`/api/hrm/payroll/${id}`);
        if (!res.ok) throw new Error('Failed to fetch payroll data');
        const payroll = await res.json();
        const emp = payroll.employee;
        const tenant = payroll.tenant;

        // Initialize PDF
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Colors
        const primaryColor: [number, number, number] = [15, 59, 140]; 
        const darkGray: [number, number, number] = [51, 65, 85];      
        const lightGray: [number, number, number] = [241, 245, 249];  

        // 1. Header
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('CONFIDENTIAL PAYSLIP', 195, 25, { align: 'right' }); 

        // Company Info
        doc.setFontSize(14);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(tenant?.name || 'Company Name', 14, 25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        
        const addressLines = doc.splitTextToSize(tenant?.address || '', 80);
        doc.text(addressLines, 14, 31);
        
        // 2. Payslip Details Box
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.roundedRect(145, 33, 50, 25, 2, 2, 'F');
        
        doc.setFontSize(10);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Period:', 150, 40);
        doc.setFont('helvetica', 'normal');
        doc.text(`${payroll.month}/${payroll.year}`, 150, 45);

        doc.setFont('helvetica', 'bold');
        doc.text('Status:', 150, 52);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(16, 185, 129); // Green
        doc.text(payroll.status, 150, 57);

        // 3. Employee Info
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Information', 14, 45);
        doc.line(14, 47, 100, 47);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${emp.name}`, 14, 53);
        doc.text(`ID (NIK): ${emp.nik || emp.employeeId}`, 14, 58);
        doc.text(`Job Title: ${emp.jobTitle || 'N/A'}`, 14, 63);
        doc.text(`Department: ${emp.department || 'N/A'}`, 14, 68);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Bank Details', 80, 53);
        doc.setFont('helvetica', 'normal');
        doc.text(`Bank: ${emp.bankName || '-'}`, 80, 58);
        doc.text(`Account: ${emp.bankNumber || '-'}`, 80, 63);
        doc.text(`A/N: ${emp.bankHolder || '-'}`, 80, 68);

        // 4. Earnings and Deductions Table
        const earningsCol = ["Earnings", "Amount"];
        const earningsRows = [
          ["Basic Salary (Pro-rated)", formatCurrency(payroll.grossPay)],
          ["Allowances", formatCurrency(payroll.allowances)],
        ];

        if (payroll.thrBonus > 0) {
          earningsRows.push(["THR / Bonus / Severance", formatCurrency(payroll.thrBonus)]);
        }

        autoTable(doc, {
          startY: 85,
          head: [earningsCol],
          body: earningsRows,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 4 },
          columnStyles: {
            0: { cellWidth: 120 },
            1: { halign: 'right' }
          },
          margin: { right: 14 }
        });

        let finalY = (doc as any).lastAutoTable.finalY;
        const totalEarnings = payroll.grossPay + payroll.allowances + payroll.thrBonus;

        autoTable(doc, {
          startY: finalY,
          body: [["TOTAL EARNINGS", formatCurrency(totalEarnings)]],
          theme: 'plain',
          styles: { fontSize: 9, fontStyle: 'bold', fillColor: [241, 245, 249] },
          columnStyles: {
            0: { cellWidth: 120 },
            1: { halign: 'right' }
          },
          margin: { right: 14 }
        });

        finalY = (doc as any).lastAutoTable.finalY + 10;

        const deductionsCol = ["Deductions", "Amount"];
        const deductionsRows = [
          ["PPh 21 (Income Tax)", formatCurrency(payroll.pph21)],
          ["Pension / BPJS Deduction", formatCurrency(payroll.iuranPensiun)],
          ["Other Deductions", formatCurrency(payroll.deductions - payroll.iuranPensiun > 0 ? payroll.deductions - payroll.iuranPensiun : 0)],
        ];

        autoTable(doc, {
          startY: finalY,
          head: [deductionsCol],
          body: deductionsRows,
          theme: 'grid',
          headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 4 },
          columnStyles: {
            0: { cellWidth: 120 },
            1: { halign: 'right' }
          },
          margin: { right: 14 }
        });

        finalY = (doc as any).lastAutoTable.finalY;
        const totalDeductions = payroll.pph21 + payroll.deductions;

        autoTable(doc, {
          startY: finalY,
          body: [["TOTAL DEDUCTIONS", formatCurrency(totalDeductions)]],
          theme: 'plain',
          styles: { fontSize: 9, fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [239, 68, 68] },
          columnStyles: {
            0: { cellWidth: 120 },
            1: { halign: 'right' }
          },
          margin: { right: 14 }
        });

        finalY = (doc as any).lastAutoTable.finalY + 15;

        // 5. Net Pay
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(14, finalY, 181, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text('TAKE HOME PAY', 20, finalY + 10);
        doc.setFontSize(14);
        doc.text(formatCurrency(payroll.netPay), 190, finalY + 10, { align: 'right' });

        // 6. Footer
        finalY += 30;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text('This is a computer-generated document. No signature is required.', 105, finalY, { align: 'center' });
        doc.text(`Notes: ${payroll.notes || '-'}`, 105, finalY + 5, { align: 'center' });

        const pdfDataUri = doc.output('datauristring');
        setPdfUrl(pdfDataUri);
      } catch (err: any) {
        console.error('PDF Generation Error:', err);
        setError(err.message || 'Error generating PDF document.');
      }
    };

    generatePdf();
  }, [id, formatCurrency]);

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444', fontFamily: 'sans-serif' }}>
        <h2>Preview Unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#64748B', fontFamily: 'sans-serif' }}>
        <h2>Encrypting Payslip Data...</h2>
        <div style={{ margin: '20px auto', width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#0F3B8C', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#334155' }}>
      <iframe 
        src={pdfUrl} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Payslip PDF Preview"
      />
    </div>
  );
}
