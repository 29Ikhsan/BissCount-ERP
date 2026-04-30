'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/context/LanguageContext';
import { Settings, Download, Printer, Palette } from 'lucide-react';

type ThemeType = 'corporate' | 'modern' | 'minimalist';

export default function InvoicePdfPreview() {
  const params = useParams();
  const id = params.id as string;
  const { formatCurrency } = useLanguage();
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeType>('corporate');
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);

  // 1. Fetch Data Once
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error('Failed to fetch invoice data');
        const data = await res.json();
        setInvoiceData(data.invoice);
      } catch (err: any) {
        setError(err.message || 'Error fetching data.');
      }
    };
    fetchData();
  }, [id]);

  // 2. Generate PDF whenever theme or data changes
  useEffect(() => {
    if (!invoiceData) return;

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const inv = invoiceData;

      // Theme Configurations
      let primaryColor: [number, number, number] = [15, 59, 140]; // Corporate Blue
      let textColor: [number, number, number] = [51, 65, 85];
      let tableTheme: 'grid' | 'striped' | 'plain' = 'grid';
      let showBgBox = true;

      if (activeTheme === 'modern') {
        primaryColor = [16, 185, 129]; // Emerald Green
        tableTheme = 'striped';
        showBgBox = false;
      } else if (activeTheme === 'minimalist') {
        primaryColor = [0, 0, 0]; // Black
        textColor = [0, 0, 0];
        tableTheme = 'plain';
        showBgBox = false;
      }

      // 1. Header
      doc.setFontSize(24);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', activeTheme === 'minimalist' ? 'normal' : 'bold');
      
      if (activeTheme === 'modern') {
         doc.text('INVOICE', 14, 25);
      } else {
         doc.text('INVOICE', 195, 25, { align: 'right' });
      }

      // Company Info
      doc.setFontSize(14);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      
      const compLabelX = activeTheme === 'modern' ? 195 : 14;
      const alignConfig = activeTheme === 'modern' ? { align: 'right' as any } : undefined;

      doc.text(inv.tenant?.name || 'Your Company Name', compLabelX, activeTheme === 'modern' ? 35 : 25, alignConfig);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      
      const addressLines = doc.splitTextToSize(inv.tenant?.address || 'Silakan atur alamat perusahaan Anda.', 80);
      doc.text(addressLines, compLabelX, activeTheme === 'modern' ? 41 : 31, alignConfig);
      
      const addressYOffset = (activeTheme === 'modern' ? 41 : 31) + (addressLines.length * 4);
      doc.text(`NPWP: ${inv.tenant?.taxId || '-'}`, compLabelX, addressYOffset + 2, alignConfig);

      // 2. Invoice Details
      let startBoxY = 33;
      if (activeTheme === 'corporate' && showBgBox) {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(135, startBoxY, 60, 35, 2, 2, 'F');
      }

      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'bold');
      
      const detX = activeTheme === 'modern' ? 14 : 140;
      let detY = activeTheme === 'modern' ? 40 : 40;

      doc.text('Invoice No:', detX, detY);
      doc.setFont('helvetica', 'normal');
      doc.text(inv.invoiceNo || inv.id, detX, detY + 5);

      doc.setFont('helvetica', 'bold');
      doc.text('Date:', detX, detY + 12);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(inv.date).toLocaleDateString('id-ID'), detX, detY + 17);

      doc.setFont('helvetica', 'bold');
      doc.text('Due Date:', detX + 28, detY + 12);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(inv.dueDate || inv.date).toLocaleDateString('id-ID'), detX + 28, detY + 17);

      // 3. Bill To
      doc.setFont('helvetica', 'bold');
      let billY = activeTheme === 'modern' ? 65 : 55;
      
      if (activeTheme === 'modern') {
         doc.setDrawColor(226, 232, 240);
         doc.line(14, billY - 3, 195, billY - 3);
      }

      doc.text('Bill To:', 14, billY);
      doc.setFont('helvetica', 'normal');
      doc.text(inv.clientName || 'Cash Customer', 14, billY + 5);
      if (inv.contact?.email) doc.text(inv.contact.email, 14, billY + 10);
      if (inv.contact?.npwp) doc.text(`NPWP: ${inv.contact.npwp}`, 14, billY + 15);

      // 4. Items Table
      const tableColumn = ["Description", "Qty", "Unit Price", "DPP", "Tax", "Total"];
      const tableRows: any[] = [];

      if (inv.items && inv.items.length > 0) {
        inv.items.forEach((item: any) => {
          const dpp = Number(item.total);
          const ppn = Number(item.taxAmount);
          const itemOverallTotal = dpp + ppn;

          tableRows.push([
            item.description || item.sku,
            item.quantity,
            formatCurrency(Number(item.unitPrice)),
            formatCurrency(dpp),
            `${formatCurrency(ppn)}`,
            formatCurrency(itemOverallTotal)
          ]);
        });
      }

      autoTable(doc, {
        startY: Math.max(85, addressYOffset + 25),
        head: [tableColumn],
        body: tableRows,
        theme: tableTheme,
        headStyles: activeTheme === 'minimalist' 
          ? { fillColor: [255,255,255], textColor: [0,0,0], lineColor: [0,0,0], lineWidth: 0.1 }
          : { fillColor: primaryColor, textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' }
        }
      });

      // 5. Totals Area
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      doc.text('Subtotal:', 140, finalY);
      doc.text(formatCurrency(Number(inv.amount)), 195, finalY, { align: 'right' });

      if (Number(inv.discountAmount) > 0) {
          finalY += 6;
          doc.text('Discount:', 140, finalY);
          doc.text(`-${formatCurrency(Number(inv.discountAmount))}`, 195, finalY, { align: 'right' });
      }

      finalY += 6;
      doc.text('Tax / VAT:', 140, finalY);
      doc.text(formatCurrency(Number(inv.taxAmount)), 195, finalY, { align: 'right' });

      if (Number(inv.whtAmount) > 0) {
          finalY += 6;
          doc.text(`WHT Deduction:`, 140, finalY);
          doc.text(`-${formatCurrency(Number(inv.whtAmount))}`, 195, finalY, { align: 'right' });
      }

      finalY += 8;
      
      if (activeTheme === 'minimalist') {
         doc.setDrawColor(0, 0, 0);
         doc.line(135, finalY - 4, 195, finalY - 4);
      } else {
         doc.setDrawColor(226, 232, 240);
         doc.line(135, finalY - 4, 195, finalY - 4);
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Grand Total:', 140, finalY);
      doc.text(formatCurrency(Number(inv.grandTotal || inv.amount)), 195, finalY, { align: 'right' });

      // 6. Footer & Payment Terms
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Payment Terms & Instructions:', 14, 250);
      doc.setFont('helvetica', 'bold');
      doc.text(`Bank Mandiri - A/N: ${inv.tenant?.name}`, 14, 255);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Generated objectively by Bizzcount ERP.', 105, 280, { align: 'center' });

      // Save states
      setPdfDoc(doc);
      setPdfUrl(doc.output('datauristring'));

    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setError('Error generating template.');
    }
  }, [invoiceData, activeTheme, formatCurrency]);

  if (error) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}><h2>Preview Error</h2><p>{error}</p></div>;
  }

  if (!pdfUrl) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Generating...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#e2e8f0' }}>
      {/* Floating Toolbar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 24px', 
        backgroundColor: '#fff', 
        borderBottom: '1px solid #cbd5e1',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        zIndex: 10 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 'bold' }}>
            <Palette size={18} /> Invoice Appearance:
          </div>
          <select 
            value={activeTheme} 
            onChange={(e) => setActiveTheme(e.target.value as ThemeType)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="corporate">Corporate Classic</option>
            <option value="modern">Modern Tech Edge</option>
            <option value="minimalist">Monochrome Minimalist</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => { if(pdfDoc) window.open(pdfDoc.output('bloburl'), '_blank'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}
          >
            <Printer size={16} /> Print Direct
          </button>
          <button 
            onClick={() => { if(pdfDoc) pdfDoc.save(`Invoice_${invoiceData?.invoiceNo || 'Draft'}.pdf`); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#0F3B8C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div style={{ flex: 1, padding: '24px', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <iframe 
          src={pdfUrl} 
          style={{ width: '100%', maxWidth: '900px', height: '100%', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '4px', backgroundColor: '#fff' }}
          title="Invoice PDF Preview"
        />
      </div>
    </div>
  );
}
