'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Calculator, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  Activity, 
  ShieldCheck,
  ChevronRight,
  MoreHorizontal,
  FileText,
  TrendingUp,
  Download
} from 'lucide-react';
import Link from 'next/link';

export default function GeneralLedger() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLedger = () => {
    setLoading(true);
    fetch('/api/accounting/ledger')
      .then(res => res.json())
      .then(data => {
        setLedger(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filteredLedger = ledger.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) || 
    acc.code.includes(search)
  );

  const totals = ledger.reduce((acc, curr) => ({
    debit: acc.debit + curr.totalDebit,
    credit: acc.credit + curr.totalCredit
  }), { debit: 0, credit: 0 });

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing the Master Book of Accounts...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox} style={{ backgroundColor: 'rgba(39, 156, 90, 0.1)' }}>
            <Calculator size={24} color="#279C5A"/>
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>General Ledger</h1>
            <p className={styles.subtitle}>Institutional Trial Balance and real-time account movement overview.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon}/>
              <input 
                type="text" 
                placeholder="Search Account Code or Name..." 
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <Link href="/accounting/journal" className={styles.btnSecondary} style={{ marginRight: '10px' }}>
              <FileText size={16}/> Journal Entries
           </Link>
           <button className={styles.btnPrimary}>
             <Download size={16}/> Export Ledger
           </button>
        </div>
      </div>

      {/* Trial Balance Overview */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Total Debit (GL)</div>
           <div className={styles.metricValue}>Rp {totals.debit.toLocaleString()}</div>
           <div className={styles.metricSub}>CUMULATIVE DEBITS</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Total Credit (GL)</div>
           <div className={styles.metricValue}>Rp {totals.credit.toLocaleString()}</div>
           <div className={styles.metricSub}>CUMULATIVE CREDITS</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Imbalance Threshold</div>
           <div className={styles.metricValue} style={{ color: totals.debit === totals.credit ? '#279C5A' : '#EF4444' }}>
              {totals.debit === totals.credit ? 'BALANCED' : `Rp ${(totals.debit - totals.credit).toLocaleString()}`}
           </div>
           <div className={styles.metricSub}>DOUBLE-ENTRY STATUS</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Total Accounts</div>
           <div className={styles.metricValue}>{ledger.length} Accounts</div>
           <div className={styles.metricSub}>CHART DEPTH</div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className={styles.ledgerPanel}>
        <div className={styles.tableHeader}>
           <div className={styles.tableTitleGroup}>
              <h2 className={styles.tableTitle}>Trial Balance realization</h2>
              <span className={styles.liveIndicator}>AUDIT READY</span>
           </div>
           <div className={styles.integratedBagde}><ShieldCheck size={14}/> 100% Sequential Integrity</div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>CODE & ACCOUNT NAME</th>
              <th>ACCOUNT TYPE</th>
              <th className={styles.numeric}>TOTAL DEBIT</th>
              <th className={styles.numeric}>TOTAL CREDIT</th>
              <th className={styles.numeric}>NET BALANCE</th>
              <th className={styles.textRight}>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLedger.map(acc => (
              <tr key={acc.id}>
                <td>
                  <span className={styles.codeBadge}>{acc.code}</span>
                  <span className={styles.accountName}>{acc.name}</span>
                </td>
                <td>
                  <span className={`${styles.typeBadge} ${styles[acc.type.toLowerCase()]}`}>
                    {acc.type}
                  </span>
                </td>
                <td className={styles.numeric}>Rp {acc.totalDebit.toLocaleString()}</td>
                <td className={styles.numeric}>Rp {acc.totalCredit.toLocaleString()}</td>
                <td className={styles.numeric} style={{ fontWeight: 800 }}>
                   Rp {acc.balance.toLocaleString()}
                </td>
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
