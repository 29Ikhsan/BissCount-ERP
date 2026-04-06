'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { X, Book, HelpCircle, Lightbulb, MessageSquare } from 'lucide-react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const content = useMemo(() => {
    if (pathname.includes('/invoices')) {
      return {
        title: 'Bantuan Invoice & Piutang',
        guide: 'Modul ini digunakan untuk mengelola seluruh siklus penjualan (Order-to-Cash).',
        steps: [
          'Buat Quotation untuk penawaran harga awal.',
          'Konversi menjadi Sales Order jika disetujui konsumen.',
          'Terbitkan Invoice untuk menagih pembayaran.',
          'Gunakan tombol [Record Payment] untuk mencatat pelunasan.'
        ],
        tips: 'Status Invoice akan otomatis berubah menjadi "PAID" jika total pembayaran sesuai dengan nilai tagihan.'
      };
    }
    if (pathname.includes('/hrm')) {
      return {
        title: 'Bantuan Manajemen SDM (HRM)',
        guide: 'Kelola data karyawan, absensi, dan penggajian (payroll) secara terpusat dengan kepatuhan TER PPh 21.',
        steps: [
          'Daftarkan karyawan baru di menu Data Employee.',
          'Atur Status PTKP (TK/0 - K/3) untuk kalkulasi pajak otomatis.',
          'Gunakan modul Payroll untuk generate slip gaji secara massal.',
          'Hasil Payroll akan otomatis terposting ke Jurnal Keuangan.'
        ],
        tips: 'Pastikan NIK dan NPWP karyawan terisi dengan benar (15/16 digit) untuk validasi pelaporan pajak.'
      };
    }
    if (pathname.includes('/inventory')) {
      return {
        title: 'Bantuan Stok & Inventaris',
        guide: 'Monitor pergerakan stok barang di berbagai gudang secara real-time.',
        steps: [
          'Daftarkan SKU produk di Katalog Master.',
          'Aktifkan "Track Inventory" untuk menghitung COGS otomatis.',
          'Gunakan BOM (Bill of Materials) untuk produk yang dirakit/diproduksi.',
          'Setel Reorder Point untuk mendapatkan notifikasi stok rendah.'
        ],
        tips: 'Nilai persediaan Anda dihitung menggunakan metode Moving Average secara realtime.'
      };
    }
    if (pathname.includes('/expenses')) {
      return {
        title: 'Bantuan Pengeluaran & Biaya',
        guide: 'Catat pengeluaran operasional perusahaan dan lakukan reimbursement dengan cepat.',
        steps: [
          'Lampirkan bukti foto/nota pada setiap entri biaya.',
          'Pilih Akun COA yang sesuai (Beban Pemasaran, Perjalanan, dll).',
          'Gunakan fitur WHT (PPh 23/21) jika bertransaksi dengan vendor jasa.',
          'Pantau status Approval dari tim Finance.'
        ],
        tips: 'Gunakan fitur Cost Center untuk melacak efisiensi biaya per departemen atau proyek.'
      };
    }
    return {
      title: 'Pusat Bantuan AKSIA ERP',
      guide: 'Selamat datang di AKSIA ERP, sistem manajemen bisnis terpadu bertenaga AI.',
      steps: [
        'Navigasi menggunakan sidebar di sebelah kiri.',
        'Gunakan fitur Pencarian Global (⌘K) untuk mencari data apapun.',
        'Klik ikon "?" di setiap modul untuk bantuan spesifik.',
        'Hubungi admin jika Anda membutuhkan akses tambahan.'
      ],
      tips: 'Dashboard utama memberikan ringkasan kesehatan finansial perusahaan Anda secara real-time.'
    };
  }, [pathname]);

  if (!isOpen) return null;

  return (
    <div className="help-panel-overlay" onClick={onClose}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <div className="help-title-wrap">
            <HelpCircle size={20} className="help-main-icon" />
            <h3>Pusat Bantuan</h3>
          </div>
          <button className="help-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="help-content">
          <div className="help-section">
            <h4 className="help-section-title"><Book size={16} /> {content.title}</h4>
            <p className="help-guide">{content.guide}</p>
          </div>

          <div className="help-section">
            <h4 className="help-section-title"><Lightbulb size={16} /> Panduan Cepat</h4>
            <ul className="help-steps">
              {content.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="help-tips-box">
             <div className="help-tips-header">
               <Lightbulb size={14} /> PRO TIP
             </div>
             <p>{content.tips}</p>
          </div>

          <div className="help-support">
            <p>Butuh bantuan lebih lanjut?</p>
            <button className="support-btn">
              <MessageSquare size={16} /> Hubungi Support
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .help-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(2px);
          z-index: 10000;
          display: flex;
          justify-content: flex-end;
          animation: fade-in 0.2s ease-out;
        }

        .help-panel {
          width: 380px;
          height: 100%;
          background: white;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .help-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .help-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .help-main-icon {
          color: #3b82f6;
        }

        .help-title-wrap h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .help-close-btn {
          color: #94a3b8;
          transition: color 0.2s, background 0.2s;
          padding: 4px;
          border-radius: 6px;
        }

        .help-close-btn:hover {
          color: #ef4444;
          background: #fef2f2;
        }

        .help-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .help-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          color: #334155;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .help-guide {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        .help-steps {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .help-steps li {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.5;
        }

        .help-tips-box {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 16px;
          border-radius: 12px;
        }

        .help-tips-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #0369a1;
          margin-bottom: 8px;
        }

        .help-tips-box p {
          font-size: 0.8125rem;
          color: #0c4a6e;
          margin: 0;
          line-height: 1.5;
          font-weight: 500;
        }

        .help-support {
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
        }

        .help-support p {
          font-size: 0.8125rem;
          color: #64748b;
          margin-bottom: 12px;
        }

        .support-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          transition: background 0.2s;
        }

        .support-btn:hover {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default HelpPanel;
