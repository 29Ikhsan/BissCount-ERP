'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Download, Sparkles, FileText, ArrowUpRight, ArrowDownRight, Calendar, GitCompare, Filter, Eye, Edit3, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

// --- Dummy Data ---
const revenueData = [
  { name: 'JAN', Revenue: 3200, Profit: 1200 },
  { name: 'FEB', Revenue: 3700, Profit: 1500 },
  { name: 'MAR', Revenue: 4100, Profit: 1800 },
  { name: 'APR', Revenue: 4900, Profit: 2100 },
  { name: 'MAY', Revenue: 5200, Profit: 2400 },
  { name: 'JUN', Revenue: 6100, Profit: 2800 },
];

const categoryData = [
  { name: 'Subscription SaaS', value: 54, color: '#0F3B8C' },
  { name: 'Direct Services', value: 31, color: '#00B4D8' },
  { name: 'Hardware Sales', value: 15, color: '#D1FAE5' }, 
];

// --- Data Fetchers for Exports & UI ---
const getGlData = () => [
  { id: 'TX-1', Date: '2023-10-01', Code: '1001', Account: 'Cash', Description: 'Initial Balance', Debit: 145000, Credit: 0, Balance: 145000 },
  { id: 'TX-2', Date: '2023-10-05', Code: '1001', Account: 'Cash', Description: 'Client Payment - Inv #001', Debit: 5000, Credit: 0, Balance: 150000 },
  { id: 'TX-3', Date: '2023-10-12', Code: '1001', Account: 'Cash', Description: 'Server Hosting Payment', Debit: 0, Credit: 1200, Balance: 148800 },
];

const getTbData = () => [
  { id: 'A-1001', Code: '1001', Account: 'Cash operating account', Debit: 148800, Credit: 0 },
  { id: 'A-1002', Code: '1002', Account: 'Accounts Receivable', Debit: 42380, Credit: 0 },
  { id: 'A-2001', Code: '2001', Account: 'Accounts Payable', Debit: 0, Credit: 18500 },
  { id: 'A-9999', Code: '', Account: 'TOTAL', Debit: 191180, Credit: 18500 },
];

const getPlData = (periodType: string, compareWith: string) => {
  if (compareWith === 'last_12_months') {
    return [
      { id: 'PL-1', Category: 'REVENUE', Code: '4001', Item: 'Software Subscriptions', 'APR 23': 950000, 'MAY 23': 980000, 'JUN 23': 1020000, 'JUL 23': 1050000, 'AUG 23': 1080000, 'SEP 23': 1100000, 'OCT 23': 1120000, 'NOV 23': 1150000, 'DEC 23': 1180000, 'JAN 24': 1200000, 'FEB 24': 1250000, 'MAR 24': 1284500, TOTAL: 13334500 },
      { id: 'PL-2', Category: 'REVENUE', Code: '4002', Item: 'Consulting Services', 'APR 23': 300000, 'MAY 23': 310000, 'JUN 23': 320000, 'JUL 23': 330000, 'AUG 23': 340000, 'SEP 23': 350000, 'OCT 23': 360000, 'NOV 23': 355000, 'DEC 23': 340000, 'JAN 24': 345000, 'FEB 24': 350000, 'MAR 24': 345000, TOTAL: 4055000 },
      { id: 'PL-3', Category: 'TOTAL', Code: '', Item: 'Total Revenue', 'APR 23': 1250000, 'MAY 23': 1290000, 'JUN 23': 1340000, 'JUL 23': 1380000, 'AUG 23': 1420000, 'SEP 23': 1450000, 'OCT 23': 1480000, 'NOV 23': 1505000, 'DEC 23': 1520000, 'JAN 24': 1545000, 'FEB 24': 1600000, 'MAR 24': 1629500, TOTAL: 17389500 },
    ];
  }
  if (compareWith === 'last_4_quarters') {
    return [
      { id: 'PL-1', Category: 'REVENUE', Code: '4001', Item: 'Software Subscriptions', '2023 Q2': 2950000, '2023 Q3': 3250000, '2023 Q4': 3530000, '2024 Q1': 3834500, TOTAL: 13564500 },
      { id: 'PL-2', Category: 'REVENUE', Code: '4002', Item: 'Consulting Services', '2023 Q2': 930000, '2023 Q3': 1020000, '2023 Q4': 1055000, '2024 Q1': 1040000, TOTAL: 4045000 },
      { id: 'PL-3', Category: 'TOTAL', Code: '', Item: 'Total Revenue', '2023 Q2': 3880000, '2023 Q3': 4270000, '2023 Q4': 4585000, '2024 Q1': 4874500, TOTAL: 17609500 },
    ];
  }
  return [
    { id: 'PL-1', Category: 'REVENUE', Code: '4001', Item: 'Software Subscriptions', CurrentPeriod: 1284500, ComparisonPeriod: 1100000, VariancePct: '+16.7%' },
    { id: 'PL-2', Category: 'REVENUE', Code: '4002', Item: 'Consulting Services', CurrentPeriod: 345000, ComparisonPeriod: 360000, VariancePct: '-4.1%' },
    { id: 'PL-3', Category: '', Code: '', Item: 'Total Revenue', CurrentPeriod: 1629500, ComparisonPeriod: 1460000, VariancePct: '+11.6%' },
    { id: 'PL-4', Category: 'COGS', Code: '5001', Item: 'Server Hosting', CurrentPeriod: -150000, ComparisonPeriod: -130000, VariancePct: '+15.3%' },
    { id: 'PL-5', Category: '', Code: '', Item: 'Gross Profit', CurrentPeriod: 1479500, ComparisonPeriod: 1330000, VariancePct: '+11.2%' },
    { id: 'PL-6', Category: 'OPERATING EXPENSES', Code: '6001', Item: 'Payroll', CurrentPeriod: -600000, ComparisonPeriod: -550000, VariancePct: '+9.0%' },
    { id: 'PL-7', Category: 'NET INCOME', Code: '', Item: 'Net Profit before Tax', CurrentPeriod: 879500, ComparisonPeriod: 780000, VariancePct: '+12.7%' },
  ];
};

