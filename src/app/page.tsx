'use client';

import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Defs, LinearGradient 
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
  SearchCode,
  ShieldCheck,
  TrendingUp,
  Activity,
  Mail
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/context/LanguageContext';
import { canAccessModule, Role } from '@/lib/access';
import styles from './page.module.css';

export default function DashboardFinancialOutlook() {
  const [dateFilter, setDateFilter] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  const { t, formatCurrency } = useLanguage();

  const userRole = (session?.user as any)?.role as Role || 'USER';
  const userPermissions = (session?.user as any)?.permissions || [];
  
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalPending: 0,
    pendingCount: 0,
    netProfit: 0,
    netMargin: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    totalPPNOut: 0,
    totalPPNIn: 0,
    netTaxPayable: 0,
    unreconciledBankCount: 0,
    highRiskContactCount: 0,
    totalARExposure: 0,
    totalPPh21Liability: 0,
    emailSuccessRate: 100,
    emailSucceeded: 0,
    totalWithSentStatus: 0
  });

  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [taxSummary, setTaxSummary] = useState<any>(null);

  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting/analytics/summary');
      const data = await res.json();
      if (res.ok) {
        setKpis(data.kpis);
        setCashFlowData(data.cashFlowData);
        if (data.recentActivity) setRecentActivity(data.recentActivity);
        if (data.ledgerData) setLedgerData(data.ledgerData);
        if (data.inventorySummary) setInventorySummary(data.inventorySummary);
        if (data.taxSummary) setTaxSummary(data.taxSummary);
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
    window.location.href = '/api/accounting/reports?export=true';
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
          <span className={styles.pageSubtitle}>Global Enterprise Intelligence Stream</span>
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
               </select>
             </div>
           </div>
        </div>
      </div>

      {/* Regulatory Alert Shield */}
      {!loading && taxSummary && taxSummary.complianceStatus !== 'NORMAL' && (
        <div className={taxSummary.complianceStatus === 'CRITICAL' ? styles.complianceAlertCritical : styles.complianceAlertWarning}>
          <div className={styles.complianceIcon}>
             <AlertTriangle size={24} />
          </div>
          <div className={styles.complianceContent}>
             <div className={styles.complianceHeader}>
                <h4 className={styles.complianceTitle}>
                   {taxSummary.complianceStatus === 'CRITICAL' 
                     ? 'REGULATORY CRITICAL: PKP Turnover Threshold Exceeded' 
                     : 'Compliance Warning: Fiscal Limit Monitor'}
                </h4>
                <div className={styles.complianceBadge}>
                   {((taxSummary.ytdTurnover / 4800000000) * 100).toFixed(1)}% Threshold
                </div>
             </div>
             
             <div className={styles.complianceBody}>
                <p>Cumulative gross turnover has reached <strong>Rp{(taxSummary.ytdTurnover || 0).toLocaleString()}</strong>. Immediate action is required per <strong>PMK 164/2023</strong> regulation.</p>
             </div>
             
             <div className={styles.complianceActions}>
                <button className={styles.complianceBtn} onClick={() => router.push('/taxation')}>
                   Open Compliance Terminal
                </button>
                <button className={styles.complianceBtnAI} onClick={() => router.push(`/tax-assistant?q=Saya sudah mencapai omzet ${taxSummary.ytdTurnover.toLocaleString('id-ID')}. Apa kewajiban pajak saya terkait PMK 164/2023?`)}>
                   <SearchCode size={16} /> Consult TARA AI
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Quick Access Launchpad */}
      <div className={styles.quickAccessGrid}>
        {canAccessModule(userRole, 'Finance', userPermissions) && (
          <button onClick={() => router.push('/invoices')} className={`${styles.actionCard} ${styles.bgEmerald}`}>
            <div className={styles.actionIcon}>
              <PlusCircle size={20} />
            </div>
            <div className={styles.actionText}>
               <span className={styles.actionTitle}>{t('NewInvoice')}</span>
               <span className={styles.actionDesc}>Bill Client</span>
            </div>
          </button>
        )}

        {canAccessModule(userRole, 'Finance', userPermissions) && (
          <button onClick={() => router.push('/expenses')} className={`${styles.actionCard} ${styles.bgGray}`}>
            <div className={styles.actionIcon}>
              <Receipt size={20} />
            </div>
            <div className={styles.actionText}>
               <span className={styles.actionTitle}>Log Expense</span>
               <span className={styles.actionDesc}>Budget Tracking</span>
            </div>
          </button>
        )}

        {canAccessModule(userRole, 'Operations', userPermissions) && (
          <button onClick={() => router.push('/production')} className={`${styles.actionCard} ${styles.bgBlue}`}>
            <div className={styles.actionIcon}>
              <PlayCircle size={20} />
            </div>
            <div className={styles.actionText}>
               <span className={styles.actionTitle}>Start Production</span>
               <span className={styles.actionDesc}>Work Order Sync</span>
            </div>
          </button>
        )}

        {canAccessModule(userRole, 'TaxCompliance', userPermissions) && (
          <button onClick={() => router.push('/tax-assistant')} className={`${styles.actionCard} ${styles.bgTARA}`}>
            <div className={styles.actionIcon}>
              <SearchCode size={20} />
            </div>
            <div className={styles.actionText}>
               <span className={styles.actionTitle}>TARA Research</span>
               <span className={styles.actionDesc}>AI Tax Analyst</span>
            </div>
          </button>
        )}
      </div>

      {/* KPI Command Center */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCardDefault}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>{t('TotalRevenue')}</div>
            <div className={styles.badgeSuccess}>LIVE</div>
          </div>
          <div className={styles.kpiValue}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24}/> : formatCurrency(kpis.totalRevenue)}
          </div>
          <div className={styles.kpiTrend}><TrendingUp size={12}/> Global Ledger Flow</div>
        </div>

        <div className={styles.kpiCardDefault}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>PENDING LIQUIDITY</div>
            <div className={styles.badgeDanger}>{kpis.pendingCount} Priority</div>
          </div>
          <div className={styles.kpiValue}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24}/> : formatCurrency(kpis.totalPending)}
          </div>
          <div className={styles.kpiTrend}>Receivable Exposure</div>
        </div>

        <div className={styles.kpiCardNetProfit}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>NET EARNINGS</div>
            <div className={styles.badgeSolidSuccess}>{kpis.netMargin}% Margin</div>
          </div>
          <div className={styles.kpiValue}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24}/> : formatCurrency(kpis.netProfit)}
          </div>
          <div className={styles.kpiTrend}>Optimal Fiscal Performance</div>
        </div>

        <div className={styles.kpiCardInventory}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>PHYSICAL ASSET VALUE</div>
            {kpis.lowStockCount > 0 && <div className={styles.badgeDanger}>{kpis.lowStockCount} Critical</div>}
          </div>
          <div className={styles.kpiValue}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24}/> : formatCurrency(kpis.totalInventoryValue)}
          </div>
          <div className={styles.kpiTrend}>Warehouse Equity</div>
        </div>

        <div className={styles.kpiCardDefault} style={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel} style={{ color: '#7C3AED' }}>ELECTRONIC DISPATCH</div>
            <div className={styles.badgeSolidSuccess} style={{ backgroundColor: '#8B5CF6' }}>DIGITAL</div>
          </div>
          <div className={styles.kpiValue} style={{ color: '#7C3AED' }}>
            {loading ? <RefreshCw className={styles.spinIcon} size={24}/> : `${kpis.emailSuccessRate}%`}
          </div>
          <div className={styles.kpiTrend} style={{ color: '#8B5CF6' }}>{kpis.emailSucceeded} Invoices Delivered</div>
        </div>
      </div>

      {/* Main Row: Strategic Analytics */}
      <div className={styles.mainRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Fiscal Trajectory</h3>
              <p className={styles.chartSubtitle}>Revenue Growth vs Operational Burn</p>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#279C5A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#279C5A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{stroke: '#279C5A', strokeWidth: 1}} 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px'}} 
                />
                <Area type="monotone" dataKey="Revenue" stroke="#279C5A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Expenses" stroke="#E2E8F0" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartFooter}>
            <p className={styles.chartFooterText}>
              Strategic analysis indicates a <strong>{calculateGrowth()}% MoM</strong> momentum.
            </p>
            <button className={styles.chartFooterLink} onClick={handleExport}>Download Strategic XLSX</button>
          </div>
        </div>

        <div className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <h3 className={styles.chartTitle}>Live Feed</h3>
            <button className={styles.moreBtn}><Activity size={18} /></button>
          </div>
          
          <div className={styles.activityList}>
            {loading ? <div className={styles.activityItem}>Syncing Feed...</div> : (
              recentActivity.length > 0 ? recentActivity.slice(0, 5).map((item) => (
                <div key={item.id} className={styles.activityItem}>
                  <div className={`${styles.iconWrap} ${item.type === 'invoice' ? styles.iconGreen : styles.iconGray}`}>
                    {item.type === 'invoice' ? <ShieldCheck size={18} /> : <Activity size={18} />}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.actTitle}>
                      {item.title}
                      {item.type === 'invoice' && item.emailStatus === 'SENT' && (
                        <Mail size={12} style={{ marginLeft: '8px', color: '#10B981' }} />
                      )}
                      {item.type === 'invoice' && item.emailStatus === 'FAILED' && (
                        <Mail size={12} style={{ marginLeft: '8px', color: '#EF4444' }} />
                      )}
                    </div>
                    <div className={styles.actDesc}>{item.desc}</div>
                    <div className={styles.actTime}>{item.time}</div>
                  </div>
                </div>
              )) : (
                <div className={styles.activityItem}>
                   <div style={{ color: '#64748b', fontSize: '13px' }}>No operational activity detected.</div>
                </div>
              )
            )}
          </div>
          
          <button className={styles.viewAuditBtn} onClick={() => router.push('/terminal')}>Open Global Audit Stream</button>
        </div>
      </div>

      {/* Secondary Row: Inventory & Compliance */}
      <div className={styles.secondaryRow}>
        <div className={styles.inventorySummaryCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
               <UploadCloud size={20} color="#279C5A"/>
               Warehouse Command
            </div>
            <button className={styles.viewAuditBtn} style={{ width: 'auto', marginTop: 0 }} onClick={() => router.push('/inventory')}>View Inventory Hub</button>
          </div>
          
          <div className={styles.productList}>
            {loading ? <div>Scanning Stock...</div> : (
              inventorySummary?.topProducts?.slice(0, 3).map((p: any) => (
                <div key={p.sku} className={styles.productItem}>
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>{p.name} {p.quantity < 10 && <span className={styles.badgeDanger} style={{ marginLeft: '8px' }}>Low</span>}</span>
                    <span className={styles.productSku}>{p.sku}</span>
                  </div>
                  <div className={styles.stockStatus}>
                    <span className={styles.stockQty}>{p.quantity} Units</span>
                  </div>
                </div>
              )) || <div style={{ color: '#64748b', fontSize: '13px' }}>Offline.</div>
            )}
          </div>
        </div>

        <div className={styles.taxSummaryCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
               <ShieldCheck size={20} color="#279C5A"/>
               Compliance Gateway
            </div>
            <div className={styles.badgeSolidSuccess}>FY 2026 ACTIVE</div>
          </div>

          <div className={styles.taxGrid}>
            <div className={styles.taxBox}>
              <div className={styles.taxLabel}>PPN 12% LIABILITY</div>
              <div className={styles.taxValue}>{formatCurrency(taxSummary?.netPayable || kpis.netTaxPayable)}</div>
            </div>
            <div className={styles.taxBox}>
              <div className={styles.taxLabel}>YTD TURNOVER PKP</div>
              <div className={styles.taxValue}>{formatCurrency(taxSummary?.ytdTurnover || 0)}</div>
            </div>
          </div>
          <button className={styles.viewAuditBtn} style={{ marginTop: '20px' }} onClick={() => router.push('/taxation')}>Access Tax Terminal</button>
        </div>
      </div>

      {/* Strategic Ledger Table */}
      <div className={styles.ledgerSection}>
        <div className={styles.ledgerHeader}>
          <h3 className={styles.ledgerTitle}>Recent Strategic Transactions</h3>
          <div className={styles.ledgerActions}>
            <button className={styles.viewAuditBtn} style={{ width: 'auto', marginTop: 0 }} onClick={() => router.push('/accounting/ledger')}>Go to Master Ledger</button>
          </div>
        </div>
        
        <table className={styles.ledgerTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>PARTNER / ENTITY</th>
              <th>CATEGORY</th>
              <th className={styles.textRight}>VALUE</th>
              <th className={styles.textRight}>INTEGRITY</th>
            </tr>
          </thead>
          <tbody>
            {(ledgerData.length > 0 ? ledgerData.slice(0, 5) : []).map((row) => (
              <tr key={row.id}>
                <td className={styles.txnId}>{row.id}</td>
                <td className={styles.entityName}>{row.entity}</td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
