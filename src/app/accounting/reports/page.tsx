'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Calculator, 
  ArrowRight, 
  Download, 
  FileText, 
  ShieldCheck, 
  Activity,
  Layers,
  BarChart,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';

export default function AccountingReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/accounting/reports')
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
      <p>Analyzing Integrated AKSIA Financial Ledger...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox} style={{ backgroundColor: 'rgba(39, 156, 90, 0.1)' }}>
            <PieChart size={24} color="#279C5A"/>
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Financial Intelligence</h1>
            <p className={styles.subtitle}>Strategic real-time P&L and Balance Sheet derived from operational stock and sales data.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.integratedBadge}><Activity size={14}/> LIVE DATA SYNC</button>
           <button className={styles.btnSecondary} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <Download size={16}/> Export PDF
           </button>
        </div>
      </div>

      {/* KPI Overviews */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Cash on Hand</div>
           <div className={styles.metricValue}>Rp {(data?.balanceSheet.currentAssets.cash || 0).toLocaleString()}</div>
           <div className={styles.metricSub}>LIQUID ASSETS</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Inventory Asset Value</div>
           <div className={styles.metricValue}>Rp {(data?.balanceSheet.currentAssets.inventory || 0).toLocaleString()}</div>
           <div className={styles.metricSub}>PHYSICAL VALUATION</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Net Profit (YTD)</div>
           <div className={styles.metricValue} style={{ color: '#059669' }}>
             Rp {(data?.profitAndLoss.netProfit || 0).toLocaleString()}
           </div>
           <div className={styles.metricSub}>OPERATIONAL SURPLUS</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Net Margin</div>
           <div className={styles.metricValue}>{data?.ratios.netMargin}%</div>
           <div className={styles.metricSub}>PROFITABILITY RATIO</div>
        </div>
      </div>

      <div className={styles.reportGrid}>
        {/* Balance Sheet (Integrated Asset View) */}
        <div className={styles.panel}>
           <h2 className={styles.panelTitle}><Calculator size={20}/> Integrated Balance Sheet</h2>
           <div className={styles.financeTable}>
              <div className={styles.sectionHeader}>Current Assets</div>
              <div className={styles.lineItem}>
                 <span className={styles.label}>Cash & Cash Equivalents</span>
                 <span className={styles.value}>Rp {(data?.balanceSheet.currentAssets.cash || 0).toLocaleString()}</span>
              </div>
              <div className={styles.lineItem}>
                 <span className={styles.label}>Inventory Valuation</span>
                 <span className={styles.value}>Rp {(data?.balanceSheet.currentAssets.inventory || 0).toLocaleString()}</span>
              </div>
              <div className={styles.lineItem}>
                 <span className={styles.label}>Accounts Receivable</span>
                 <span className={styles.value}>Rp {(data?.balanceSheet.currentAssets.accountsReceivable || 0).toLocaleString()}</span>
              </div>
              <div className={styles.totalRow}>
                 <span>Total Assets</span>
                 <span>Rp {(data?.balanceSheet.currentAssets.total + (data?.balanceSheet.currentAssets.accountsReceivable || 0)).toLocaleString()}</span>
              </div>

              <div className={styles.sectionHeader} style={{ marginTop: '32px' }}>Liabilities & Equity</div>
              <div className={styles.lineItem}>
                 <span className={styles.label}>Estimated Taxes Payable (PPN)</span>
                 <span className={styles.value}>Rp {(data?.balanceSheet.liabilities.taxesPayable || 0).toLocaleString()}</span>
              </div>
              <div className={styles.lineItem}>
                 <span className={styles.label}>Owner Equity</span>
                 <span className={styles.value}>Rp {(data?.balanceSheet.currentAssets.total - data?.balanceSheet.liabilities.taxesPayable).toLocaleString()}</span>
              </div>
              <div className={styles.totalRow}>
                 <span>Total Liabilities & Equity</span>
                 <span>Rp {(data?.balanceSheet.currentAssets.total + (data?.balanceSheet.currentAssets.accountsReceivable || 0)).toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* Profit & Loss (Operational Performance) */}
        <div className={styles.panel}>
           <h2 className={styles.panelTitle}><TrendingUp size={20}/> Profit & Loss Statement</h2>
           <div className={styles.financeTable}>
              <div className={styles.sectionHeader}>Operational Income</div>
              <div className={styles.lineItem}>
                 <span className={styles.label}>Gross Sales Revenue</span>
                 <span className={styles.value}>Rp {(data?.profitAndLoss.revenue || 0).toLocaleString()}</span>
              </div>
              <div className={styles.lineItem}>
                 <span className={styles.label}>Cost of Goods Sold (COGS)</span>
                 <span className={styles.value} style={{ color: '#DC2626' }}>- Rp {(data?.profitAndLoss.cogs || 0).toLocaleString()}</span>
              </div>
              <div className={styles.totalRow} style={{ borderTop: 'none', background: '#F8FAFC', padding: '12px 20px', borderRadius: '8px' }}>
                 <span style={{ fontSize: '0.95rem' }}>Gross Profit</span>
                 <span>Rp {(data?.profitAndLoss.grossProfit || 0).toLocaleString()}</span>
              </div>

              <div className={styles.sectionHeader} style={{ marginTop: '32px' }}>Operating Expenses</div>
              <div className={styles.lineItem}>
                 <span className={styles.label}>Operating & General Expenses</span>
                 <span className={styles.value} style={{ color: '#DC2626' }}>- Rp {(data?.profitAndLoss.expenses || 0).toLocaleString()}</span>
              </div>
              
              <div className={styles.netProfitRow}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <ShieldCheck size={18}/> NET OPERATING PROFIT
                 </div>
                 <span>Rp {(data?.profitAndLoss.netProfit || 0).toLocaleString()}</span>
              </div>

              {/* Ratios Mini-panel */}
              <div className={styles.ratioPanel} style={{ marginTop: '24px', padding: '16px', background: '#F1F5F9', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                 <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>GROSS MARGIN</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{data?.ratios.grossMargin}%</div>
                 </div>
                 <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>NET PROBABILITY</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{data?.ratios.netMargin}%</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