const getBsData = (periodType: string, compareWith: string) => [
  { id: 'BS-1', Category: 'ASSETS', Code: '1001', Item: 'Cash Equivalents', CurrentBalance: 148800, ComparisonBalance: 125000 },
  { id: 'BS-2', Category: 'ASSETS', Code: '1002', Item: 'Accounts Receivable', CurrentBalance: 42380, ComparisonBalance: 50000 },
  { id: 'BS-3', Category: 'ASSETS', Code: '1501', Item: 'Equipment (Net)', CurrentBalance: 250000, ComparisonBalance: 280000 },
  { id: 'BS-4', Category: '', Code: '', Item: 'Total Assets', CurrentBalance: 441180, ComparisonBalance: 455000 },
  { id: 'BS-5', Category: 'LIABILITIES', Code: '2001', Item: 'Accounts Payable', CurrentBalance: 18500, ComparisonBalance: 22000 },
  { id: 'BS-6', Category: 'EQUITY', Code: '3001', Item: 'Owner Equity', CurrentBalance: 200000, ComparisonBalance: 200000 },
  { id: 'BS-7', Category: 'EQUITY', Code: '3002', Item: 'Retained Earnings', CurrentBalance: 222680, ComparisonBalance: 233000 },
  { id: 'BS-8', Category: '', Code: '', Item: 'Total Liabilities & Equity', CurrentBalance: 441180, ComparisonBalance: 455000 },
];

const getCfData = (periodType: string, compareWith: string) => [
  { id: 'CF-1', Flow: 'OPERATING ACTIVITIES', Code: '3003', Item: 'Net Income', CurrentPeriod: 879500, ComparisonPeriod: 780000 },
  { id: 'CF-2', Flow: 'OPERATING ACTIVITIES', Code: '6501', Item: 'Depreciation Add-back', CurrentPeriod: 45000, ComparisonPeriod: 45000 },
  { id: 'CF-3', Flow: '', Code: '', Item: 'Net Cash from Operations', CurrentPeriod: 924500, ComparisonPeriod: 825000 },
  { id: 'CF-4', Flow: 'INVESTING ACTIVITIES', Code: '1501', Item: 'Purchase of Equipment', CurrentPeriod: -120000, ComparisonPeriod: -50000 },
  { id: 'CF-5', Flow: 'NET CHANGE IN CASH', Code: '', Item: 'Total Cash Flow', CurrentPeriod: 804500, ComparisonPeriod: 775000 },
];

