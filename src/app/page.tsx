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
  RefreshCw
} from 'lucide-react';

import styles from './page.module.css';

const defaultLedgerData = [
  { id: 'TXN-90218', entity: 'Amazon Web Services', date: 'Oct 12, 2023', category: 'OPERATING', amount: '-$1,420.00', status: 'CLEARED' },
  { id: 'TXN-90219', entity: 'Velocity Agency', date: 'Oct 11, 2023', category: 'REVENUE', amount: '+$8,500.00', status: 'PENDING' },
];

export default function DashboardFinancialOutlook() {
  const [dateFilter, setDateFilter] = useState('this_month');
  const [loading, setLoading] = useState(true);
  
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalPending: 0,
    pendingCount: 0,
    netProfit: 0,
    netMargin: 0
  });

  const [cashFlowData, setCashFlowData] = useState([]);
  
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/summary');
      const data = await res.json();
      if (res.ok) {
        setKpis(data.kpis);
        setCashFlowData(data.cashFlowData);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Financial Outlook</h1>
          <span className={styles.pageSubtitle}>Global Enterprise Overview</span>
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
                 <option value="this_month">Bulan ini (This Month)</option>
                 <option value="last_month">Bulan lalu (Last Month)</option>
                 <option value="this_year">Tahun ini (This Year)</option>
                 <option value="last_year">Tahun lalu (Last Year)</option>
                 <option value="quarterly">Quarterly</option>
                 <option value="custom">Custom date range...</option>
               </select>
             </div>
             
             {dateFilter === 'custom' && (
               <div className={styles.customDateWrapper}>
                 <input type="date" className={styles.dateInput} />
                 <span className={styles.dateSeparator}>to</span>
                 <input type="date" className={styles.dateInput} />
               </div>
             )}
           </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCardBlueBorder}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>TOTAL REVENUE</div>
            <div className={styles.badgeSuccess}>Live</div>
          </div>
          <div className={styles.kpiValue}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24}/> : `$${kpis.totalRevenue.toLocaleString()}`}
          </div>
          <div className={styles.kpiTrend}>Earned across Invoices</div>
          <div className={styles.watermarkIcon}>💵</div>
        </div>

        <div className={styles.kpiCardDefault}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>PENDING INVOICES</div>
            <div className={styles.badgeDanger}>{kpis.pendingCount} Priority</div>
          </div>
          <div className={styles.kpiValue}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24}/> : `$${kpis.totalPending.toLocaleString()}`}
          </div>
          <div className={styles.kpiTrend}>Expected by end of period</div>
          <div className={styles.watermarkIcon}>📋</div>
        </div>

        <div className={styles.kpiCardNetProfit}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabelWhite}>NET PROFIT</div>
            <div className={styles.badgeSolidSuccess}>Optimal</div>
          </div>
          <div className={styles.kpiValueWhite}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24} color="white"/> : `$${kpis.netProfit.toLocaleString()}`}
          </div>
          <div className={styles.kpiTrendWhite}>Net margin: {kpis.netMargin}%</div>
        </div>
      </div>

      {/* Main Row */}
      <div className={styles.mainRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Cash Flow Analysis</h3>
              <p className={styles.chartSubtitle}>Revenue vs. Expenses (Last 6 Months)</p>
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
                {/* Custom styling for bars to match the mockup */}
                <Bar dataKey="Revenue" fill="#0F3B8C" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="Expenses" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartFooter}>
            <p className={styles.chartFooterText}>
              Estimated projection for Q4 shows a <strong>12% growth</strong> trend.
            </p>
            <button className={styles.chartFooterLink}>Download Report</button>
          </div>
        </div>

        <div className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <h3 className={styles.chartTitle}>Recent Activity</h3>
            <button className={styles.moreBtn}><MoreHorizontal size={18} /></button>
          </div>
          
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <div className={`${styles.iconWrap} ${styles.iconGreen}`}>
                <CheckCircle2 size={18} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.actTitle}>Invoice #8291 Paid</div>
                <div className={styles.actDesc}>Global Tech Corp • $12,400.00</div>
                <div className={styles.actTime}>2 hours ago</div>
              </div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={`${styles.iconWrap} ${styles.iconGray}`}>
                <UploadCloud size={18} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.actTitle}>New Expense Recorded</div>
                <div className={styles.actDesc}>Cloud Infrastructure • $2,840.50</div>
                <div className={styles.actTime}>5 hours ago</div>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div className={`${styles.iconWrap} ${styles.iconRed}`}>
                <AlertTriangle size={18} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.actTitle}>Invoice Overdue</div>
                <div className={styles.actDesc}>Creative Hub Studio • $4,200.00</div>
                <div className={styles.actTime}>Yesterday</div>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div className={`${styles.iconWrap} ${styles.iconBlue}`}>
                <UserPlus size={18} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.actTitle}>New Client Added</div>
                <div className={styles.actDesc}>Solaris Energy Systems</div>
                <div className={styles.actTime}>Yesterday</div>
              </div>
            </div>
          </div>
          
          <button className={styles.viewAuditBtn}>VIEW AUDIT TRAIL</button>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className={styles.ledgerSection}>
        <div className={styles.ledgerHeader}>
          <h3 className={styles.ledgerTitle}>Latest Financial Ledger</h3>
          <div className={styles.ledgerActions}>
            <button className={styles.btnOutline}>Filter By Date</button>
            <button className={styles.btnPrimary}>Export CSV</button>
          </div>
        </div>
        
        <table className={styles.ledgerTable}>
          <thead>
            <tr>
              <th>TRANSACTION ID</th>
              <th>ENTITY NAME</th>
              <th>DATE</th>
              <th>CATEGORY</th>
              <th className={styles.textRight}>AMOUNT</th>
              <th className={styles.textRight}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {defaultLedgerData.map((row) => (
              <tr key={row.id}>
                <td className={styles.txnId}>{row.id}</td>
                <td className={styles.entityName}>{row.entity}</td>
                <td className={styles.dateCol}>
                   <div className={styles.dateMonth}>{row.date.split(' ')[0]} {row.date.split(' ')[1].replace(',', '')}</div>
                   <div className={styles.dateYear}>{row.date.split(' ')[2]}</div>
                </td>
                <td>
                  <span className={styles.catBadge}>{row.category}</span>
                </td>
                <td className={`${styles.textRight} ${styles.amountVal}`}>{row.amount}</td>
                <td className={styles.textRight}>
                  <span className={`${styles.statusBadge} ${styles[row.status.toLowerCase()]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className={styles.viewAllContainer}>
           <button className={styles.viewAllLink}>View All Transactions</button>
        </div>
      </div>
    </div>
  );
}
