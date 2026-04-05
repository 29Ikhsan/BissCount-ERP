'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  TrendingUp, 
  Target, 
  BarChart2, 
  Zap, 
  ArrowLeft, 
  Activity, 
  PieChart, 
  Globe, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function IntelligenceReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/intelligence')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Consulting TARA for Strategic Insights...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/crm" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>AKSIA Strategic Intelligence</h1>
            <p className={styles.subtitle}>Predictive forecasting, velocity audits, and tax-aware profitability.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.btnSecondary}><Activity size={16}/> System Health: Optimal</button>
        </div>
      </div>

      <div className={styles.reportsGrid}>
        {/* 1. FORECAST ENGINE */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <TrendingUp size={20} color="#279C5A"/> 6-Month Weighted Forecast
          </div>
          <div className={styles.chartContainer}>
            {data?.forecast.map((item: any) => {
              const maxVal = Math.max(...data.forecast.map((f: any) => f.gross), 1000000);
              const heightGross = (item.gross / maxVal) * 100;
              const heightWeighted = (item.weighted / maxVal) * 100;
              
              return (
                <div key={item.month} className={styles.barWrapper}>
                  <div className={styles.barGroup} style={{ height: '100%', width: '100%', position: 'relative' }}>
                    <div className={styles.bar} style={{ height: `${heightGross}%`, opacity: 0.1, backgroundColor: '#279C5A', position: 'absolute', width: '100%' }}></div>
                    <div className={styles.bar} style={{ height: `${heightWeighted}%`, backgroundColor: '#279C5A', position: 'absolute', width: '100%' }}>
                      <span className={styles.barValue}>Rp {(item.weighted / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                  <span className={styles.barLabel}>{item.month}</span>
                </div>
              );
            })}
          </div>
          <p className={styles.chartLegend}>* Weighted based on deal stage probability and expected close date.</p>
        </div>

        {/* 2. TARA TAX INSIGHTS */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <ShieldCheck size={20} color="#279C5A"/> TARA Strategic Tax Audit
          </div>
          <div className={styles.taxSummary}>
            <div className={styles.taxCardMain}>
              <div className={styles.taxLabel}>PROJECTED NET PROFIT (WON)</div>
              <div className={styles.taxValue}>Rp {(data?.taxIntelligence.netProfit || 0).toLocaleString()}</div>
              <div className={styles.taxSub}>After Estimated PPN & Corporate Income Tax</div>
            </div>
            
            <div className={styles.taxBreakdown}>
              <div className={styles.miniTaxCard}>
                 <div className={styles.miniLabel}>EST. PPN (12%)</div>
                 <div className={styles.miniValue}>Rp {(data?.taxIntelligence.estPPN || 0).toLocaleString()}</div>
              </div>
              <div className={styles.miniTaxCard}>
                 <div className={styles.miniLabel}>EST. INCOME TAX (25%)</div>
                 <div className={styles.miniValue}>Rp {(data?.taxIntelligence.estIncomeTax || 0).toLocaleString()}</div>
              </div>
              <div className={styles.miniTaxCard}>
                 <div className={styles.miniLabel}>NET PROFIT MARGIN</div>
                 <div className={styles.miniValue}>{data?.taxIntelligence.profitMargin}%</div>
              </div>
              <div className={styles.miniTaxCard}>
                 <div className={styles.miniLabel}>WON VELOCITY</div>
                 <div className={styles.miniValue}>{data?.velocity.avgDaysToWon} Days</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SOURCE ROI MATRIX */}
        <div className={`${styles.panel} ${styles.fullWidth}`}>
          <div className={styles.panelTitle}>
            <Globe size={20} color="#279C5A"/> Lead Source ROI & Conversion Efficiency
          </div>
          <table className={styles.roiTable}>
            <thead>
              <tr>
                <th className={styles.roiTh}>Acquisition Source</th>
                <th className={styles.roiTh}>Active Leads</th>
                <th className={styles.roiTh}>Won Count</th>
                <th className={styles.roiTh}>Conversion Rate</th>
                <th className={styles.roiTh}>Cumulative Revenue</th>
                <th className={styles.roiTh}>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {data?.roi.map((row: any) => (
                <tr key={row.name}>
                  <td className={styles.roiTd}><span className={styles.sourceName}>{row.name}</span></td>
                  <td className={styles.roiTd}>{row.count}</td>
                  <td className={styles.roiTd}>{row.won}</td>
                  <td className={styles.roiTd}><span className={styles.convBadge}>{row.conversion}%</span></td>
                  <td className={styles.roiTd}>Rp {row.revenue.toLocaleString()}</td>
                  <td className={styles.roiTd}>
                    <div className={styles.efficiencyMeter}>
                       <div className={styles.efficiencyBar} style={{ width: `${row.conversion}%`, backgroundColor: '#279C5A' }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
