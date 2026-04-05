'use client';

import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { 
  PieChart, 
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
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function PPhUnifikasi() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/taxation/pph-unifikasi?month=${period.month}&year=${period.year}`)
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
    const headers = ['NO', 'TANGGAL', 'PENERIMA_PENGHASILAN', 'NPWP_NIK', 'KODE_OBJEK_PAJAK', 'DPP', 'TARIF', 'PPH', 'NOMOR_BUPOT'];
    
    const rows = data.map((item, idx) => [
      idx + 1, new Date(item.date).toLocaleDateString(), item.merchant, 'NPWP-REQUIRED', 
      item.article === '23' ? '24-104-01' : '24-401-01', item.dpp, item.rate, item.pph, `BPT-${idx+1}`
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EBupot_Unifikasi_PPh_${period.month}_${period.year}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const filteredData = data.filter(item => 
    item.merchant.toLowerCase().includes(search.toLowerCase()) || 
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Aggregating PPh Unifikasi (Unified Withholding) for {period.month}/{period.year}...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/taxation" className={styles.backBtn}><ArrowLeft size={18}/></Link>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Unified Income Tax (PPh)</h1>
            <p className={styles.subtitle}>Consolidated withholding tax tracking for e-Bupot Unifikasi reporting.</p>
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={exportCSV}>
          <Download size={16}/> Export e-Bupot CSV
        </button>
      </div>

      {/* Overview Grid */}
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
               <button onClick={fetchData} className={styles.refreshBtn}><Activity size={16}/></button>
            </div>
         </div>
         <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Withheld (PPH)</div>
            <div className={styles.metricValue}>Rp {data.reduce((sum, item) => sum + item.pph, 0).toLocaleString()}</div>
            <div className={styles.metricSub}>TOTAL LIABILITY RECORDED</div>
         </div>
         <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Transaction Depth</div>
            <div className={styles.metricValue}>{data.length} Certificates</div>
            <div className={styles.metricSub}>UNIQUE WITHHOLDING EVENTS</div>
         </div>
         <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Article Mix</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
               <span className={styles.articleBadge}>PPh 23: {data.filter(i => i.article === '23').length}</span>
               <span className={styles.articleBadge}>PPh 4(2): {data.filter(i => i.article === '4(2)').length}</span>
            </div>
         </div>
      </div>

      {/* Registry */}
      <div className={styles.panel}>
         <div className={styles.tableHeader}>
            <div className={styles.tableTitleGroup}>
               <h2 className={styles.tableTitle}>Withholding realizations</h2>
               <span className={styles.liveIndicator}>AUDIT READY</span>
            </div>
            <div className={styles.searchBox}>
               <Search size={16} />
               <input type="text" placeholder="Search Merchant or Description..." value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>
         </div>
         <table className={styles.table}>
            <thead>
               <tr>
                  <th>DATE & MERCHANT</th>
                  <th>DESCRIPTION</th>
                  <th>TAX ARTICLE</th>
                  <th className={styles.numeric}>DPP (BASE)</th>
                  <th className={styles.numeric}>RATE</th>
                  <th className={styles.numeric}>PPH AMOUNT</th>
                  <th className={styles.textRight}>ACTIONS</th>
               </tr>
            </thead>
            <tbody>
               {filteredData.map(item => (
                  <tr key={item.id}>
                     <td>
                        <div style={{ fontWeight: 800 }}>{item.merchant}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{new Date(item.date).toLocaleDateString()}</div>
                     </td>
                     <td style={{ maxWidth: '250px' }}>{item.description}</td>
                     <td>
                        <span className={`${styles.articleTag} ${styles['art' + item.article.replace('(', '').replace(')', '')]}`}>
                           Article {item.article}
                        </span>
                     </td>
                     <td className={styles.numeric}>Rp {item.dpp.toLocaleString()}</td>
                     <td className={styles.numeric}>{item.rate}%</td>
                     <td className={styles.numeric} style={{ fontWeight: 800, color: '#EF4444' }}>Rp {item.pph.toLocaleString()}</td>
                     <td className={styles.textRight}>
                        <button className={styles.moreBtn}><ChevronRight size={16}/></button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
