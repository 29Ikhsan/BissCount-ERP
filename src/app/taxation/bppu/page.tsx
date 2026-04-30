'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  FileText, 
  Download, 
  Search, 
  ArrowLeft, 
  Activity,
  Calculator,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Bot,
  X,
  FileDigit
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BPPUHub() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const router = useRouter();

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/taxation/bppu?month=${period.month}&year=${period.year}`)
      .then(res => res.json())
      .then(d => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const exportFormat = async (format: 'xml' | 'xls') => {
    try {
      const res = await fetch('/api/taxation/bppu/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...period, format })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Export failed');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BPPU_Unifikasi_${period.month}_${period.year}.${format === 'xls' ? 'xlsx' : 'xml'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('BPPU export failed:', error.message);
    }
  };

  const filteredData = data.filter(exp => 
    exp.merchant.toLowerCase().includes(search.toLowerCase()) || 
    exp.identity.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Reconciling PPH Unifikasi (BPPU) records for period {period.month}/{period.year}...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/taxation" className={styles.backBtn}><ArrowLeft size={18}/></Link>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>PPH Unifikasi (BPPU)</h1>
            <p className={styles.subtitle}>Institutional reconciliation for Expense-based withholding tax and CoreTax BPPU exports.</p>
          </div>
        </div>
        <div className={styles.headerActions} style={{ display: 'flex', gap: '12px' }}>
           <button className={styles.btnSecondary} onClick={() => exportFormat('xml')} style={{ border: '1px solid #279C5A', color: '#279C5A', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, background: 'white' }}>
             <FileText size={16}/> Export Unifikasi XML
           </button>
           <button className={styles.btnPrimary} onClick={() => exportFormat('xls')}>
             <Download size={16}/> Export BPPU Excel (v.3)
           </button>
        </div>
      </div>

      {/* Metrics & Period */}
      <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
         <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Reporting Period</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
               <input 
                 type="number" 
                 className={styles.inputSelect} 
                 style={{ width: '80px' }}
                 value={period.month} 
                 onChange={(e) => setPeriod({...period, month: parseInt(e.target.value)})}
               />
               <input 
                 type="number" 
                 className={styles.inputSelect} 
                 style={{ width: '100px' }}
                 value={period.year} 
                 onChange={(e) => setPeriod({...period, year: parseInt(e.target.value)})}
               />
               <button onClick={fetchData} className={styles.refreshBtn}><Activity size={16}/></button>
            </div>
         </div>
         <div className={styles.metricCard}>
            <div className={styles.metricLabel}>PPH Unifikasi (Total)</div>
            <div className={styles.metricValue}>Rp {data.reduce((sum, item) => sum + item.wht, 0).toLocaleString()}</div>
            <div className={styles.metricSub}>{data.length} BUPOT RECORDS IN PERIOD</div>
         </div>
         <div className={styles.metricCard} style={{ borderLeft: (data.some(i => i.status === 'INCOMPLETE')) ? '4px solid #EF4444' : '4px solid #279C5A' }}>
            <div className={styles.metricLabel}>Compliance Audit</div>
            <div className={styles.metricValue} style={{ color: (data.some(i => i.status === 'INCOMPLETE')) ? '#EF4444' : '#279C5A' }}>
               {(data.some(i => i.status === 'INCOMPLETE')) ? 'Attention Required' : 'Audit Ready'}
            </div>
            <div className={styles.metricSub}>CORETAX V.3 SCHEMA READY</div>
         </div>
      </div>

      {/* Registry */}
      <div className={styles.panel}>
         <div className={styles.tableHeader}>
            <div className={styles.tableTitleGroup}>
               <h2 className={styles.tableTitle}>Unified Withholding Registry</h2>
               <span className={styles.liveIndicator}>INSTITUTIONAL GRADE</span>
            </div>
            <div className={styles.searchBox}>
               <Search size={16} />
               <input 
                 type="text" 
                 placeholder="Search Merchant or Identity..." 
                 value={search} 
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
         </div>
         <table className={styles.table}>
            <thead>
               <tr>
                  <th>DATE & MERCHANT</th>
                  <th>IDENTITAS (NPWP/NIK)</th>
                  <th className={styles.numeric}>BRUTO (GROSS)</th>
                  <th className={styles.numeric}>PPH (WHT)</th>
                  <th>STATUS</th>
                  <th className={styles.textRight}>DETAILS</th>
               </tr>
            </thead>
            <tbody>
               {filteredData.map(exp => (
                  <tr key={exp.id}>
                     <td>
                        <div style={{ fontWeight: 800 }}>{exp.merchant}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{new Date(exp.date).toLocaleDateString()}</div>
                     </td>
                     <td>
                        <div style={{ fontWeight: 700, color: exp.status === 'INCOMPLETE' ? '#EF4444' : '#0F172A' }}>
                           {exp.identity}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>DJP IDENTITY VERIFIED</div>
                     </td>
                     <td className={styles.numeric}>Rp {exp.gross.toLocaleString()}</td>
                     <td className={styles.numeric} style={{ fontWeight: 800, color: '#279C5A' }}>Rp {exp.wht.toLocaleString()}</td>
                     <td>
                        <span className={`${styles.statusBadge} ${styles[exp.status.toLowerCase()]}`}>
                           {exp.status === 'READY' ? 'AUDIT READY' : 'INCOMPLETE'}
                        </span>
                     </td>
                     <td className={styles.textRight}>
                        <button className={styles.moreBtn} onClick={() => setSelectedRecord(exp)}><ChevronRight size={16}/></button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* PPh Unifikasi Detail Modal */}
      {selectedRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.iconBox} style={{ backgroundColor: '#DBEAFE' }}><Activity size={20} color="#1E40AF"/></div>
                <div>
                  <h2 className={styles.modalTitle}>Withholding Realization</h2>
                  <p className={styles.modalSubtitle}>Institutional audit for PPh Unifikasi (BPPU) compliance.</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedRecord(null)}><X size={20}/></button>
            </div>

            <div className={styles.modalBody}>
               <div className={styles.detailGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Merchant / Recipient</span>
                    <span className={styles.detailValue}>{selectedRecord.merchant}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>DJP Identity (NPWP)</span>
                    <span className={styles.detailValue}>{selectedRecord.identity}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Transaction Date</span>
                    <span className={styles.detailValue}>{new Date(selectedRecord.date).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Reference ID</span>
                    <span className={styles.detailValue}>{selectedRecord.id.slice(0, 12)}...</span>
                  </div>
               </div>

               <div className={styles.financialSummary}>
                  <div className={styles.finRow}>
                     <span>Non-Taxable Base (DPP)</span>
                     <span>Rp {selectedRecord.gross.toLocaleString()}</span>
                  </div>
                  <div className={styles.finRow} style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '12px', fontWeight: 800 }}>
                     <span>Withheld Tax (PPh)</span>
                     <span style={{ color: '#279C5A' }}>Rp {selectedRecord.wht.toLocaleString()}</span>
                  </div>
               </div>

               <div className={styles.taraIntegration}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <Bot size={18} color="#279C5A"/>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>ASK TARA INTELLIGENCE</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '16px' }}>
                     Unsure about Article 23 or 4(2) classification for this transaction? TARA handles the latest 2026 CoreTax rules.
                  </p>
                  <button 
                    className={styles.taraBtn}
                    onClick={() => router.push(`/tax-assistant?q=Explain withholding tax article for recipient ${selectedRecord.merchant}`)}
                  >
                     Consult TARA <Activity size={14}/>
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
