'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Calculator, 
  Plus, 
  Search, 
  Activity, 
  ShieldCheck,
  FileText,
  TrendingUp,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import ManualJournalModal from './ManualJournalModal';

export default function JournalLedger() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'journal'>('journal');
  const [ledger, setLedger] = useState<any[]>([]);
  const [journal, setJournal] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLedger = () => {
    setLoading(true);
    fetch('/api/accounting/ledger')
      .then(res => res.json())
      .then(data => {
        setLedger(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  const fetchJournal = () => {
    setLoading(true);
    fetch('/api/accounting/journal')
      .then(res => res.json())
      .then(data => {
        setJournal(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  const fetchTags = () => {
    fetch('/api/accounting/tags')
      .then(res => res.json())
      .then(data => setTags(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchTags();
    if (activeTab === 'ledger') fetchLedger();
    else fetchJournal();
  }, [activeTab]);

  const filteredLedger = ledger.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) || 
    acc.code.includes(search)
  );

  const filteredJournal = journal.filter(entry => 
    entry.reference?.toLowerCase().includes(search.toLowerCase()) ||
    entry.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && ledger.length === 0 && journal.length === 0) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing the Master Book of Accounts...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <ManualJournalModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { activeTab === 'journal' ? fetchJournal() : fetchLedger(); }}
        accounts={ledger} 
        tags={tags}
      />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <Calculator size={28} color="#279C5A"/>
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Master Ledger & Journal</h1>
            <p className={styles.subtitle}>Unified institutional bookkeeper and sequential transaction oversight.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon}/>
              <input 
                type="text" 
                placeholder="Search Reference or Account..." 
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
             <Plus size={16}/> New Journal Entry
           </button>
        </div>
      </div>

      <div className={styles.tabContainer}>
        <button 
          className={activeTab === 'journal' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('journal')}
        >
          Sequential Journal
        </button>
        <button 
          className={activeTab === 'ledger' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('ledger')}
        >
          Account Trial Balance
        </button>
      </div>

      {activeTab === 'ledger' ? (
        <div className={styles.ledgerPanel}>
          <div className={styles.tableHeader}>
             <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <h2 className={styles.tableTitle}>Trial Balance</h2>
                <span className={styles.liveIndicator}>BALANCED</span>
             </div>
             <button className={styles.integratedBadge} style={{background: '#F0FDF4', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', padding: '6px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: 800}}>
                <ShieldCheck size={12}/> AUDIT READY
             </button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ACCOUNT CODE & NAME</th>
                <th>CLASSIFICATION</th>
                <th className={styles.numeric}>TOTAL DEBIT</th>
                <th className={styles.numeric}>TOTAL CREDIT</th>
                <th className={styles.numeric}>CLOSING BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map(acc => (
                <tr key={acc.id} className={styles.row}>
                  <td>
                    <span className={styles.codeBadge}>{acc.code}</span>
                    <span className={styles.accountName}>{acc.name}</span>
                  </td>
                  <td>
                    <span className={`${styles.typeBadge} ${styles[acc.type.toLowerCase()]}`}>
                      {acc.type}
                    </span>
                  </td>
                  <td className={styles.numeric}>{acc.totalDebit.toLocaleString()}</td>
                  <td className={styles.numeric}>{acc.totalCredit.toLocaleString()}</td>
                  <td className={styles.numeric} style={{ fontWeight: 900, fontSize: '15px' }}>
                     {acc.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.ledgerPanel}>
          <div className={styles.tableHeader}>
             <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <h2 className={styles.tableTitle}>Transaction History</h2>
                <span className={styles.liveIndicator}>SEQUENTIAL</span>
             </div>
             <div style={{display: 'flex', gap: '8px'}}>
                <button style={{background: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'}}>
                   <Download size={12}/> Export Journal
                </button>
             </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ENTRY DATE</th>
                <th style={{width: '120px'}}>REFERENCE</th>
                <th>ACCOUNTING COMPOSITION</th>
                <th className={styles.numeric} style={{width: '140px'}}>DEBIT (IDR)</th>
                <th className={styles.numeric} style={{width: '140px'}}>CREDIT (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {filteredJournal.map(entry => (
                <tr key={entry.id} className={styles.row}>
                  <td style={{ verticalAlign: 'top', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <span className={styles.codeBadge} style={{background: '#EFF6FF', color: '#3B82F6'}}>{entry.reference || 'SYSTEM'}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '8px', color: '#0F172A' }}>{entry.description}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {entry.lines?.map((line: any, idx: number) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          paddingLeft: line.type === 'CREDIT' ? '24px' : '0',
                          borderLeft: line.type === 'CREDIT' ? '2px solid #E2E8F0' : 'none',
                          fontSize: '13px',
                          color: line.type === 'CREDIT' ? '#64748B' : '#1E293B'
                        }}>
                          <span style={{fontWeight: line.type === 'DEBIT' ? 700 : 500}}>{line.account.name}</span>
                          <span style={{fontFamily: 'JetBrains Mono', fontSize: '11px', opacity: 0.8}}>{line.type}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className={styles.numeric} style={{ verticalAlign: 'top', paddingTop: '42px' }}>
                    {entry.lines?.filter((l: any) => l.type === 'DEBIT').map((l: any, idx: number) => (
                      <div key={idx} style={{marginBottom: '4px'}}>{l.amount.toLocaleString()}</div>
                    ))}
                  </td>
                  <td className={styles.numeric} style={{ verticalAlign: 'top', paddingTop: '42px' }}>
                    {entry.lines?.filter((l: any) => l.type === 'CREDIT').map((l: any, idx: number) => (
                      <div key={idx} style={{marginBottom: '4px'}}>{l.amount.toLocaleString()}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
