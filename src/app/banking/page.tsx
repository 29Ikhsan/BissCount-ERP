'use client';

import { useState, useEffect } from 'react';
import { Landmark, UploadCloud, Link as LinkIcon, CheckCircle2, AlertCircle, RefreshCw, XCircle, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

// --- Dummy Data ---
const bankAccounts = [
  { id: '1', name: 'BCA Corporate', number: 'XXXX-XXXX-8991', type: 'Checking', balance: 145000000, lastSynced: '5 mins ago', status: 'Connected' },
  { id: '2', name: 'Mandiri Payroll', number: 'XXXX-XXXX-3342', type: 'Checking', balance: 52000000, lastSynced: '1 hr ago', status: 'Connected' },
  { id: '3', name: 'Stripe IDR', number: 'IDR_acct_889F', type: 'Payment Gateway', balance: 28450000, lastSynced: '12 hrs ago', status: 'Requires Auth' },
];

const reconciliationLines = [
  {
    id: 'tx-001',
    date: 'Oct 23, 2023',
    desc: 'STRIPE TRANSFER - SETTLEMENT',
    amount: 14500.00,
    type: 'deposit',
    match: { type: 'exact', score: 100, aksiaRef: 'INV-2024-002 Payment', aksiaId: '#REC-0991' }
  },
  {
    id: 'tx-002',
    date: 'Oct 24, 2023',
    desc: 'AWS EMEA SARL - CLOUD HOSTING',
    amount: -1250.00,
    type: 'withdrawal',
    match: { type: 'suggested', score: 85, aksiaRef: 'Amazon Web Services (Vendor)', aksiaId: 'Mapped via Rules' }
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
    match: { type: 'exact', score: 100, aksiaRef: 'INV-2024-001 Payment', aksiaId: '#REC-0992' }
  }
];

export default function Banking() {
  const [activeTab, setActiveTab] = useState('reconcile');
  const [activeAccountId, setActiveAccountId] = useState('1');
  const { t, formatCurrency } = useLanguage();
  const [bankAccountsList, setBankAccountsList] = useState<any[]>([]);
  const [reconciliationList, setReconciliationList] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [bankRules, setBankRules] = useState<any[]>([]);
  const [totalCash, setTotalCash] = useState(0);
  const [toast, setToast] = useState<{ visible: boolean, message: string } | null>(null);
  
  // Rule Creation State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({
    name: '',
    keywords: '',
    condition: 'CONTAINS',
    type: 'BOTH',
    targetAccountId: '',
    costCenterId: ''
  });

  const triggerToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchBanking = async () => {
      try {
        const [bankRes, ccRes, rulesRes, accRes] = await Promise.all([
          fetch('/api/banking'),
          fetch('/api/cost-centers'),
          fetch('/api/banking/rules'),
          fetch('/api/accounts')
        ]);
        const bankData = await bankRes.json();
        const ccData = await ccRes.json();
        const rulesData = await rulesRes.json();
        const accData = await accRes.json();

        if (bankData.accounts && bankData.accounts.length > 0) {
           setBankAccountsList(bankData.accounts);
           setActiveAccountId(bankData.accounts[0].id);
           const total = bankData.accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
           setTotalCash(total);
        }
        if (bankData.reconciliationLines) setReconciliationList(bankData.reconciliationLines);
        if (ccData.costCenters) setCostCenters(ccData.costCenters);
        if (rulesData.rules) setBankRules(rulesData.rules);
        if (accData.accounts) setAccounts(accData.accounts);
      } catch (err) {
        console.error('Fetch banking failed', err);
      }
    };
    fetchBanking();
  }, []);


  const getMatchIcon = (match: any) => {
    if (!match) return <AlertCircle size={16} className={styles.iconWarning} />;
    if (match.type === 'exact') return <CheckCircle2 size={16} className={styles.iconSuccess} />;
    if (match.type === 'suggested') return <Sparkles size={16} className={styles.iconSuccess} />;
    return null;
  };

  const handleMatch = async (id: string) => {
    const line = reconciliationList.find(l => l.id === id);
    if (!line) return;

    try {
      const res = await fetch('/api/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lineId: id, 
          targetId: line.match?.aksiaId,
          costCenterId: line.selectedCC,
          action: 'reconcile' 
        })
      });
      
      if (res.ok) {
        const ccTag = line.selectedCC ? ` tagged to Cost Center` : '';
        setReconciliationList(reconciliationList.filter(item => item.id !== id));
        triggerToast(`Transaction reconciled and mapped to ledger${ccTag}.`);
        
        // Refresh account balances
        const bankRes = await fetch('/api/banking');
        const bankData = await bankRes.json();
        if (bankData.accounts) setBankAccountsList(bankData.accounts);
      } else {
        alert("Failed to reconcile transaction in database.");
      }
    } catch (e) {
      alert("Network error during reconciliation.");
    }
  };

  const handleCCSelect = (lineId: string, ccId: string) => {
    setReconciliationList(reconciliationList.map(line => 
      line.id === lineId ? { ...line, selectedCC: ccId } : line
    ));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      // Skip header, assuming Date,Description,Amount format
      const csvData = lines.slice(1).map(line => {
        const [date, description, amount] = line.split(',');
        return { date, description, amount };
      });

      try {
        const res = await fetch('/api/banking/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: activeAccountId, csvLines: csvData })
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Successfully imported ${data.count} transaction lines!`);
          // Refresh list
          const bankRes = await fetch('/api/banking');
          const bankData = await bankRes.json();
          if (bankData.reconciliationLines) setReconciliationList(bankData.reconciliationLines);
        }
      } catch (err) {
        triggerToast("Failed to import statement.");
      }
    };
    reader.readAsText(file);
  };

  const handleCreateRule = async () => {
    try {
      const res = await fetch('/api/banking/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      if (res.ok) {
        const data = await res.json();
        setBankRules([data.rule, ...bankRules]);
        setIsRuleModalOpen(false);
        triggerToast("Bank Rule created and activated!");
        setNewRule({ name: '', keywords: '', condition: 'CONTAINS', type: 'BOTH', targetAccountId: '', costCenterId: '' });
      }
    } catch (e) {
      triggerToast("Error creating rule.");
    }
  };

  const handleSimulateFeed = async () => {
    triggerToast(t('ConnectingBankPortal') || "Simulation: Connecting to secure bank portal via API...");
    try {
      const res = await fetch('/api/banking/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: activeAccountId })
      });
      if (res.ok) {
        setTimeout(async () => {
          triggerToast(t('BankFeedSynced') || "Bank feed securely synced.");
          // Refresh list
          const bankRes = await fetch('/api/banking');
          const bankData = await bankRes.json();
          if (bankData.reconciliationLines) setReconciliationList(bankData.reconciliationLines);
        }, 1500);
      }
    } catch(e) {
      triggerToast(t('BankFeedError') || "Failed to sync bank feed.");
    }
  };

  return (
    <div className={styles.container}>
      <input 
        type="file" 
        id="bank-import-input" 
        style={{ display: 'none' }} 
        accept=".csv"
        onChange={handleFileUpload}
      />
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>{t('BankingReconciliation')}</h1>
          <p className={styles.pageSubtitle}>{t('CashReconSubtitle')}</p>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.btnOutline} onClick={() => document.getElementById('bank-import-input')?.click()}>
            <UploadCloud size={16} /> {t('ImportStatement') || "Import Statement"}
           </button>
           <button className={styles.btnPrimary} onClick={handleSimulateFeed}>
            <LinkIcon size={16} /> {t('ConnectBankFeed') || "Connect Bank Feed"}
           </button>
        </div>
      </div>

      {toast?.visible && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#10B981', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> {toast.message}
        </div>
      )}

      <div className={styles.contentGrid}>
        {/* Left Column: Bank Accounts */}
        <div className={styles.leftCol}>
          <div className={styles.cardHeaderRow}>
            <h3 className={styles.sectionTitle}>{t('ConnectedAccounts')}</h3>
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
                {t('NoBankAccounts') || "No Bank/Cash accounts found. Import COA settings first."}
              </div>
            )}
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>{t('TotalBalance')}</div>
            <div className={styles.summaryValue}>{formatCurrency(totalCash)}</div>
          </div>
        </div>

        {/* Right Column: Reconciliation Workspace */}
        <div className={styles.rightCol}>
          <div className={styles.workspaceCard}>
            {/* Workspace Header & Tabs */}
            <div className={styles.workspaceHeader}>
              <div className={styles.workspaceTitleGroup}>
                <h2 className={styles.workspaceTitle}>{t('BankingReconciliation')}</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={styles.badgeOrange}>{reconciliationList.length} {t('Unreconciled')}</span>
                  {reconciliationList.length > 0 && (
                    <button 
                      className={styles.btnPrimary} 
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={async () => {
                        triggerToast("Executing AI Intelligent Auto-Match...");
                        try {
                          const res = await fetch('/api/banking/reconcile', { method: 'POST' });
                          const data = await res.json();
                          if (data.success) {
                            triggerToast(`Auto-Match Complete: ${data.matches} transactions reconciled!`);
                            // Refresh list
                            const bankRes = await fetch('/api/banking');
                            const bankData = await bankRes.json();
                            if (bankData.reconciliationLines) setReconciliationList(bankData.reconciliationLines);
                          } else {
                            triggerToast(data.error || "Auto-Match failed.");
                          }
                        } catch(e) {
                          triggerToast("Network error during Auto-Match.");
                        }
                      }}
                    >
                      <Sparkles size={14} /> Auto-Match All
                    </button>
                  )}
                </div>
              </div>
              
              <div className={styles.tabsContainer}>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'reconcile' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('reconcile')}
                >
                  {t('ToReconcile')}
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'rules' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('rules')}
                >
                  {t('BankRules')}
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'statement' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('statement')}
                >
                  {t('BankStatement')}
                </button>
              </div>
            </div>

            {/* Reconciliation Feed */}
            {activeTab === 'reconcile' && (
              <div className={styles.feedContainer}>
                <div className={styles.feedHeaderRow}>
                  <div className={styles.feedColBank}>{t('BankStatementLine') || "BANK STATEMENT LINE"}</div>
                  <div className={styles.feedColMatch}>{t('AKSIAMatch') || "AKSIA MATCH / ACTION"}</div>
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

                      {/* Right side mapping - AKSIA system match */}
                      <div className={styles.systemLine}>
                        {line.match ? (
                          <div className={styles.matchBox}>
                            <div className={styles.matchInfo}>
                              <div className={styles.matchTypeLabel}>
                                {getMatchIcon(line.match)}
                                {line.match.type === 'exact' ? 'Exact Match' : 'AI Suggested Match'}
                              </div>
                              <div className={styles.matchRef}>{line.match.aksiaRef}</div>
                              {line.match.accountName && (
                                <div className={styles.matchAccount}>Mapped to: {line.match.accountName}</div>
                              )}
                              <div className={styles.matchId}>Reference: {line.match.aksiaId.slice(0, 8)}</div>
                            </div>
                            <div className={styles.matchActions}>
                              <button className={styles.btnMatch} onClick={() => handleMatch(line.id)}>OK</button>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.unmatchedBox}>
                            <div className={styles.unmatchedText}>{t('NoExactMatch') || "No exact match found in ledger."}</div>
                            <div className={styles.unmatchedActions} style={{ flexDirection: 'column', gap: '8px' }}>
                               <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                 <button className={styles.btnCreate} onClick={() => triggerToast("Opening Quick-Create Ledger Entry form.")}>{t('CreateTransaction') || "Create Transaction"}</button>
                                 <button className={styles.btnFind} onClick={() => triggerToast("Searching entire GL history for potential matches.")}>{t('FindMatch') || "Find Match"}</button>
                               </div>
                               <select 
                                 className={styles.tabBtn} 
                                 style={{ fontSize: '0.75rem', width: '100%', padding: '4px' }}
                                 value={line.selectedCC || ''}
                                 onChange={(e) => handleCCSelect(line.id, e.target.value)}
                               >
                                 <option value="">-- Apply Cost Center --</option>
                                 {costCenters.map(cc => (
                                   <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                                 ))}
                               </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {reconciliationList.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      {t('EverythingReconciled') || "Everything is up to date and reconciled perfectly!"}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bank Rules Tab */}
            {activeTab === 'rules' && (
              <div className={styles.feedContainer}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>Active Automation Rules</h4>
                  <button className={styles.btnPrimary} onClick={() => setIsRuleModalOpen(true)}>+ Create Rule</button>
                </div>
                
                <div className={styles.feedList}>
                  {bankRules.map(rule => (
                    <div key={rule.id} className={styles.feedItem} style={{ padding: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{rule.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          When description {rule.condition} <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>"{rule.keywords}"</span>
                        </div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Map to Account:</div>
                        <div style={{ fontWeight: 500 }}>{rule.targetAccount.code} - {rule.targetAccount.name}</div>
                        {rule.costCenter && (
                          <div style={{ fontSize: '11px', color: '#6366f1' }}>Cost Center: {rule.costCenter.name}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {bankRules.length === 0 && (
                    <div className={styles.emptyState}>
                      <RefreshCw size={32} className={styles.emptyIcon} />
                      <h4>Automate your bookkeeping</h4>
                      <p>Create bank rules to auto-categorize recurring transactions like software subscriptions or rent.</p>
                      <button className={styles.btnPrimary} style={{ marginTop: '16px' }} onClick={() => setIsRuleModalOpen(true)}>Create First Rule</button>
                    </div>
                  )}
                </div>

                {isRuleModalOpen && (
                  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '500px', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                      <h3>Create Bank Rule</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        <input className={styles.btnOutline} style={{ textAlign: 'left' }} placeholder="Rule Name (e.g. AWS Hosting)" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} />
                        <input className={styles.btnOutline} style={{ textAlign: 'left' }} placeholder="Keyword (e.g. AWS)" value={newRule.keywords} onChange={e => setNewRule({...newRule, keywords: e.target.value})} />
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select className={styles.btnOutline} style={{ flex: 1 }} value={newRule.condition} onChange={e => setNewRule({...newRule, condition: e.target.value})}>
                            <option value="CONTAINS">Contains</option>
                            <option value="EXACT">Exactly Matches</option>
                          </select>
                          <select className={styles.btnOutline} style={{ flex: 1 }} value={newRule.type} onChange={e => setNewRule({...newRule, type: e.target.value})}>
                            <option value="BOTH">All Transactions</option>
                            <option value="DEBIT">Withdrawals only</option>
                            <option value="CREDIT">Deposits only</option>
                          </select>
                        </div>

                        <select className={styles.btnOutline} value={newRule.targetAccountId} onChange={e => setNewRule({...newRule, targetAccountId: e.target.value})}>
                          <option value="">-- Select Target Account --</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        </select>

                        <select className={styles.btnOutline} value={newRule.costCenterId} onChange={e => setNewRule({...newRule, costCenterId: e.target.value})}>
                          <option value="">-- Select Cost Center (Optional) --</option>
                          {costCenters.map(cc => (
                            <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                          <button className={styles.btnPrimary} style={{ flex: 1 }} onClick={handleCreateRule}>Activate Rule</button>
                          <button className={styles.btnOutline} style={{ flex: 1 }} onClick={() => setIsRuleModalOpen(false)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State for statement tab */}
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
