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
  Building
} from 'lucide-react';
import Link from 'next/link';

export default function PPh21Export() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

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

  const exportCSV = () => {
    const headers = ['NO', 'PERIOD', 'EMPLOYEE_ID', 'NAME', 'NPWP', 'GROSS_INCOME', 'PPH_21_WITHHELD', 'TAX_ARTICLE'];
    
    const rows = data.map((item, idx) => [
      idx + 1, item.period, item.employeeId, item.employeeName, 'NPWP-REQUIRED', 
      item.grossPay, item.pph21, '21-100-01'
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EBupot_21_Tax_${period.month}_${period.year}.csv`);
    document.body.appendChild(link);
    link.click();
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
        <button className={styles.btnPrimary} onClick={exportCSV}>
          <Download size={16}/> Export e-Bupot 21 CSV
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
                        <button className={styles.moreBtn} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight size={16}/></button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
