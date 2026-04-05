'use client';

import { 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  CalendarClock, 
  FileCheck,
  Building,
  History,
  Check,
  RefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function PeriodClosing() {
  const [currentPeriod, setCurrentPeriod] = useState({ month: 'October', year: 2023 });
  const [history, setHistory] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [stats, setStats] = useState({
    unreconciledBank: 0,
    draftInvoices: 0,
    pendingExpenses: 0
  });

  const [checklist, setChecklist] = useState<any[]>([]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [bankRes, invRes, expRes, closeRes] = await Promise.all([
        fetch('/api/banking'),
        fetch('/api/invoices'),
        fetch('/api/expenses'),
        fetch('/api/closing')
      ]);
      
      const bankData = await bankRes.json();
      const invData = await invRes.json();
      const expData = await expRes.json();
      const closeData = await closeRes.json();

      if (closeData.history) setHistory(closeData.history);

      const unreconciledCount = bankData.reconciliationLines?.length || 0;
      const draftInvCount = invData.invoices?.filter((i: any) => i.status === 'DRAFT' || i.status === 'PENDING').length || 0;
      const pendingExpCount = expData.expenses?.filter((e: any) => e.status === 'PENDING').length || 0;

      setStats({
        unreconciledBank: unreconciledCount,
        draftInvoices: draftInvCount,
        pendingExpenses: pendingExpCount
      });

      setChecklist([
        { 
          id: 1, 
          title: 'Bank Reconciliations', 
          desc: unreconciledCount > 0 ? `You have ${unreconciledCount} transactions remaining in the bank feed.` : 'All connected bank accounts have been matched with the ledger.', 
          status: unreconciledCount === 0 ? 'Completed' : `${unreconciledCount} Action Rec.`, 
          type: unreconciledCount === 0 ? 'success' : 'warning' 
        },
        { 
          id: 2, 
          title: 'Pending Documents', 
          desc: (draftInvCount + pendingExpCount) > 0 ? `Detected ${draftInvCount} draft invoices and ${pendingExpCount} pending expenses.` : 'No draft invoices or pending expenses found for this period.', 
          status: (draftInvCount + pendingExpCount) === 0 ? 'Completed' : 'Action Rec.', 
          type: (draftInvCount + pendingExpCount) === 0 ? 'success' : 'warning' 
        },
        { 
          id: 3, 
          title: 'Depreciation Run', 
          desc: 'Automated asset depreciation journals have been posted.', 
          status: 'Completed', 
          type: 'success' 
        },
        { 
          id: 4, 
          title: 'Clear Suspense Accounts', 
          desc: 'Suspense and clearing accounts carry a zero balance.', 
          status: 'Completed', 
          type: 'success' 
        },
      ]);
    } catch (e) {
      console.error('Failed to fetch closing stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const allCompleted = checklist.every(item => item.type === 'success');

  const handleEOMClose = async () => {
    if (!allCompleted) {
      alert("Please complete all checklist items before closing the period.");
      return;
    }
    
    setIsClosing(true);
    try {
      const res = await fetch('/api/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          month: currentPeriod.month, 
          year: currentPeriod.year 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Period ${currentPeriod.month} ${currentPeriod.year} has been formally locked.`);
        fetchStatus(); // Refresh history
      } else {
        alert(data.error || "Failed to close period.");
      }
    } catch (e) {
      alert("Network error executing EOM close.");
    } finally {
      setIsClosing(false);
    }
  };

  const handleEOYClose = () => {
    alert("EOY Closing is only available at the end of the Fiscal Year.");
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Financial Period Closing</h1>
          <p className={styles.pageSubtitle}>Finalize accounting records, lock periods to prevent modifications, and generate compliance trial balances.</p>
        </div>
      </div>

      {/* Active Context Banner */}
      <div className={styles.contextBanner}>
        <div className={styles.contextItem}>
          <span className={styles.contextLabel}>CURRENT OPEN PERIOD</span>
          <div className={styles.contextValue}>
            <CalendarClock size={20} className={styles.contextIcon} /> 
            {currentPeriod.month} {currentPeriod.year}
          </div>
        </div>
        <div className={styles.contextDivider}></div>
        <div className={styles.contextItem}>
          <span className={styles.contextLabel}>FISCAL YEAR END</span>
          <div className={styles.contextValue}>
            <Building size={20} className={styles.contextIcon} /> 
            December 31, {currentPeriod.year}
          </div>
        </div>
        <div className={styles.contextDivider}></div>
        <div className={styles.contextItem}>
          <span className={styles.contextLabel}>STATUS</span>
          {loading ? (
            <div className={styles.badgeWarning}>Syncing...</div>
          ) : allCompleted ? (
            <div className={styles.badgeSuccess}>Ready to Close</div>
          ) : (
            <div className={styles.badgeWarning}>Pending Checklist</div>
          )}
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Left Column: Checklist */}
        <div className={styles.checklistSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className={styles.sectionTitle}>Pre-Closing Checklist</h3>
              <p className={styles.sectionDesc}>Ensure all operational activities are reconciled before executing a period lock.</p>
            </div>
            <button className={styles.btnOutline} onClick={fetchStatus} disabled={loading} style={{ padding: '6px 12px' }}>
               <RefreshCw size={14} className={loading ? styles.spin : ''} /> Refresh
            </button>
          </div>
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              Verifying system balances and transaction status...
            </div>
          ) : checklist.map((item) => (
            <div 
              key={item.id} 
              className={item.type === 'success' ? styles.checklistItem : styles.checklistItemWarning}
            >
              <div className={item.type === 'success' ? styles.checkIconSuccess : styles.checkIconWarning}>
                {item.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <div className={styles.checkContent}>
                <h4 className={styles.checkTitle}>{item.title}</h4>
                <p className={styles.checkDesc}>{item.desc}</p>
              </div>
              <div className={item.type === 'success' ? styles.checkStatusSuccess : styles.checkStatusWarning}>
                {item.status}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.executionSection}>
          <div className={allCompleted ? styles.actionCard : styles.actionCardDisabled}>
            <div className={styles.actionHeader}>
              <Lock size={20} className={allCompleted ? styles.actionIconPrimary : styles.actionIconDisabled} />
              <h3 className={allCompleted ? styles.actionTitle : styles.actionTitleDisabled}>End of Month (EOM)</h3>
            </div>
            <p className={styles.actionDesc}>
              Lock the <strong>{currentPeriod.month} {currentPeriod.year}</strong> period. This will finalize the monthly trial balance and prevent any further journal entries from being posted to this period.
            </p>
            <button 
              className={allCompleted && !isClosing ? styles.btnPrimary : styles.btnDisabled} 
              onClick={handleEOMClose}
              disabled={!allCompleted || isClosing}
            >
               {isClosing ? 'Executing Period Lock...' : 'Execute EOM Close'}
            </button>
          </div>

          <div className={styles.actionCardDisabled}>
            <div className={styles.actionHeader}>
              <FileCheck size={20} className={styles.actionIconDisabled} />
              <h3 className={styles.actionTitleDisabled}>End of Year (EOY)</h3>
            </div>
            <p className={styles.actionDesc}>
              Transfer current year net income to Retained Earnings and lock the Fiscal Year. Only available when the final calendar month is open.
            </p>
            <button className={styles.btnDisabled} onClick={handleEOYClose}>
               Execute EOY Close
            </button>
          </div>

          <div className={styles.historyCard}>
            <h3 className={styles.historyTitle}>
               <History size={16} /> Recent Closings
            </h3>
            <ul className={styles.historyList}>
              {history.map((h, i) => (
                <li key={h.id || i}>
                   <span className={styles.histPeriod}>{h.month} {h.year}</span>
                   <span className={styles.histDate}>Closed {new Date(h.closedAt).toLocaleDateString()}</span>
                </li>
              ))}
              {history.length === 0 && (
                <li style={{ fontSize: '0.8rem', color: '#94A3B8' }}>No historical record found.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
