'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  ShieldCheck, 
  Download, 
  Search, 
  ArrowLeft, 
  Activity, 
  ChevronRight,
  FileText,
  DollarSign,
  Briefcase,
  Calendar,
  Users,
  Building,
  Bot,
  X,
  FileDigit,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PPh21Export() {
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
    fetch(`/api/taxation/pph21?month=${period.month}&year=${period.year}`)
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

  const exportCoreTax = () => {
    window.open(`/api/taxation/export/pph21?month=${period.month}&year=${period.year}`, '_blank');
  };

  const filteredData = data.filter(item => 
    item.employeeName.toLowerCase().includes(search.toLowerCase()) || 
    item.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const stats = data.reduce((acc, curr) => ({
    totalPPH: acc.totalPPH + curr.pph21,
    totalGross: acc.totalGross + curr.grossPay,
    count: acc.count + 1
  }), { totalPPH: 0, totalGross: 0, count: 0 });

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Reconciling PPh Pasal 21 (Income Tax) from Payroll Ledger...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/taxation" className={styles.backBtn}><ArrowLeft size={18}/></Link>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Income Tax Article 21</h1>
            <p className={styles.subtitle}>Institutional reconciliation for workforce tax withholding and e-Bupot 21 generation.</p>
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={exportCoreTax} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16}/> 
          {period.month === 12 ? 'Export CoreTax BPA1 (Annual)' : 'Export CoreTax BP21 (Monthly)'}
        </button>
      </div>

      {/* Period Selection & Metrics */}
      <div className={styles.metricsGrid}>
         <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Reporting Period</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
               <input 
                 type="number" 
                 className={styles.inputSelect} 
                 value={period.month} 
                 onChange={(e) => setPeriod({...period, month: parseInt(e.target.value)})}
               />
               <input 
                 type="number" 
                 className={styles.inputSelect} 
                 value={period.year} 
                 onChange={(e) => setPeriod({...period, year: parseInt(e.target.value)})}
               />
               <button onClick={fetchData} className={styles.refreshBtn} style={{ background: '#279C5A', color: 'white', border: 'none', borderRadius: '8px', padding: '0 12px' }}><Activity size={16}/></button>
            </div>
         </div>
         <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total PPh 21 Liability</div>
            <div className={styles.metricValue} style={{ color: '#EF4444' }}>Rp {stats.totalPPH.toLocaleString()}</div>
            <div className={styles.metricSub}>TOTAL WITHHELD FROM {stats.count} EMPLOYEES</div>
         </div>
         <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Taxable Base</div>
            <div className={styles.metricValue}>Rp {stats.totalGross.toLocaleString()}</div>
            <div className={styles.metricSub}>GROSS SALARY + ALLOWANCES</div>
         </div>
         <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Status</div>
            <div className={styles.metricValue}>Ready</div>
            <div className={styles.metricSub}>E-BUPOT 21 SYNCHRONIZED</div>
         </div>
      </div>

      {/* Registry */}
      <div className={styles.panel}>
         <div className={styles.tableHeader}>
            <div className={styles.tableTitleGroup}>
               <h2 className={styles.tableTitle}>PPh 21 Realization (Monthly)</h2>
               <span className={styles.liveIndicator} style={{ marginLeft: '12px', background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>AUDIT READY</span>
            </div>
            <div className={styles.searchBox} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-soft)', padding: '8px 16px', borderRadius: '12px' }}>
               <Search size={16} color="#64748B"/>
               <input 
                 type="text" 
                 placeholder="Search Employee..." 
                 style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem' }}
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
         </div>
         <table className={styles.table}>
            <thead>
               <tr>
                  <th>EMPLOYEE & ID</th>
                  <th>PERIOD</th>
                  <th className={styles.numeric}>GROSS INCOME</th>
                  <th className={styles.numeric}>PPH 21 WITHHELD</th>
                  <th>STATUS</th>
                  <th className={styles.textRight}>ACTIONS</th>
               </tr>
            </thead>
            <tbody>
               {filteredData.map(item => (
                  <tr key={item.id}>
                     <td>
                        <div style={{ fontWeight: 800 }}>{item.employeeName}</div>
                        <div className={styles.idBadge}>{item.employeeId}</div>
                     </td>
                     <td>{item.period}</td>
                     <td className={styles.numeric}>Rp {item.grossPay.toLocaleString()}</td>
                     <td className={`${styles.numeric} ${styles.taxValue}`}>Rp {item.pph21.toLocaleString()}</td>
                     <td>
                        <span className={`${styles.statusBadge} ${styles[item.status.toLowerCase()]}`}>
                           {item.status}
                        </span>
                     </td>
                     <td className={styles.textRight}>
                        <button className={styles.moreBtn} onClick={() => setSelectedRecord(item)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight size={16}/></button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* PPh 21 Detail Modal */}
      {selectedRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.iconBox} style={{ backgroundColor: '#D1FAE5' }}><Users size={20} color="#065F46"/></div>
                <div>
                  <h2 className={styles.modalTitle}>Employee Tax Realization</h2>
                  <p className={styles.modalSubtitle}>Detailed analysis for PPh Pasal 21 withholding.</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedRecord(null)}><X size={20}/></button>
            </div>

            <div className={styles.modalBody}>
               <div className={styles.detailGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Employee Name</span>
                    <span className={styles.detailValue}>{selectedRecord.employeeName}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Employee ID</span>
                    <span className={styles.detailValue}>{selectedRecord.employeeId}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Reporting Period</span>
                    <span className={styles.detailValue}>{selectedRecord.period}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Compliance Status</span>
                    <span className={styles.detailValue}>{selectedRecord.status}</span>
                  </div>
               </div>

               <div className={styles.financialSummary}>
                  <div className={styles.finRow}>
                     <span>Gross Taxable Base</span>
                     <span>Rp {selectedRecord.grossPay.toLocaleString()}</span>
                  </div>
                  <div className={styles.finRow} style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '12px', fontWeight: 800 }}>
                     <span>Tax Withheld (PPh 21)</span>
                     <span style={{ color: '#EF4444' }}>Rp {selectedRecord.pph21.toLocaleString()}</span>
                  </div>
               </div>

               <div className={styles.taraIntegration}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <Bot size={18} color="#279C5A"/>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>ASK TARA INTELLIGENCE</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '16px' }}>
                     Unsure about TRER (Tarif Efektif Rata-rata) or PTKP adjustments? TARA can explain the 2026 workforce tax logic.
                  </p>
                  <button 
                    className={styles.taraBtn}
                    onClick={() => router.push(`/tax-assistant?q=Explain PPh 21 calculation for income Rp ${selectedRecord.grossPay}`)}
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
