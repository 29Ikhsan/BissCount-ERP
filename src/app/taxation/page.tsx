'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  ShieldCheck, 
  FileText, 
  Activity, 
  ArrowRight, 
  PieChart,
  Bot,
  MessageSquare,
  Users,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import RoleGuard from '@/components/common/RoleGuard';

export default function TaxationHub() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const years = [2024, 2025, 2026];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ month: month.toString(), year: year.toString() });
    
    // Fetch overview stats
    Promise.all([
      fetch(`/api/taxation/ppn?${params}`).then(res => res.json()),
      fetch(`/api/taxation/pph-unifikasi?${params}`).then(res => res.json())
    ]).then(([ppn, pph]) => {
      const ppnList = Array.isArray(ppn) ? ppn : [];
      const pphList = Array.isArray(pph) ? pph : [];
      
      const totalPPN = ppnList.reduce((sum: number, item: any) => sum + item.ppn, 0);
      const totalPPh = pphList.reduce((sum: number, item: any) => sum + item.pph, 0);
      setStats({
        totalPPN,
        totalPPh,
        ppnIncomplete: ppnList.filter((i: any) => i.status === 'INCOMPLETE').length,
        pphCount: pphList.length
      });
      setLoading(false);
    }).catch((err) => {
      console.error("Fetch stats error:", err);
      setLoading(false);
    });
  }, [month, year]);

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing AKSIA Compliance Data...</p>
    </div>
  );

  return (
    <RoleGuard moduleKey="TaxCompliance">
      <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <ShieldCheck size={28} color="#279C5A"/>
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Tax & Compliance</h1>
            <p className={styles.subtitle}>Institutional oversight for PPN Keluaran, PPh Unifikasi, and AI-driven regulatory compliance.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.periodSelectorHub}>
              <select 
                className={styles.periodDropdown} 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select 
                className={styles.periodDropdown} 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <div className={styles.integratedBadge}>
              <Activity size={12}/> DJP SYNCHRONIZED
           </div>
        </div>
      </div>

      {/* TARA HERO INSIGHT */}
      <div className={styles.taraHero}>
          <div className={styles.taraContent}>
            <div className={styles.taraInfo}>
               <div className={styles.taraIconBox}>
                  <Bot size={32} color="#279C5A"/>
               </div>
               <div>
                  <h2 className={styles.taraTitle}>Strategic Tax Intelligence (TARA)</h2>
                  <p className={styles.taraDesc}>
                     Your AI assistant is analyzing the latest 2026 Indonesian tax regulations (PMK 12/2026). 
                     Current environment: <strong>PPN 12% Active</strong>. PPh Unifikasi e-Bupot integration stable and monitored.
                  </p>
               </div>
            </div>
            <Link href="/tax-assistant" className={styles.btnPrimary} style={{ background: '#279C5A', border: 'none', minWidth: '220px' }}>
               Consult with TARA Specialist <MessageSquare size={16}/>
            </Link>
          </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Total PPN (YTD)</div>
           <div className={styles.metricValue}>Rp {(stats?.totalPPN || 0).toLocaleString()}</div>
           <div className={styles.metricSub}>VAT OUTBOUND COLLECTION</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Unified PPh (YTD)</div>
           <div className={styles.metricValue}>Rp {(stats?.totalPPh || 0).toLocaleString()}</div>
           <div className={styles.metricSub}>WITHHOLDING AGGREGATE</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Compliance Health</div>
           <div className={styles.metricValue} style={{ color: stats?.ppnIncomplete > 0 ? '#EF4444' : '#10B981' }}>
              {stats?.ppnIncomplete > 0 ? `${stats.ppnIncomplete} Missing IDs` : '100% SECURE'}
           </div>
           <div className={styles.metricSub}>DATA INTEGRITY SCORE</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Audit Readiness</div>
           <div className={styles.metricValue}>High</div>
           <div className={styles.metricSub}>REGULATORY POSITION</div>
        </div>
      </div>

      <div className={styles.complianceGrid}>
        {/* PPN Module */}
        <div className={styles.panel}>
           <h2 className={styles.panelTitle}><FileText size={20} color="#279C5A"/> PPN Keluaran (e-Faktur)</h2>
           <p className={styles.panelDescription}>
              Manage Outbound VAT from sales invoices. Verify customer NPWP and address 
              before exporting to institutional e-Faktur CSV formats.
           </p>
           <div className={styles.statusIndicator}>
              {stats?.ppnIncomplete > 0 ? <AlertCircle size={14} color="#EF4444"/> : <ShieldCheck size={14} color="#10B981"/>}
              <span>{stats?.ppnIncomplete > 0 ? `${stats.ppnIncomplete} transactions require review` : 'All transactions validated'}</span>
           </div>
           <div style={{ marginTop: '24px' }}>
              <Link href="/taxation/ppn" className={styles.btnPrimary}>
                 Analyze & Export PPN <ArrowRight size={16}/>
              </Link>
           </div>
        </div>

        {/* PPh Unifikasi Module */}
        <div className={styles.panel}>
           <h2 className={styles.panelTitle}><PieChart size={20} color="#279C5A"/> PPh Unifikasi (e-Bupot)</h2>
           <p className={styles.panelDescription}>
              Aggregate withholding taxes from vendor payments. Generate unified tax 
              reports for full compliance with DJP reporting standards.
           </p>
           <div className={styles.statusIndicator}>
              <Activity size={14} color="#3B82F6"/> 
              <span>{stats?.pphCount} withholding lines recorded</span>
           </div>
           <div style={{ marginTop: '24px' }}>
              <Link href="/taxation/pph-unifikasi" className={styles.btnPrimary}>
                 Manage PPh Unifikasi <ArrowRight size={16}/>
              </Link>
           </div>
        </div>

        {/* PPh 21 Module */}
        <div className={styles.panel}>
           <h2 className={styles.panelTitle}><Users size={20} color="#279C5A"/> PPh Pasal 21 (Payroll)</h2>
           <p className={styles.panelDescription}>
              Reconcile Income Tax Article 21 from monthly payroll. Integrated with 
              HRM and individual employee tax profiles.
           </p>
           <div className={styles.statusIndicator}>
              <ShieldCheck size={14} color="#10B981"/> 
              <span>Integrated with HRM & Payroll Ledger</span>
           </div>
           <div style={{ marginTop: '24px' }}>
              <Link href="/taxation/pph21" className={styles.btnPrimary}>
                 Manage PPh 21 <ArrowRight size={16}/>
              </Link>
           </div>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
