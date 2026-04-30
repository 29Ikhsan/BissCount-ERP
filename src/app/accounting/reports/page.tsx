'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import styles from './page.module.css';
import { 
  PieChart, 
  DownloadCloud,
  Layers,
  Filter,
  Tag,
  X,
  Plus,
  ChevronDown,
  BarChart2,
  TrendingUp
} from 'lucide-react';
import { exportToPDF, exportToExcel, flattenReportData } from '../../../lib/exportUtils';

type ReportTab = 'bs' | 'pl' | 'cf';
type RangeType = 'month' | 'quarter' | 'year' | 'custom';

export default function AccountingReports() {
  const { formatCurrency, t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>('bs');
  
  // Tags / Projects
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);

  // Filtering & Time
  const [rangeType, setRangeType] = useState<RangeType>('month');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [comparisonCount, setComparisonCount] = useState(0); 
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchTags = async () => {
    const res = await fetch('/api/accounting/tags');
    if (res.ok) {
      setAvailableTags(await res.json());
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    let periodVal = selectedPeriod;
    if (rangeType === 'year') periodVal = `${selectedYear}-01`;
    if (rangeType === 'quarter') periodVal = `${selectedYear}-Q${selectedQuarter}`;
    
    // Construct Tag Query
    const tagQuery = selectedTags.length > 0 ? `&tagIds=${selectedTags.map(t => t.id).join(',')}` : '';
    
    let url = `/api/accounting/reports?type=${rangeType}&period=${periodVal}&comparisonCount=${comparisonCount}${tagQuery}`;
    if (rangeType === 'custom') {
        url = `/api/accounting/reports?type=custom&startDate=${customStart}&endDate=${customEnd}${tagQuery}`;
    }

    try {
      const res = await fetch(url);
      const d = await res.json();
      if (res.ok) {
        setData(d);
      }
    } catch (err) {
      console.error('Reports Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (rangeType === 'custom' && (!customStart || !customEnd)) return;
    fetchReports();
  }, [rangeType, selectedPeriod, selectedYear, selectedQuarter, comparisonCount, customStart, customEnd, selectedTags]);

  const toggleTag = (tag: any) => {
    const exists = selectedTags.find(t => t.id === tag.id);
    if (exists) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      if (selectedTags.length >= 10) {
        alert("Maximum 10 tags can be selected for reporting.");
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleExportPDF = () => {
     if (!mainPeriod) return;
     const reportTitle = activeTab === 'bs' ? 'Balance Sheet' : activeTab === 'pl' ? 'Profit & Loss' : 'Cash Flow (Indirect)';
     const flattened = flattenReportData(data.periods, activeTab);
     exportToPDF(reportTitle, `Financial Report: ${reportTitle}`, flattened);
  };

  const handleExportExcel = () => {
     if (!data) return;
     const allSheets = [
       { name: 'Balance Sheet', data: flattenReportData(data.periods, 'bs') },
       { name: 'Profit & Loss', data: flattenReportData(data.periods, 'pl') },
       { name: 'Cash Flow', data: flattenReportData(data.periods, 'cf') }
     ];
     exportToExcel('Financial_Statements_Bizzcount', allSheets);
  };

  if (loading && !data) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing Financial Intelligence...</p>
    </div>
  );

  const mainPeriod = data?.periods?.[0]; 
  const comparatives = data?.periods?.slice(1); 
  const comparisonLabel = rangeType === 'year' ? 'Tahun Sebelumnya' : rangeType === 'quarter' ? 'Kuartal Sebelumnya' : 'Bulan Sebelumnya';

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <PieChart size={28} color="#279C5A"/>
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Financial Intelligence</h1>
            <p className={styles.subtitle}>
              {selectedTags.length > 0 
                ? `Filtered by: ${selectedTags.map(t => t.name).join(', ')}` 
                : 'Consolidated Balance Sheet, P&L, and Cash Flow Statement.'}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.filterBar}>
              <div className={styles.selectGroup}>
                <Filter size={14} className={styles.selectIcon}/>
                <select 
                   className={styles.selectInput}
                   value={rangeType}
                   onChange={(e) => setRangeType(e.target.value as RangeType)}
                >
                    <option value="month">Bulanan</option>
                    <option value="quarter">Kuartal</option>
                    <option value="year">Tahunan</option>
                    <option value="custom">Custom</option>
                </select>
              </div>

              <div className={styles.vDivider}></div>

              {rangeType === 'month' && (
                <input type="month" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className={styles.dateInput} />
              )}
              {rangeType === 'year' && (
                <select className={styles.dateInput} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                   {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              )}
              {rangeType === 'quarter' && (
                <div style={{ display: 'flex', gap: '4px' }}>
                   <select className={styles.dateInput} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                   <select className={styles.dateInput} value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))}>
                      {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                   </select>
                </div>
              )}
              {rangeType === 'custom' && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                   <input type="date" className={styles.dateInput} value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                   <input type="date" className={styles.dateInput} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </div>
              )}

              <div className={styles.vDivider}></div>

              <div className={styles.tagSelectorWrapper}>
                 <button className={selectedTags.length > 0 ? styles.tagBtnActive : styles.tagBtn} onClick={() => setShowTagMenu(!showTagMenu)}>
                    <Tag size={14} /> {selectedTags.length > 0 ? `${selectedTags.length} Tags` : 'Filter Tags'}
                 </button>
                 {showTagMenu && (
                    <div className={styles.tagMenu}>
                       <div className={styles.tagMenuHeader}>
                          <span>Select Tags</span>
                          <button onClick={() => setShowTagMenu(false)} style={{background: 'none', border:'none'}}><X size={14} /></button>
                       </div>
                       <div className={styles.tagList}>
                          {availableTags.map(tag => (
                            <label key={tag.id} className={styles.tagOption}>
                               <input 
                                  type="checkbox" 
                                  checked={selectedTags.some(t => t.id === tag.id)}
                                  onChange={() => toggleTag(tag)}
                               />
                               <span>{tag.name}</span>
                            </label>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              <div className={styles.vDivider}></div>

              <select 
                className={styles.selectInput}
                value={comparisonCount}
                onChange={(e) => setComparisonCount(Number(e.target.value))}
                disabled={rangeType === 'custom'}
              >
                  <option value={0}>No comparison</option>
                  {[1, 2, 3].map((i) => (
                    <option key={i} value={i}>{i} {comparisonLabel}</option>
                  ))}
              </select>
           </div>
           
           <div className={styles.exportGroup}>
             <button className={styles.btnSecondary} onClick={handleExportPDF}>
                <DownloadCloud size={16} color="#475569"/> Export PDF
             </button>
             <button className={styles.btnSecondary} onClick={handleExportExcel}>
                <Layers size={16} color="#475569"/> Export Excel
             </button>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
         <button className={activeTab === 'bs' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('bs')}>
            Balance Sheet
         </button>
         <button className={activeTab === 'pl' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('pl')}>
            Profit & Loss
         </button>
         <button className={activeTab === 'cf' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('cf')}>
            Cash Flow
         </button>
      </div>

      {/* Report Container */}
      <div className={styles.reportPanel}>
         {activeTab === 'bs' && (
           <div className={styles.statement}>
              <h2 className={styles.statementTitle}>Consolidated Balance Sheet</h2>
              <table className={styles.reportTable}>
                 <thead>
                    <tr>
                       <th>ITEMS & CLASSIFICATION</th>
                       <th className={styles.numeric}>{mainPeriod?.label}</th>
                       {comparatives?.map((p: any) => (
                         <th key={p.label} className={styles.numericMuted}>{p.label}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody>
                    <tr className={styles.groupHeader}><td colSpan={10}>ASET (ASSETS)</td></tr>
                    <tr><td>Cash & Equivalents</td><td className={styles.numeric}>{formatCurrency(mainPeriod?.bs.assets.cash)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.bs.assets.cash)}</td>)}</tr>
                    <tr><td>Accounts Receivable</td><td className={styles.numeric}>{formatCurrency(mainPeriod?.bs.assets.ar)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.bs.assets.ar)}</td>)}</tr>
                    <tr><td>Inventory Valuation</td><td className={styles.numeric}>{formatCurrency(mainPeriod?.bs.assets.inventory)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.bs.assets.inventory)}</td>)}</tr>
                    <tr className={styles.totalRow}><td>TOTAL ASSETS</td><td className={styles.numericBold}>{formatCurrency(mainPeriod?.bs.assets.total)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.bs.assets.total)}</td>)}</tr>
                    
                    <tr className={styles.groupHeader}><td colSpan={10}>KEWAJIBAN & EKUITAS (LIABILITIES & EQUITY)</td></tr>
                    <tr><td>Accounts Payable</td><td className={styles.numeric}>{formatCurrency(mainPeriod?.bs.liabilities.ap)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.bs.liabilities.ap)}</td>)}</tr>
                    <tr><td>Short-term Debt</td><td className={styles.numeric}>{formatCurrency(mainPeriod?.bs.liabilities.debt)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.bs.liabilities.debt)}</td>)}</tr>
                    <tr className={styles.totalRow}><td>TOTAL LIABILITIES & EQUITY</td><td className={styles.numericBold}>{formatCurrency(mainPeriod?.bs.assets.total)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.bs.assets.total)}</td>)}</tr>
                 </tbody>
              </table>
           </div>
         )}

         {activeTab === 'pl' && (
           <div className={styles.statement}>
              <h2 className={styles.statementTitle}>Income Statement (P&L)</h2>
              <table className={styles.reportTable}>
                 <thead>
                    <tr>
                       <th>CATEGORY</th>
                       <th className={styles.numeric}>{mainPeriod?.label}</th>
                       {comparatives?.map((p: any) => (
                         <th key={p.label} className={styles.numericMuted}>{p.label}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody>
                    <tr><td>Operating Revenue</td><td className={styles.numeric}>{formatCurrency(mainPeriod?.pl.revenue)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.pl.revenue)}</td>)}</tr>
                    <tr><td>Cost of Goods Sold (COGS)</td><td className={styles.numericRed}>- {formatCurrency(mainPeriod?.pl.cogs)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>- {formatCurrency(p.pl.cogs)}</td>)}</tr>
                    <tr><td>Gross Profit</td><td className={styles.numericBold}>{formatCurrency(mainPeriod?.pl.revenue - mainPeriod?.pl.cogs)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.pl.revenue - p.pl.cogs)}</td>)}</tr>
                    <tr className={styles.groupHeader}><td colSpan={10}>OPERATING EXPENSES</td></tr>
                    <tr><td>General & Administrative</td><td className={styles.numericRed}>- {formatCurrency(mainPeriod?.pl.expenses)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>- {formatCurrency(p.pl.expenses)}</td>)}</tr>
                    <tr className={styles.totalRow}><td>NET INCOME</td><td className={styles.numericGreen}>{formatCurrency(mainPeriod?.pl.netProfit)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.pl.netProfit)}</td>)}</tr>
                 </tbody>
              </table>
           </div>
         )}

         {activeTab === 'cf' && (
           <div className={styles.statement}>
              <h2 className={styles.statementTitle}>Cash Flow (Indirect Method)</h2>
              <table className={styles.reportTable}>
                 <thead>
                    <tr>
                       <th>ACTIVITIES</th>
                       <th className={styles.numeric}>{mainPeriod?.label}</th>
                       {comparatives?.map((p: any) => (
                         <th key={p.label} className={styles.numericMuted}>{p.label}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody>
                    <tr className={styles.groupHeader}><td colSpan={10}>OPERATING ACTIVITIES</td></tr>
                    <tr><td>Net Profit / Income</td><td className={styles.numeric}>{formatCurrency(mainPeriod?.cf.operating.netIncome)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.cf.operating.netIncome)}</td>)}</tr>
                    <tr><td>Change in Accounts Receivable</td><td className={styles.numeric}>{formatCurrency(mainPeriod?.cf.operating.changeInAR)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.cf.operating.changeInAR)}</td>)}</tr>
                    <tr><td>Change in Inventory</td><td className={styles.numeric}>{formatCurrency(mainPeriod?.cf.operating.changeInInv)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.cf.operating.changeInInv)}</td>)}</tr>
                    <tr className={styles.totalRow}><td>Net Cash from Operating</td><td className={styles.numericBold}>{formatCurrency(mainPeriod?.cf.operating.netCashOperating)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.cf.operating.netCashOperating)}</td>)}</tr>
                    <tr className={styles.finalRow}><td>NET INCREASE/DECREASE IN CASH</td><td className={styles.numericGreen}>{formatCurrency(mainPeriod?.cf.netCashChange)}</td>{comparatives?.map((p:any) => <td key={p.label} className={styles.numericMuted}>{formatCurrency(p.cf.netCashChange)}</td>)}</tr>
                 </tbody>
              </table>
           </div>
         )}
      </div>
    </div>
  );
}
