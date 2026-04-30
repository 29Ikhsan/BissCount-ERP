'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  Activity,
  Calculator,
  Calendar,
  Layers,
  ArrowRight,
  Bot,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PPNExport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const router = useRouter();

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/taxation/ppn?month=${period.month}&year=${period.year}`)
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
      const url = `/api/taxation/export/ppn?month=${period.month}&year=${period.year}&format=${format}`;
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Tax export failed:', error.message);
    }
  };

  const filteredData = data.filter(inv => 
    inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) || 
    inv.clientName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Reconciling PPN Keluaran data for period {period.month}/{period.year}...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/taxation" className={styles.backBtn}><ArrowLeft size={18}/></Link>
        <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>VAT Outbound (e-Faktur)</h1>
            <p className={styles.subtitle}>Institutional reconciliation for PPN Keluaran and DJP-Ready XML/XLS exports.</p>
          </div>
        </div>
        <div className={styles.headerActions} style={{ display: 'flex', gap: '12px' }}>
           <button className={styles.btnSecondary} onClick={() => exportFormat('xml')} style={{ border: '1px solid #279C5A', color: '#279C5A', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <FileText size={16}/> Export CoreTax XML
           </button>
           <button className={styles.btnPrimary} onClick={() => exportFormat('xls')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Download size={16}/> Export BPMP Excel
           </button>
        </div>
      </div>

      {/* Period Selection & Metrics */}
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
            <div className={styles.metricLabel}>PPN Total (In Period)</div>
            <div className={styles.metricValue}>Rp {data.reduce((sum, item) => sum + item.ppn, 0).toLocaleString()}</div>
            <div className={styles.metricSub}>{data.length} INVOICES RECORDED</div>
         </div>
         <div className={styles.metricCard} style={{ borderLeft: (data.some(i => i.status === 'INCOMPLETE')) ? '4px solid #EF4444' : '4px solid #279C5A' }}>
            <div className={styles.metricLabel}>Compliance Audit</div>
            <div className={styles.metricValue} style={{ color: (data.some(i => i.status === 'INCOMPLETE')) ? '#EF4444' : '#279C5A' }}>
               {(data.some(i => i.status === 'INCOMPLETE')) ? 'Attention Required' : 'Audit Ready'}
            </div>
            <div className={styles.metricSub}>DJP SCHEMA VALIDATION</div>
         </div>
      </div>

      {/* Registry */}
      <div className={styles.panel}>
         <div className={styles.tableHeader}>
            <div className={styles.tableTitleGroup}>
               <h2 className={styles.tableTitle}>VAT Invoices Realization</h2>
               <span className={styles.liveIndicator}>INSTITUTIONAL GRADE</span>
            </div>
            <div className={styles.searchBox}>
               <Search size={16} />
               <input 
                 type="text" 
                 placeholder="Search Invoice or Client..." 
                 value={search} 
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
         </div>
         <table className={styles.table}>
            <thead>
               <tr>
                  <th>INVOICE # & DATE</th>
                  <th>CLIENT & NPWP</th>
                  <th className={styles.numeric}>DPP (BASE)</th>
                  <th className={styles.numeric}>PPN (12%)</th>
                  <th>STATUS</th>
                  <th className={styles.textRight}>DETAILS</th>
               </tr>
            </thead>
            <tbody>
               {filteredData.map(inv => (
                  <tr key={inv.id}>
                     <td>
                        <div style={{ fontWeight: 800 }}>{inv.invoiceNo}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{new Date(inv.date).toLocaleDateString()}</div>
                     </td>
                     <td>
                        <div style={{ fontWeight: 700 }}>{inv.clientName}</div>
                        <div style={{ fontSize: '0.75rem', color: inv.status === 'INCOMPLETE' ? '#EF4444' : '#64748B' }}>
                           {inv.npwp}
                        </div>
                     </td>
                     <td className={styles.numeric}>Rp {inv.dpp.toLocaleString()}</td>
                     <td className={styles.numeric} style={{ fontWeight: 800, color: '#279C5A' }}>Rp {inv.ppn.toLocaleString()}</td>
                     <td>
                        <span className={`${styles.statusBadge} ${styles[inv.status.toLowerCase()]}`}>
                           {inv.status}
                        </span>
                     </td>
                     <td className={styles.textRight}>
                        <button className={styles.moreBtn} onClick={() => setSelectedInvoice(inv)}><ChevronRight size={16}/></button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* DETAIL MODAL */}
      {selectedInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.iconBox} style={{ backgroundColor: '#D1FAE5' }}><FileText size={20} color="#279C5A"/></div>
                <div>
                  <h2 className={styles.modalTitle}>Invoice Internal Review</h2>
                  <p className={styles.modalSubtitle}>System realization for VAT compliance audit.</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedInvoice(null)}><X size={20}/></button>
            </div>

            <div className={styles.modalBody}>
               <div className={styles.detailGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Invoice Number</span>
                    <span className={styles.detailValue}>{selectedInvoice.invoiceNo}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Client Entity</span>
                    <span className={styles.detailValue}>{selectedInvoice.clientName}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Tax ID (NPWP)</span>
                    <span className={styles.detailValue}>{selectedInvoice.npwp}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Issuance Date</span>
                    <span className={styles.detailValue}>{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                  </div>
               </div>

               <div className={styles.financialSummary}>
                  <div className={styles.finRow}>
                     <span>Base Value (DPP)</span>
                     <span>Rp {selectedInvoice.dpp.toLocaleString()}</span>
                  </div>
                  <div className={styles.finRow} style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '12px', fontWeight: 800 }}>
                     <span>VAT (PPN 12%)</span>
                     <span style={{ color: '#279C5A' }}>Rp {selectedInvoice.ppn.toLocaleString()}</span>
                  </div>
               </div>

               <div className={styles.taraIntegration}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <Bot size={18} color="#279C5A"/>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>ASK TARA INTELLIGENCE</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '16px' }}>
                     Unsure about PPN 12% treatment for this specific client? Consultation with TARA handles the latest 2026 regulations.
                  </p>
                  <button 
                    className={styles.taraBtn}
                    onClick={() => router.push(`/tax-assistant?q=Explain PPN 12 percent rules for invoice ${selectedInvoice.invoiceNo}`)}
                  >
                     Consult TARA <ArrowRight size={14}/>
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
