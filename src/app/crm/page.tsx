'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  Activity,
  Plus,
  Filter,
  MoreHorizontal,
  Globe,
  PieChart,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import RoleGuard from '@/components/common/RoleGuard';

export default function CRMDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Period State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/crm/stats?month=${selectedMonth}&year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedMonth, setSelectedYear]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing Sales Intelligence for {months[selectedMonth-1]} {selectedYear}...</p>
    </div>
  );

  return (
    <RoleGuard moduleKey="CRM">
      <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <Activity size={28} color="#279C5A"/>
          </div>
          <div>
            <h1 className={styles.title}>CRM Intelligence</h1>
            <p className={styles.subtitle}>Institutional sales oversight for {months[selectedMonth-1]} {selectedYear}.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.periodPicker}>
            <select 
              className={styles.periodSelect}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <select 
              className={styles.periodSelect}
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Link href="/crm/reports" className={styles.btnSecondary}>
            <PieChart size={16}/> Intelligence
          </Link>
          <Link href="/crm/pipeline" className={styles.btnPrimary}>
            <Zap size={16}/> Sales Pipeline
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><Target size={24} color="#279C5A"/></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>GROSS PIPELINE</span>
            <span className={styles.kpiValue}>Rp {(stats?.totalPipeline || 0).toLocaleString()}</span>
            <span className={styles.kpiTrend}><TrendingUp size={12}/> +12.5% vs Prev</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><TrendingUp size={24} color="#3B82F6"/></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>WEIGHTED REVENUE</span>
            <span className={styles.kpiValue}>Rp {(stats?.weightedPipeline || 0).toLocaleString()}</span>
            <span className={styles.kpiSub}>PROBABILITY ADJUSTED</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><Users size={24} color="#10B981"/></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>ACTIVE PROSPECTS</span>
            <span className={styles.kpiValue}>{stats?.activeLeads || 0}</span>
            <span className={styles.kpiSub}><div className={styles.pulse}></div> LIVE ENGAGEMENT</span>
          </div>
        </div>

        <Link href="/crm/campaigns" className={styles.kpiCard}>
          <div className={styles.kpiIcon}><Globe size={24} color="#279C5A"/></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>MARKETING ROI</span>
            <span className={styles.kpiValue}>{stats?.campaignCount || 0} Active</span>
            <span className={styles.kpiSub}>CAMPAIGN TRACKING</span>
          </div>
        </Link>
      </div>

      {/* Funnel & Stages */}
      <div className={styles.mainGrid}>
        {/* Sales Funnel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Conversion Funnel</h2>
            <Link href="/crm/leads" className={styles.viewAll}>View Details <ArrowRight size={14}/></Link>
          </div>
          <div className={styles.funnelContainer}>
            {Array.isArray(stats?.funnel) ? stats.funnel.map((item: any, i: number) => (
              <div 
                key={item.name} 
                className={styles.funnelStage}
                style={{ 
                  width: `${100 - (i * 10)}%`, 
                  background: item.color === '#3B82F6' ? '#279C5A' : item.color,
                  opacity: 1 - (i * 0.1)
                }}
              >
                <span className={styles.stageName}>{item.name}</span>
                <span className={styles.stageVal}>{item.value}</span>
              </div>
            )) : <div className={styles.emptyState}>No conversion metrics synchronized.</div>}
          </div>
        </div>

        {/* Recent Deals */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Active Opportunities</h2>
            <Link href="/crm/pipeline" className={styles.viewAll}>Full Pipeline <ArrowRight size={14}/></Link>
          </div>
          <div className={styles.dealList}>
            {Array.isArray(stats?.recentDeals) && stats.recentDeals.length > 0 ? (
              stats.recentDeals.map((deal: any) => (
                <div key={deal.id} className={styles.dealItem}>
                  <div className={styles.dealInfo}>
                    <h4 className={styles.dealTitle}>{deal.title}</h4>
                    <p className={styles.dealClient}>{deal.contact?.name || deal.lead?.name || 'Private Entity'}</p>
                  </div>
                  <div className={styles.dealMetrics}>
                    <span className={styles.dealValue}>Rp {(deal.value || 0).toLocaleString()}</span>
                  </div>
                  <button className={styles.moreBtn}><MoreHorizontal size={16}/></button>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No opportunity records found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
