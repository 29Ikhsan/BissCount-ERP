'use client';

import { 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  CalendarClock, 
  FileCheck,
  Building,
  History,
  Check,
  RefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

export default function PeriodClosing() {
  const { t, locale } = useLanguage();
  const [currentPeriod, setCurrentPeriod] = useState({ 
    month: new Date().toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long' }), 
    year: new Date().getFullYear() 
  });
  const [history, setHistory] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [stats, setStats] = useState({
    unreconciledBank: 0,
    draftInvoices: 0,
    pendingExpenses: 0
  });

  const [checklist, setChecklist] = useState<any[]>([]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const monthIndex = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      const res = await fetch(`/api/accounting/closing?month=${monthIndex}&year=${year}`);
      const data = await res.json();
      
      if (res.ok) {
        if (data.history) setHistory(data.history);
        
        const { audit } = data;
        setStats({
          unreconciledBank: audit.unreconciledBankCount,
          draftInvoices: audit.draftInvoices,
          pendingExpenses: audit.pendingExpenses
        });

        setChecklist([
          { 
            id: 1, 
            title: locale === 'id' ? 'Rekonsiliasi Bank' : 'Bank Reconciliations', 
            desc: audit.unreconciledBankCount > 0 
              ? (locale === 'id' ? `Tersisa ${audit.unreconciledBankCount} transaksi bank belum cocok.` : `${audit.unreconciledBankCount} bank transactions remaining.`)
              : (locale === 'id' ? 'Semua rekening sudah cocok.' : 'All accounts reconciled.'), 
            status: audit.unreconciledBankCount === 0 ? 'SUCCESS' : 'PENDING', 
            type: audit.unreconciledBankCount === 0 ? 'success' : 'warning',
            action: '/banking'
          },
          { 
            id: 2, 
            title: locale === 'id' ? 'Penyusutan Aset' : 'Asset Depreciation', 
            desc: audit.hasDepreciationRun 
              ? (locale === 'id' ? 'Jurnal penyusutan telah diposting.' : 'Depreciation journals posted.')
              : (locale === 'id' ? 'Eksekusi bulan ini belum dilakukan.' : 'Monthly run not executed yet.'), 
            status: audit.hasDepreciationRun ? 'SUCCESS' : 'PENDING', 
            type: audit.hasDepreciationRun ? 'success' : 'warning',
            action: '/assets'
          },
          { 
            id: 3, 
            title: locale === 'id' ? 'Amortisasi Biaya Dimuka' : 'Prepaid Amortization', 
            desc: audit.hasAmortizationRun 
              ? (locale === 'id' ? 'Amortisasi bulan ini sudah masuk buku.' : 'Monthly amortization completed.')
              : (locale === 'id' ? 'Jadwal amortisasi belum dijalankan.' : 'Amortization run pending.'), 
            status: audit.hasAmortizationRun ? 'SUCCESS' : 'PENDING', 
            type: audit.hasAmortizationRun ? 'success' : 'warning',
            action: '/accounting/amortization'
          },
          { 
            id: 4, 
            title: locale === 'id' ? 'Verifikasi Draft & Pending' : 'Document Verification', 
            desc: (audit.draftInvoices + audit.pendingExpenses) > 0 
              ? (locale === 'id' ? `Ada ${audit.draftInvoices + audit.pendingExpenses} dokumen belum final.` : `Found ${audit.draftInvoices + audit.pendingExpenses} pending documents.`)
              : (locale === 'id' ? 'Semua dokumen sudah final.' : 'All documents finalized.'), 
            status: (audit.draftInvoices + audit.pendingExpenses) === 0 ? 'SUCCESS' : 'PENDING', 
            type: (audit.draftInvoices + audit.pendingExpenses) === 0 ? 'success' : 'warning',
            action: '/invoices'
          },
        ]);
      }
    } catch (e) {
      console.error('Closing Audit calculation error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [locale]);

  const allCompleted = checklist.every(item => item.type === 'success');

  const handleEOMClose = async () => {
    if (!allCompleted) {
      alert(locale === 'id' ? "Mohon selesaikan semua checklist sebelum tutup buku." : "Please complete all checklist items before closing the period.");
      return;
    }
    
    setIsClosing(true);
    try {
      const res = await fetch('/api/accounting/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          month: currentPeriod.month, 
          year: currentPeriod.year 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(locale === 'id' ? `Periode ${currentPeriod.month} ${currentPeriod.year} telah berhasil ditutup.` : `Period ${currentPeriod.month} ${currentPeriod.year} has been formally locked.`);
        fetchStatus(); 
      } else {
        alert(data.error || "Failed to close period.");
      }
    } catch (e) {
      alert("Network error executing EOM close.");
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>{locale === 'id' ? 'Tutup Buku Finansial' : 'Financial Period Closing'}</h1>
          <p className={styles.pageSubtitle}>{locale === 'id' ? 'Finalisasi catatan akuntansi dan kunci periode untuk kepatuhan.' : 'Finalize accounting records and lock periods for compliance.'}</p>
        </div>
      </div>

      <div className={styles.contextBanner}>
        <div className={styles.contextItem}>
          <span className={styles.contextLabel}>{locale === 'id' ? 'PERIODE TERBUKA' : 'CURRENT OPEN PERIOD'}</span>
          <div className={styles.contextValue}>
            <CalendarClock size={20} className={styles.contextIcon} /> 
            {currentPeriod.month} {currentPeriod.year}
          </div>
        </div>
        <div className={styles.contextDivider}></div>
        <div className={styles.contextItem}>
          <span className={styles.contextLabel}>STATUS</span>
          {loading ? (
            <div className={styles.badgeWarning}>Syncing...</div>
          ) : allCompleted ? (
            <div className={styles.badgeSuccess}>{locale === 'id' ? 'Siap Tutup' : 'Ready to Close'}</div>
          ) : (
            <div className={styles.badgeWarning}>{locale === 'id' ? 'Menunggu Checklist' : 'Pending Checklist'}</div>
          )}
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.checklistSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className={styles.sectionTitle}>{locale === 'id' ? 'Checklist Pra-Tutup Buku' : 'Pre-Closing Checklist'}</h3>
            </div>
            <button className={styles.btnOutline} onClick={fetchStatus} disabled={loading} style={{ padding: '6px 12px' }}>
               <RefreshCw size={14} className={loading ? styles.spin : ''} /> {locale === 'id' ? 'Perbarui' : 'Refresh'}
            </button>
          </div>
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>...</div>
          ) : checklist.map((item) => (
            <div 
              key={item.id} 
              className={item.type === 'success' ? styles.checklistItem : styles.checklistItemWarning}
            >
              <div className={item.type === 'success' ? styles.checkIconSuccess : styles.checkIconWarning}>
                {item.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <div className={styles.checkContent}>
                <h4 className={styles.checkTitle}>{item.title}</h4>
                <p className={styles.checkDesc}>{item.desc}</p>
                {item.type !== 'success' && item.action && (
                  <button className={styles.btnActionLink} onClick={() => window.location.href = item.action}>
                    Go to Module &rarr;
                  </button>
                )}
              </div>
              <div className={item.type === 'success' ? styles.checkStatusSuccess : styles.checkStatusWarning}>
                {item.status}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.executionSection}>
          <div className={allCompleted ? styles.actionCard : styles.actionCardDisabled}>
            <div className={styles.actionHeader}>
              <Lock size={20} className={allCompleted ? styles.actionIconPrimary : styles.actionIconDisabled} />
              <h3 className={allCompleted ? styles.actionTitle : styles.actionTitleDisabled}>{locale === 'id' ? 'Tutup Akhir Bulan (EOM)' : 'End of Month (EOM)'}</h3>
            </div>
            <p className={styles.actionDesc}>
              {locale === 'id' ? `Kunci periode ${currentPeriod.month} ${currentPeriod.year}. Tindakan ini akan memfinalisasi neraca percobaan.` : `Lock the ${currentPeriod.month} ${currentPeriod.year} period. This will finalize the trial balance.`}
            </p>
            <button 
              className={allCompleted && !isClosing ? styles.btnPrimary : styles.btnDisabled} 
              onClick={handleEOMClose}
              disabled={!allCompleted || isClosing}
            >
               {isClosing ? '...' : (locale === 'id' ? 'Eksekusi Tutup Buku' : 'Execute EOM Close')}
            </button>
          </div>

          <div className={styles.historyCard}>
            <h3 className={styles.historyTitle}>
               <History size={16} /> {locale === 'id' ? 'Riwayat Terakhir' : 'Recent Closings'}
            </h3>
            <ul className={styles.historyList}>
              {history.map((h, i) => (
                <li key={h.id || i}>
                   <span className={styles.histPeriod}>{h.month} {h.year}</span>
                   <span className={styles.histDate}>{locale === 'id' ? 'Ditutup' : 'Closed'} {new Date(h.closedAt).toLocaleDateString()}</span>
                </li>
              ))}
              {history.length === 0 && (
                <li style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{locale === 'id' ? 'Belum ada riwayat.' : 'No historical record.'}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
