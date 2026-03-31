'use client';

import { 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  CalendarClock, 
  FileCheck,
  Building,
  History
} from 'lucide-react';
import styles from './page.module.css';

export default function PeriodClosing() {
  const handleEOMClose = () => {
    alert("Initiating End of Month (EOM) Closing for October 2023.\nThis will lock all journal entries for this period.");
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
            October 2023
          </div>
        </div>
        <div className={styles.contextDivider}></div>
        <div className={styles.contextItem}>
          <span className={styles.contextLabel}>FISCAL YEAR END</span>
          <div className={styles.contextValue}>
            <Building size={20} className={styles.contextIcon} /> 
            December 31, 2023
          </div>
        </div>
        <div className={styles.contextDivider}></div>
        <div className={styles.contextItem}>
          <span className={styles.contextLabel}>STATUS</span>
          <div className={styles.badgeWarning}>Pending Checklist</div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Left Column: Checklist */}
        <div className={styles.checklistSection}>
          <h3 className={styles.sectionTitle}>Pre-Closing Checklist</h3>
          <p className={styles.sectionDesc}>Ensure all operational activities are reconciled before executing a period lock.</p>
          
          <div className={styles.checklistItem}>
            <div className={styles.checkIconSuccess}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.checkContent}>
              <h4 className={styles.checkTitle}>Bank Reconciliations</h4>
              <p className={styles.checkDesc}>All connected bank accounts have been matched with the ledger.</p>
            </div>
            <div className={styles.checkStatusSuccess}>Completed</div>
          </div>

          <div className={styles.checklistItemWarning}>
            <div className={styles.checkIconWarning}>
              <AlertCircle size={24} />
            </div>
            <div className={styles.checkContent}>
              <h4 className={styles.checkTitle}>Pending Draft Invoices</h4>
              <p className={styles.checkDesc}>There are 3 invoices in draft status for October that need to be approved or voided.</p>
            </div>
            <div className={styles.checkStatusWarning}>Action Rec.</div>
          </div>

          <div className={styles.checklistItem}>
            <div className={styles.checkIconSuccess}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.checkContent}>
              <h4 className={styles.checkTitle}>Depreciation Run</h4>
              <p className={styles.checkDesc}>Automated asset depreciation journals have been posted.</p>
            </div>
            <div className={styles.checkStatusSuccess}>Completed</div>
          </div>

          <div className={styles.checklistItem}>
            <div className={styles.checkIconSuccess}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.checkContent}>
              <h4 className={styles.checkTitle}>Clear Suspense Accounts</h4>
              <p className={styles.checkDesc}>Suspense and clearing accounts carry a zero balance.</p>
            </div>
            <div className={styles.checkStatusSuccess}>Completed</div>
          </div>
        </div>

        {/* Right Column: Execution */}
        <div className={styles.executionSection}>
          <div className={styles.actionCard}>
            <div className={styles.actionHeader}>
              <Lock size={20} className={styles.actionIconPrimary} />
              <h3 className={styles.actionTitle}>End of Month (EOM)</h3>
            </div>
            <p className={styles.actionDesc}>
              Lock the <strong>October 2023</strong> period. This will finalize the monthly trial balance and prevent any further journal entries from being posted to this period.
            </p>
            <button className={styles.btnPrimary} onClick={handleEOMClose}>
               Execute EOM Close
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
              <li>
                 <span className={styles.histPeriod}>September 2023</span>
                 <span className={styles.histDate}>Closed Oct 3, 2023</span>
              </li>
              <li>
                 <span className={styles.histPeriod}>August 2023</span>
                 <span className={styles.histDate}>Closed Sep 5, 2023</span>
              </li>
              <li>
                 <span className={styles.histPeriod}>July 2023</span>
                 <span className={styles.histDate}>Closed Aug 2, 2023</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