export default function Dashboard() {
  const { t, formatCurrency, locale } = useLanguage();
  const [periodType, setPeriodType] = useState('monthly');
  const [compareWith, setCompareWith] = useState('prev_year');
  const [reportType, setReportType] = useState('pl');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-03-31');
  
  // Interactive View State
  const [viewData, setViewData] = useState<any[] | null>(null);
  const [activeViewType, setActiveViewType] = useState<string>('');
  const [activeEditRow, setActiveEditRow] = useState<any | null>(null);
  const [drilldownCoa, setDrilldownCoa] = useState<string | null>(null);
  const [selectedCoa, setSelectedCoa] = useState<string>('all');

  const [apiReports, setApiReports] = useState<any>(null);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState('all');
  const [kpis, setKpis] = useState<any>({ revenue: 0, profitMargin: '0%', opex: 0 });

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
        costCenterId: selectedCostCenter,
        startDate,
        endDate
      });
      const [repRes, ccRes] = await Promise.all([
        fetch(`/api/reports?${params.toString()}`),
        fetch('/api/cost-centers')
      ]);
      const data = await repRes.json();
      const ccData = await ccRes.json();
      
      if (data.reports) setApiReports(data.reports);
      if (data.kpis) setKpis(data.kpis);
      if (ccData.costCenters) setCostCenters(ccData.costCenters);
    } catch (err) {
      console.error('Failed to fetch API Financial Reports', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedCostCenter, startDate, endDate]);

  const getDrilldownData = (coa: string) => {
    if (!apiReports) return []
    return apiReports.gl.filter((line: any) => line.Account === coa || line.Code === coa)
  };

  const handleCoaClick = (row: any, key: string, value: any) => {
    if (reportType === 'gl') {
      setActiveEditRow(row);
    } else {
      setDrilldownCoa(String(value));
    }
  };

  const handleViewReport = () => {
    setActiveViewType(reportType);
    if (!apiReports) {
      alert("Loading reports, please wait...")
      return
    }
    
    let baseData: any[] = [];
    switch(reportType) {
      case 'gl': baseData = apiReports.gl; break;
      case 'tb': baseData = apiReports.tb; break;
      case 'pl': baseData = apiReports.pl; break;
      case 'bs': baseData = apiReports.bs; break;
      case 'cf': baseData = apiReports.cf; break;
    }

    if (reportType === 'gl' && selectedCoa !== 'all') {
       baseData = baseData.filter((item: any) => item.Code === selectedCoa);
    }

    setViewData(baseData);
  };

  const getFileName = (base: string) => `Bizzcount_${base}_${new Date().toISOString().split('T')[0]}.xlsx`;

  const downloadReport = () => {
    if (!apiReports) {
      alert("Reports not loaded yet.");
      return;
    }
    
    let rawData: any[] = [];
    let name = '';
    switch(reportType) {
      case 'gl': rawData = apiReports.gl; name = "General_Ledger"; break;
      case 'tb': rawData = apiReports.tb; name = "Trial_Balance"; break;
      case 'pl': rawData = apiReports.pl; name = "Profit_And_Loss"; break;
      case 'bs': rawData = apiReports.bs; name = "Balance_Sheet"; break;
      case 'cf': rawData = apiReports.cf; name = "Cash_Flow"; break;
    }
    
    if (reportType === 'gl' && selectedCoa !== 'all') {
       rawData = rawData.filter((item: any) => item.Code === selectedCoa);
    }

    if (!rawData || rawData.length === 0) {
      alert("No data available for this report and filter.");
      return;
    }

    // Strip "id" before exporting
    const cleanData = rawData.map(({id, ...rest}) => rest);
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name.replace(/_/g, " "));
    XLSX.writeFile(wb, getFileName(name));
  };


  const startEdit = (row: any) => {
    setActiveEditRow(row);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumbs}>{t('Analytics').toUpperCase()} &gt; <span className={styles.activeBreadcrumb}>{t('Reports').toUpperCase()}</span></div>
          <h1 className={styles.pageTitle}>{t('FinancialReports')}</h1>
          <p className={styles.pageSubtitle}>{t('ReportSubtitle')}</p>
        </div>
      </div>

      {/* Report Builder Controls */}
      <div className={styles.controlsCard}>
        <div className={styles.controlsGrid}>
           <div className={styles.controlGroup}>
             <label className={styles.controlLabel}><Calendar size={14} /> QUERY PERIOD</label>
             <select 
               className={styles.customSelect} 
               value={periodType} 
               onChange={(e) => setPeriodType(e.target.value)}
             >
               <option value="monthly">Monthly (Current Month)</option>
               <option value="quarterly">Quarterly (Current Q3)</option>
               <option value="yearly">Yearly (Fiscal Year 2023)</option>
               <option value="custom">Custom Date Range...</option>
             </select>
           </div>

           {periodType === 'custom' && (
             <>
               <div className={styles.controlGroup}>
                 <label className={styles.controlLabel}><Calendar size={14} /> START DATE</label>
                 <input 
                   type="date" 
                   className={styles.customSelect} 
                   value={startDate} 
                   onChange={(e) => setStartDate(e.target.value)} 
                 />
               </div>
               <div className={styles.controlGroup}>
                 <label className={styles.controlLabel}><Calendar size={14} /> END DATE</label>
                 <input 
                   type="date" 
                   className={styles.customSelect} 
                   value={endDate} 
                   onChange={(e) => setEndDate(e.target.value)} 
                 />
               </div>
             </>
           )}
           
           <div className={styles.controlGroup}>
             <label className={styles.controlLabel}><GitCompare size={14} /> COMPARE CONFIGURATION</label>
             <select 
               className={styles.customSelect} 
               value={compareWith} 
               onChange={(e) => setCompareWith(e.target.value)}
             >
               <option value="none">No Comparison (Standard)</option>
               <option value="prev_month">Previous Month (MoM Variance)</option>
               <option value="prev_quarter">Previous Quarter (QoQ Variance)</option>
               <option value="prev_year">Previous Year (YoY Variance)</option>
               {periodType === 'monthly' && (
                  <option value="last_12_months">Full Year Analysis (Last 12 Months)</option>
               )}
               {periodType === 'quarterly' && (
                  <option value="last_4_quarters">Annual Analysis (Last 4 Quarters)</option>
               )}
             </select>
           </div>

           <div className={styles.controlGroup}>
             <label className={styles.controlLabel}><Filter size={14} /> DIMENSIONAL TAGGING</label>
             <select 
               className={styles.customSelect} 
               value={selectedCostCenter} 
               onChange={(e) => setSelectedCostCenter(e.target.value)}
             >
               <option value="all">Consolidated (All Branches/Projects)</option>
               {costCenters.map(cc => (
                 <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
               ))}
             </select>
           </div>

           <div className={styles.controlGroup}>
             <label className={styles.controlLabel}><Filter size={14} /> STATEMENT SELECTION</label>
             <div className={styles.actionRowFull}>
               <select 
                 className={styles.customSelect} 
                 value={reportType} 
                 onChange={(e) => setReportType(e.target.value)}
                 style={{ flex: 1 }}
               >
                 <option value="gl">General Ledger (Transaction Level)</option>
                 <option value="tb">Trial Balance</option>
                 <option value="pl">Profit & Loss (Income Statement)</option>
                 <option value="bs">Balance Sheet</option>
                 <option value="cf">Cash Flow (Indirect)</option>
               </select>

               {reportType === 'gl' && apiReports?.gl && (
                 <select 
                   className={styles.customSelect}
                   value={selectedCoa}
                   onChange={(e) => setSelectedCoa(e.target.value)}
                   style={{ flex: 0.5, backgroundColor: '#f0fdf4', borderColor: '#279C5A' }}
                 >
                   <option value="all">All Accounts (Full GL)</option>
                   {Array.from(new Set(apiReports.gl.map((item: any) => `${item.Code} - ${item.Account}`))).map((accStr: any) => (
                     <option key={accStr} value={accStr.split(' - ')[0]}>{accStr}</option>
                   ))}
                 </select>
               )}

               <button className={styles.btnOutline} onClick={handleViewReport}>
                 <Eye size={16} /> View
               </button>
               <button className={styles.btnPrimary} onClick={downloadReport}>
                 <Download size={16} /> Export
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* Interactive Report View */}
      {viewData && viewData.length > 0 && (
        <div className={styles.reportViewerCard}>
          <div className={styles.viewerHeader}>
            <h3 className={styles.viewerTitle}>
              Interactive View: {reportType === 'gl' ? 'General Ledger' : reportType === 'tb' ? 'Trial Balance' : reportType === 'pl' ? 'Profit & Loss' : reportType === 'bs' ? 'Balance Sheet' : 'Cash Flow'}
            </h3>
            <button className={styles.iconBtn} onClick={() => setViewData(null)}>
              <X size={20} />
            </button>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.viewerTable}>
              <thead>
                <tr>
                  {Object.keys(viewData[0]).filter(k => k !== 'id').map((key) => (
                    <th key={key}>{key.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewData.map((row, idx) => (
                  <tr key={row.id || idx}>
                    {Object.entries(row).filter(([k]) => k !== 'id').map(([key, value]) => (
                      <td key={key} className={typeof value === 'number' ? styles.tdNumber : ''}>
                        {['Account', 'Item'].includes(key) && value ? (
                          <span 
                            className={styles.clickableCoa}
                            onClick={() => handleCoaClick(row, key, value)}
                          >
                            {String(value)}
                          </span>
                        ) : (
                          typeof value === 'number' ? formatCurrency(value) : (value as string)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>TOTAL REVENUE QTD</div>
          <div className={styles.kpiValue}>{formatCurrency(kpis.revenue)}</div>
          <div className={`${styles.kpiTrend} ${styles.positive}`}>
            <ArrowUpRight size={14} /> +12.4% vs Prior Qtr
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>NET PROFIT MARGIN</div>
          <div className={styles.kpiValue}>{kpis.profitMargin}</div>
          <div className={`${styles.kpiTrend} ${styles.positive}`}>
            <ArrowUpRight size={14} /> +2.1% vs Prior Qtr
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>OPERATING EXPENSES</div>
          <div className={styles.kpiValue}>{formatCurrency(kpis.opex)}</div>
          <div className={`${styles.kpiTrend} ${styles.negative}`}>
            <ArrowDownRight size={14} /> -4.8% vs Prior Qtr
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>TAX LIABILITY EST.</div>
          <div className={styles.kpiValue}>{formatCurrency(Math.floor((kpis.revenue - kpis.opex) * 0.2))}</div>
          <div className={`${styles.kpiTrend} ${styles.neutral}`}>
            — Steady vs Prior Qtr
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        <div className={styles.mainChart}>
          <div className={styles.chartHeader}>
            <div>
               <h3 className={styles.chartTitle}>Revenue vs. Net Profit (YoY Trend)</h3>
               <p className={styles.chartSubtitle}>Comparison of gross inflows vs actual bottom line over 6 months.</p>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#F1F3F5'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', top: -40, right: 0}} />
                <Bar dataKey="Revenue" fill="#0F3B8C" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="Profit" fill="#00B4D8" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.sideChart}>
          <h3 className={styles.chartTitle}>Revenue by Category</h3>
          <div className={styles.donutContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className={styles.donutLabelTop}>OVERALL</text>
                <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className={styles.donutLabelBottom}>100%</text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Edit Modal (Mock) */}
      {activeEditRow && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Transaction / Record</h3>
              <button className={styles.iconBtn} onClick={() => setActiveEditRow(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.helpText}>Adjusting explicit entries below might require administrative approval based on your audit settings.</p>
              
              <div className={styles.formGrid}>
                {Object.entries(activeEditRow).filter(([k]) => k !== 'id').map(([key, value]) => (
                  <div key={key} className={styles.formGroup}>
                    <label className={styles.formLabel}>{key}</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      defaultValue={typeof value === 'number' ? value : String(value)} 
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
               <button className={styles.btnOutline} onClick={() => setActiveEditRow(null)}>Cancel</button>
               <button className={styles.btnPrimary} onClick={() => setActiveEditRow(null)}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Drilldown Modal */}
      {drilldownCoa && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '800px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ledger Details: {drilldownCoa}</h3>
              <button className={styles.iconBtn} onClick={() => setDrilldownCoa(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.tableWrapper}>
                <table className={styles.viewerTable}>
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>DESCRIPTION</th>
                      <th style={{ textAlign: 'right' }}>DEBIT</th>
                      <th style={{ textAlign: 'right' }}>CREDIT</th>
                      <th style={{ textAlign: 'right' }}>BALANCE</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDrilldownData(drilldownCoa).map((tx: any) => (
                      <tr key={tx.id}>
                        <td>{tx.Date}</td>
                        <td>{tx.Description}</td>
                        <td className={styles.tdNumber} style={{ textAlign: 'right' }}>{tx.Debit > 0 ? formatCurrency(tx.Debit) : '-'}</td>
                        <td className={styles.tdNumber} style={{ textAlign: 'right' }}>{tx.Credit > 0 ? formatCurrency(tx.Credit) : '-'}</td>
                        <td className={styles.tdNumber} style={{ textAlign: 'right' }}>{formatCurrency(tx.Balance)}</td>
                        <td style={{ textAlign: 'center' }}>
                           <button 
                             className={styles.editBtn} 
                             onClick={() => {
                               setDrilldownCoa(null);
                               setActiveEditRow(tx);
                             }}
                           >
                              <Edit3 size={14} /> Edit
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.modalFooter}>
               <button className={styles.btnOutline} onClick={() => setDrilldownCoa(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
