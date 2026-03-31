'use client';

import { useState, useEffect } from 'react';
import { Landmark, UploadCloud, Link as LinkIcon, CheckCircle2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import styles from './page.module.css';

// --- Dummy Data ---
const bankAccounts = [
  { id: '1', name: 'BCA Corporate', number: 'XXXX-XXXX-8991', type: 'Checking', balance: 145000, lastSynced: '5 mins ago', status: 'Connected' },
  { id: '2', name: 'Mandiri Payroll', number: 'XXXX-XXXX-3342', type: 'Checking', balance: 52000, lastSynced: '1 hr ago', status: 'Connected' },
  { id: '3', name: 'Stripe USD', number: 'us_acct_889F', type: 'Payment Gateway', balance: 28450, lastSynced: '12 hrs ago', status: 'Requires Auth' },
];

const reconciliationLines = [
  {
    id: 'tx-001',
    date: 'Oct 23, 2023',
    desc: 'STRIPE TRANSFER - SETTLEMENT',
    amount: 14500.00,
    type: 'deposit',
    match: { type: 'exact', score: 100, bizzcountRef: 'INV-2024-002 Payment', bizzcountId: '#REC-0991' }
  },
  {
    id: 'tx-002',
    date: 'Oct 24, 2023',
    desc: 'AWS EMEA SARL - CLOUD HOSTING',
    amount: -1250.00,
    type: 'withdrawal',
    match: { type: 'suggested', score: 85, bizzcountRef: 'Amazon Web Services (Vendor)', bizzcountId: 'Mapped via Rules' }
  },
  {
    id: 'tx-003',
    date: 'Oct 25, 2023',
    desc: 'ATM TARIK TUNAI JKT SELATAN',
    amount: -500.00,
    type: 'withdrawal',
    match: null // Unmatched
  },
  {
    id: 'tx-004',
    date: 'Oct 26, 2023',
    desc: 'PT GLOBAL TECH SOL - INBOUND',
    amount: 45000.00,
    type: 'deposit',
    match: { type: 'exact', score: 100, bizzcountRef: 'INV-2024-001 Payment', bizzcountId: '#REC-0992' }
  }
];

export default function Banking() {
  const [activeTab, setActiveTab] = useState('reconcile');
  const [activeAccountId, setActiveAccountId] = useState('1');
  const [bankAccountsList, setBankAccountsList] = useState<any[]>([]);
  const [reconciliationList, setReconciliationList] = useState<any[]>([]);
  const [totalCash, setTotalCash] = useState(0);

  useEffect(() => {
    const fetchBanking = async () => {
      try {
        const res = await fetch('/api/banking');
        const data = await res.json();
        if (data.accounts && data.accounts.length > 0) {
           setBankAccountsList(data.accounts);
           setActiveAccountId(data.accounts[0].id);
           const total = data.accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
           setTotalCash(total);
        }
        if (data.reconciliationLines) {
           setReconciliationList(data.reconciliationLines);
        }
      } catch (err) {
        console.error('Fetch banking failed', err);
      }
    };
    fetchBanking();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const getMatchIcon = (match: any) => {
    if (!match) return <AlertCircle size={16} className={styles.iconWarning} />;
    if (match.type === 'exact') return <CheckCircle2 size={16} className={styles.iconSuccess} />;
    if (match.type === 'suggested') return <SparklesIcon />;
    return null;
  };

  const SparklesIcon = () => <span style={{ color: '#8B5CF6' }}>✨</span>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Cash & Bank</h1>
          <p className={styles.pageSubtitle}>Manage connected bank feeds and perform automated ledger reconciliation.</p>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.btnOutline}>
            <UploadCloud size={16} /> Import Statement
           </button>
           <button className={styles.btnPrimary}>
            <LinkIcon size={16} /> Connect Bank Feed
           </button>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Left Column: Bank Accounts */}
        <div className={styles.leftCol}>
          <div className={styles.cardHeaderRow}>
            <h3 className={styles.sectionTitle}>Connected Accounts</h3>
          </div>
          
          <div className={styles.accountsList}>
            {bankAccountsList.map((acc) => (
              <div 
                key={acc.id} 
                className={`${styles.accountCard} ${activeAccountId === acc.id ? styles.accountCardActive : ''}`}
                onClick={() => setActiveAccountId(acc.id)}
              >
                <div className={styles.accHeader}>
                  <div className={styles.accIconBox}>
                    <Landmark size={18} />
                  </div>
                  <div>
                    <h4 className={styles.accName}>{acc.name}</h4>
                    <p className={styles.accNumber}>{acc.number} • {acc.type}</p>
                  </div>
                </div>
                <div className={styles.accFooter}>
                  <div className={styles.accBalance}>{formatCurrency(acc.balance)}</div>
                  <div className={styles.accStatusBox}>
                    {acc.status === 'Connected' ? (
                      <span className={styles.statusConnected}>● {acc.lastSynced}</span>
                    ) : (
                      <span className={styles.statusWarning}>⚠ Action Required</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {bankAccountsList.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                No Bank/Cash accounts found. Import COA settings first.
              </div>
            )}
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>TOTAL CASH & EQUIVALENTS</div>
            <div className={styles.summaryValue}>{formatCurrency(totalCash)}</div>
          </div>
        </div>

        {/* Right Column: Reconciliation Workspace */}
        <div className={styles.rightCol}>
          <div className={styles.workspaceCard}>
            {/* Workspace Header & Tabs */}
            <div className={styles.workspaceHeader}>
              <div className={styles.workspaceTitleGroup}>
                <h2 className={styles.workspaceTitle}>Ledger Reconciliation Workspace</h2>
                <span className={styles.badgeOrange}>{reconciliationList.length} Unreconciled</span>
              </div>
              
              <div className={styles.tabsContainer}>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'reconcile' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('reconcile')}
                >
                  To Reconcile
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'rules' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('rules')}
                >
                  Bank Rules
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'statement' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('statement')}
                >
                  Bank Statement
                </button>
              </div>
            </div>

            {/* Reconciliation Feed */}
            {activeTab === 'reconcile' && (
              <div className={styles.feedContainer}>
                <div className={styles.feedHeaderRow}>
                  <div className={styles.feedColBank}>BANK STATEMENT LINE</div>
                  <div className={styles.feedColMatch}>BIZZCOUNT MATCH / ACTION</div>
                </div>

                <div className={styles.feedList}>
                  {reconciliationList.map((line) => (
                    <div key={line.id} className={`${styles.feedItem} ${!line.match ? styles.feedItemUnmatched : ''}`}>
                      {/* Left side mapping - physical bank line */}
                      <div className={styles.bankLine}>
                         <div className={styles.lineDate}>{line.date}</div>
                         <div className={styles.lineDesc}>{line.desc}</div>
                         <div className={line.amount > 0 ? styles.amtIn : styles.amtOut}>
                           {line.amount > 0 ? '+' : ''}{formatCurrency(line.amount)}
                         </div>
                      </div>

                      {/* Right side mapping - Bizzcount system match */}
                      <div className={styles.systemLine}>
                        {line.match ? (
                          <div className={styles.matchBox}>
                            <div className={styles.matchInfo}>
                              <div className={styles.matchTypeLabel}>
                                {getMatchIcon(line.match)}
                                {line.match.type === 'exact' ? 'Exact Match' : 'AI Suggested Match'}
                              </div>
                              <div className={styles.matchRef}>{line.match.bizzcountRef}</div>
                              <div className={styles.matchId}>{line.match.bizzcountId}</div>
                            </div>
                            <div className={styles.matchActions}>
                              <button className={styles.btnMatch}>OK</button>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.unmatchedBox}>
                            <div className={styles.unmatchedText}>No exact match found in ledger.</div>
                            <div className={styles.unmatchedActions}>
                               <button className={styles.btnCreate}>Create Transaction</button>
                               <button className={styles.btnFind}>Find Match</button>
                               <button className={styles.btnTransfer}>Transfer</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {reconciliationList.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      Everything is up to date and reconciled perfectly!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty States for other tabs */}
            {activeTab === 'rules' && (
              <div className={styles.emptyState}>
                <RefreshCw size={32} className={styles.emptyIcon} />
                <h4>Automate your bookkeeping</h4>
                <p>Create bank rules to auto-categorize recurring transactions like software subscriptions or rent.</p>
                <button className={styles.btnPrimary} style={{ marginTop: '16px' }}>Create Rule</button>
              </div>
            )}
            {activeTab === 'statement' && (
              <div className={styles.emptyState}>
                <FileStatementIcon />
                <h4>Bank Statement Ledger</h4>
                <p>View the raw imported statement data from your financial institution.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const FileStatementIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.emptyIcon}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);
