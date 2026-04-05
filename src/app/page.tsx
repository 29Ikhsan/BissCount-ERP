'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  CheckCircle2, 
  UploadCloud, 
  AlertTriangle, 
  UserPlus,
  MoreHorizontal,
  Calendar,
  RefreshCw,
  PlusCircle,
  Receipt,
  PlayCircle,
  SearchCode
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

const defaultLedgerData = [
  { id: 'TXN-90218', entity: 'Amazon Web Services', date: 'Oct 12, 2023', category: 'OPERATING', amount: -1420000, status: 'CLEARED' },
  { id: 'TXN-90219', entity: 'Velocity Agency', date: 'Oct 11, 2023', category: 'REVENUE', amount: 8500000, status: 'PENDING' },
];

export default function DashboardFinancialOutlook() {
  const [dateFilter, setDateFilter] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t, formatCurrency } = useLanguage();
  
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalPending: 0,
    pendingCount: 0,
    netProfit: 0,
    netMargin: 0
  });

  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/summary');
      const data = await res.json();
      if (res.ok) {
        setKpis(data.kpis);
        setCashFlowData(data.cashFlowData);
        if (data.recentActivity) setRecentActivity(data.recentActivity);
        if (data.ledgerData) setLedgerData(data.ledgerData);
      } else {
        setError(data.error);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
      setError('Connection failure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = () => {
    window.location.href = '/api/reports?export=true';
  };

  const calculateGrowth = () => {
    if (cashFlowData.length < 2) return 0;
    const last = cashFlowData[cashFlowData.length - 1].Revenue;
    const prev = cashFlowData[cashFlowData.length - 2].Revenue;
    if (prev === 0) return last > 0 ? 100 : 0;
    return (((last - prev) / prev) * 100).toFixed(1);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>{t('FinancialOutlook')}</h1>
          <span className={styles.pageSubtitle}>{t('GlobalEnterpriseOverview')}</span>
        </div>
        
        <div className={styles.headerActions}>
           <div className={styles.dateFilterContainer}>
             <div className={styles.dateFilterWrapper}>
               <Calendar size={16} className={styles.dateIcon} />
               <select 
                 className={styles.dateSelect}
                 value={dateFilter}
                 onChange={(e) => setDateFilter(e.target.value)}
               >
                 <option value="this_month">{t('ThisMonth')}</option>
                 <option value="last_month">{t('LastMonth')}</option>
                 <option value="this_year">{t('ThisYear')}</option>
                 <option value="last_year">{t('LastYear')}</option>
                 <option value="quarterly">{t('Quarterly')}</option>
                 <option value="custom">{t('CustomDateRange')}</option>
               </select>
             </div>
             
             {dateFilter === 'custom' && (
               <div className={styles.customDateWrapper}>
                 <input type="date" className={styles.dateInput} />
                 <span className={styles.dateSeparator}>{t('To')}</span>
                 <input type="date" className={styles.dateInput} />
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Quick Access Launchpad */}
      <div className={styles.quickAccessGrid}>
        <button onClick={() => router.push('/invoices')} className={styles.actionCard}>
          <div className={`${styles.actionIcon} ${styles.bgEmerald}`}>
            <PlusCircle size={20} />
          </div>
          <div className={styles.actionText}>
             <span className={styles.actionTitle}>{t('NewInvoice')}</span>
             <span className={styles.actionDesc}>{t('BillCustomer')}</span>
          </div>
        </button>

        <button onClick={() => router.push('/expenses')} className={styles.actionCard}>
          <div className={`${styles.actionIcon} ${styles.bgGray}`}>
            <Receipt size={20} />
          </div>
          <div className={styles.actionText}>
             <span className={styles.actionTitle}>{t('AddExpense')}</span>
             <span className={styles.actionDesc}>{t('LogSpending')}</span>
          </div>
        </button>

        <button onClick={() => router.push('/production')} className={styles.actionCard}>
          <div className={`${styles.actionIcon} ${styles.bgBlue}`}>
            <PlayCircle size={20} />
          </div>
          <div className={styles.actionText}>
             <span className={styles.actionTitle}>{t('StartProduction')}</span>
             <span className={styles.actionDesc}>{t('LaunchWorkOrder')}</span>
          </div>
        </button>

        <button onClick={() => router.push('/tax-assistant')} className={styles.actionCard}>
          <div className={`${styles.actionIcon} ${styles.bgTARA}`}>
            <SearchCode size={20} />
          </div>
          <div className={styles.actionText}>
             <span className={styles.actionTitle}>{t('TARAResearch')}</span>
             <span className={styles.actionDesc}>{t('TaxAIHelp')}</span>
          </div>
        </button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCardBlueBorder}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>{t('TotalRevenue')}</div>
            <div className={styles.badgeSuccess}>{t('Live')}</div>
          </div>
          <div className={styles.kpiValue}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24}/> : formatCurrency(kpis.totalRevenue)}
          </div>
          <div className={styles.kpiTrend}>{t('EarnedAcrossInvoices')}</div>
          <div className={styles.watermarkIcon}>💵</div>
        </div>

        <div className={styles.kpiCardDefault}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>{t('PendingInvoices')}</div>
            <div className={styles.badgeDanger}>{kpis.pendingCount} Priority</div>
          </div>
          <div className={styles.kpiValue}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24}/> : formatCurrency(kpis.totalPending)}
          </div>
          <div className={styles.kpiTrend}>{t('ExpectedEndPeriod')}</div>
          <div className={styles.watermarkIcon}>📋</div>
        </div>

        <div className={styles.kpiCardNetProfit}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabelWhite}>{t('NetProfit')}</div>
            <div className={styles.badgeSolidSuccess}>{t('Optimal')}</div>
          </div>
          <div className={styles.kpiValueWhite}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24} color="white"/> : formatCurrency(kpis.netProfit)}
          </div>
          <div className={styles.kpiTrendWhite}>{t('NetMargin')} {kpis.netMargin}%</div>
        </div>
      </div>

      {/* Main Row */}
      <div className={styles.mainRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>{t('CashFlowAnalysis')}</h3>
              <p className={styles.chartSubtitle}>{t('RevVsExp')}</p>
            </div>
            <div className={styles.chartLegendCustom}>
               <span className={styles.legendDotBlue}></span> Revenue
               <span className={styles.legendDotGreen}></span> Expenses
            </div>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cashFlowData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="Revenue" fill="#279C5A" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="Expenses" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartFooter}>
            <p className={styles.chartFooterText}>
              Strategic trend shows a <strong>{calculateGrowth()}% month-on-month</strong> movement.
            </p>
            <button className={styles.chartFooterLink} onClick={handleExport}>{t('DownloadXLSX')}</button>
          </div>
        </div>

        <div className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <h3 className={styles.chartTitle}>{t('RecentActivity')}</h3>
            <button className={styles.moreBtn}><MoreHorizontal size={18} /></button>
          </div>
          
          <div className={styles.activityList}>
            {loading ? <div className={styles.activityItem}>{t('LoadingItems')}</div> : (
              recentActivity.length > 0 ? recentActivity.map((item) => (
                <div key={item.id} className={styles.activityItem}>
                  <div className={`${styles.iconWrap} ${item.type === 'invoice' ? styles.iconGreen : styles.iconGray}`}>
                    {item.type === 'invoice' ? <CheckCircle2 size={18} /> : <UploadCloud size={18} />}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.actTitle}>{item.title}</div>
                    <div className={styles.actDesc}>{item.desc}</div>
                    <div className={styles.actTime}>{item.time}</div>
                  </div>
                </div>
              )) : (
                <div className={styles.activityItem}>
                   <div style={{ color: '#64748b', fontSize: '13px' }}>{t('NoRecentActivity')}</div>
                </div>
              )
            )}
          </div>
          
          <button className={styles.viewAuditBtn} onClick={() => window.location.href = '/terminal'}>{t('ViewAuditTrail')}</button>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className={styles.ledgerSection}>
        <div className={styles.ledgerHeader}>
          <h3 className={styles.ledgerTitle}>{t('FinancialLedger')}</h3>
          <div className={styles.ledgerActions}>
            <button className={styles.btnOutline}>{t('FilterByDate')}</button>
            <button className={styles.btnPrimary}>{t('Export')} CSV</button>
          </div>
        </div>
        
        <table className={styles.ledgerTable}>
          <thead>
            <tr>
              <th>{t('TransactionID')}</th>
              <th>{t('EntityName')}</th>
              <th>{t('Date')}</th>
              <th>{t('Category')}</th>
              <th className={styles.textRight}>{t('Amount')}</th>
              <th className={styles.textRight}>{t('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {(ledgerData.length > 0 ? ledgerData : []).map((row) => (
              <tr key={row.id}>
                <td className={styles.txnId}>{row.id}</td>
                <td className={styles.entityName}>{row.entity}</td>
                <td className={styles.dateCol}>
                   <div className={styles.dateMonth}>{row.date.split(' ')[0]} {row.date.split(' ')[1]?.replace(',', '')}</div>
                   <div className={styles.dateYear}>{row.date.split(' ')[2]}</div>
                </td>
                <td>
                  <span className={styles.catBadge}>{row.category}</span>
                </td>
                <td className={`${styles.textRight} ${styles.amountVal}`} style={{ color: row.amount < 0 ? '#EF4444' : '#10B981' }}>
                  {row.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(row.amount))}
                </td>
                <td className={styles.textRight}>
                  <span className={`${styles.statusBadge} ${styles[row.status.toLowerCase()] || styles.pending}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {ledgerData.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>{t('NoTransactions')}</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className={styles.viewAllContainer}>
           <button className={styles.viewAllLink}>{t('ViewAllTransactions')}</button>
        </div>
      </div>
    </div>
  );
}
