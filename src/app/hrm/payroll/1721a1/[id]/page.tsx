'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/context/LanguageContext';

export default function Form1721A1Preview() {
  const params = useParams();
  const id = params.id as string;
  const { formatCurrency } = useLanguage();
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const generatePdf = async () => {
      try {
        const res = await fetch(`/api/hrm/payroll/1721a1/${id}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Gagal mengambil data 1721-A1');
        
        const emp = data.employee;
        const comp = data.components;

        // Initialize PDF
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Fonts and Colors
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('BUKTI PEMOTONGAN PAJAK PENGHASILAN PASAL 21 (FORM 1721-A1)', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Masa Pajak: 01 - 12 Tahun: ${data.year}`, 105, 26, { align: 'center' });

        // Identitas Pemotong
        doc.setFont('helvetica', 'bold');
        doc.text('A. IDENTITAS PEMOTONG PAJAK / PERUSAHAAN', 14, 35);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nama Perusahaan : ${data.tenant.name}`, 14, 40);
        doc.text(`Alamat Pemotong : ${data.tenant.address || '-'}`, 14, 45);

        // Identitas Karyawan
        doc.setFont('helvetica', 'bold');
        doc.text('B. IDENTITAS PENERIMA PENGHASILAN YANG DIPOTONG (KARYAWAN)', 14, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(`1. Nama : ${emp.name}`, 14, 60);
        doc.text(`2. NPWP : ${emp.npwp || '-'} / NIK : ${emp.nik || '-'}`, 14, 65);
        doc.text(`3. Jabatan : ${emp.jobTitle || '-'}`, 14, 70);
        doc.text(`4. Status PTKP : ${comp.ptkpStatus}`, 14, 75);

        // Rincian Penghasilan
        const incomeBody = [
          ['1. Gaji / Pensiun', formatCurrency(comp.gajiPensiun)],
          ['2. Tunjangan PPh, Lainnya, Honorarium', formatCurrency(comp.tunjanganLainnya)],
          ['3. Premi Asuransi Dibayar Pemberi Kerja', formatCurrency(comp.premiAsuransi)],
          ['--- JUMLAH PENGHASILAN BRUTO (1+2+3)', formatCurrency(comp.brutoRutin)],
          ['4. Bonus, THR, dan Sejenisnya', formatCurrency(comp.bonusThr)],
          ['5. JUMLAH PENGHASILAN BRUTO SETAHUN', formatCurrency(comp.totalBrutoSetahun)],
        ];

        autoTable(doc, {
          startY: 85,
          head: [['Rincian Penghasilan (Setahun)', 'Rupiah']],
          body: incomeBody,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 130 }, 1: { halign: 'right' } },
        });

        const yAfterIncome = (doc as any).lastAutoTable.finalY + 10;

        // Rincian Pengurangan
        const deductionBody = [
          ['6. Biaya Jabatan', formatCurrency(comp.biayaJabatan)],
          ['7. Iuran Pensiun / JHT Dibayar Karyawan', formatCurrency(comp.iuranPensiunJht)],
          ['8. JUMLAH PENGURANGAN (6+7)', formatCurrency(comp.totalPengurang)],
        ];

        autoTable(doc, {
          startY: yAfterIncome,
          head: [['Rincian Pengurangan', 'Rupiah']],
          body: deductionBody,
          theme: 'grid',
          headStyles: { fillColor: [44, 62, 80], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 130 }, 1: { halign: 'right' } },
        });

        const yAfterDeduction = (doc as any).lastAutoTable.finalY + 10;

        // Penghitungan PPh 21
        const taxBody = [
          ['9. Penghasilan Neto Setahun (5-8)', formatCurrency(comp.netoSetahun)],
          ['10. Penghasilan Kena Pajak (PKP Setahun)', formatCurrency(comp.pkp)],
          ['11. PPh Pasal 21 Terutang Setahun', formatCurrency(comp.pph21TerutangA1)],
          ['12. PPh Pasal 21 yang telah dipotong Lunas', formatCurrency(comp.pph21Lunas)],
        ];

        autoTable(doc, {
          startY: yAfterDeduction,
          head: [['Penghitungan PPh Pasal 21 Setahun', 'Rupiah']],
          body: taxBody,
          theme: 'grid',
          headStyles: { fillColor: [192, 57, 43], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 130 }, 1: { halign: 'right', fontStyle: 'bold' } },
        });

        setPdfUrl(doc.output('datauristring'));
      } catch (err: any) {
        console.error('PDF Generation Error:', err);
        setError(err.message || 'Gagal memuat dokumen form 1721-A1.');
      }
    };

    generatePdf();
  }, [id, formatCurrency]);

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444', fontFamily: 'sans-serif' }}>
        <h2>Dokumen Gagal Dibuka</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#64748B', fontFamily: 'sans-serif' }}>
        <h2>Men-generate Form 1721-A1 DJP-Format...</h2>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#334155' }}>
      <iframe 
        src={pdfUrl} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Form 1721-A1 PDF Preview"
      />
    </div>
  );
}
