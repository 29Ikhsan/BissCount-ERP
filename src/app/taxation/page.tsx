'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  ShieldCheck, 
  FileText, 
  Download, 
  Activity, 
  ArrowRight, 
  HelpCircle, 
  AlertTriangle,
  PieChart,
  Target,
  Search,
  Settings,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Bot,
  Users
} from 'lucide-react';
import Link from 'next/link';

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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox} style={{ backgroundColor: 'rgba(39, 156, 90, 0.1)' }}>
            <ShieldCheck size={24} color="#279C5A"/>
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
           <button className={styles.integratedBadge}><ShieldCheck size={14}/> DJP SYNCHRONIZED</button>
        </div>
      </div>

      {/* TARA HERO INSIGHT */}
      <div className={styles.panel} style={{ marginBottom: '32px', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', border: 'none', color: 'white' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
               <div className={styles.iconBox} style={{ backgroundColor: 'rgba(39, 156, 90, 0.2)', width: '64px', height: '64px' }}>
                  <Bot size={32} color="#279C5A"/>
               </div>
               <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Strategic Tax Intelligence (TARA)</h2>
                  <p style={{ opacity: 0.8, fontSize: '0.9rem', maxWidth: '600px' }}>
                     Your AI assistant is analyzing the latest 2026 Indonesian tax regulations (PMK). 
                     Current environment: PPN 12% Active. PPh Unifikasi e-Bupot integration stable.
                  </p>
               </div>
            </div>
            <Link href="/tax-assistant" className={styles.btnPrimary} style={{ background: '#279C5A', border: 'none' }}>
               Consult with TARA <MessageSquare size={16}/>
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
           <div className={styles.metricLabel}>Withholding Tax (YTD)</div>
           <div className={styles.metricValue}>Rp {(stats?.totalPPh || 0).toLocaleString()}</div>
           <div className={styles.metricSub}>UNIFIED PPH COLLECTION</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Compliance Health</div>
           <div className={styles.metricValue} style={{ color: stats?.ppnIncomplete > 0 ? '#EF4444' : '#279C5A' }}>
              {stats?.ppnIncomplete > 0 ? `${stats.ppnIncomplete} Missing Tax IDs` : '100% REGULATED'}
           </div>
           <div className={styles.metricSub}>DATA INTEGRITY SCORE</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Active Certificates</div>
           <div className={styles.metricValue}>Active</div>
           <div className={styles.metricSub}>E-FAKTUR STATUS</div>
        </div>
      </div>

      <div className={styles.complianceGrid}>
        {/* PPN Module */}
        <div className={styles.panel}>
           <h2 className={styles.panelTitle}><FileText size={20} color="#279C5A"/> PPN Keluaran (e-Faktur)</h2>
           <p className={styles.panelDescription}>
              Manage Outbound VAT from sales invoices. Verify customer NPWP and address 
              before exporting to e-Faktur CSV importer.
           </p>
           <div className={styles.statusIndicator}>
              <Activity size={16}/> {stats?.ppnIncomplete} transactions require NPWP review.
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
              Aggregate withholding taxes from vendor payments (PPh 23, 21, 4(2)). 
              Generate unified tax reports for DJP compliance.
           </p>
           <div className={styles.statusIndicator}>
              <TrendingUp size={16}/> {stats?.pphCount} withholding lines recorded this period.
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
              Reconcile Income Tax Article 21 from monthly payroll. Generate e-Bupot 21 
              certificates for employees and institutional reporting.
           </p>
           <div className={styles.statusIndicator}>
              <Activity size={16}/> Integrated with HRM & Payroll Ledger.
           </div>
           <div style={{ marginTop: '24px' }}>
              <Link href="/taxation/pph21" className={styles.btnPrimary}>
                 Manage PPh 21 <ArrowRight size={16}/>
              </Link>
           </div>
        </div>
      </div>

      {/* TARA Integration Card */}
      <div className={styles.panel} style={{ marginTop: '32px', background: 'linear-gradient(135deg, #279C5A 0%, #1e7d48 100%)', color: 'white' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <h2 className={styles.panelTitle} style={{ color: 'white' }}><HelpCircle size={20}/> Consult with TARA</h2>
               <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Unsure about PPN 12% or PPh 23 rates? Ask TARA, your integrated Tax Assistant Robot.
               </p>
            </div>
            <Link href="/tax-assistant" className={styles.btnPrimary} style={{ background: 'white', color: '#279C5A' }}>
               Start Consultation <MessageSquare size={16}/>
            </Link>
         </div>
      </div>
    </div>
  );
}
