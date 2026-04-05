'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  Activity, 
  ShieldCheck,
  ChevronRight,
  MoreHorizontal,
  PlusCircle,
  MinusCircle,
  X,
  CreditCard,
  Building,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function JournalHub() {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Entry State
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 }
    ]
  });

  const fetchData = async () => {
    setLoading(true);
    const [entRes, accRes] = await Promise.all([
      fetch('/api/accounting/journal'),
      fetch('/api/accounting/ledger')
    ]);
    const entData = await entRes.json();
    const accData = await accRes.json();
    setEntries(Array.isArray(entData) ? entData : []);
    setAccounts(Array.isArray(accData) ? accData : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLine = () => {
    setNewEntry({
      ...newEntry,
      lines: [...newEntry.lines, { accountId: '', debit: 0, credit: 0 }]
    });
  };

  const handleRemoveLine = (index: number) => {
    if (newEntry.lines.length <= 2) return;
    const updatedLines = [...newEntry.lines];
    updatedLines.splice(index, 1);
    setNewEntry({ ...newEntry, lines: updatedLines });
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updatedLines = [...newEntry.lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setNewEntry({ ...newEntry, lines: updatedLines });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/accounting/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          description: '',
          reference: '',
          lines: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]
        });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to post entry');
      }
    } catch (error) {
       console.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDebit = newEntry.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = newEntry.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Analyzing Sequential Financial Transactions...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/accounting/ledger" className={styles.backBtn}>
            <ArrowLeft size={18}/>
          </Link>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Journal Hub</h1>
            <p className={styles.subtitle}>Sequential transaction log and double-entry auditing.</p>
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
          <Plus size={16}/> New Entry
        </button>
      </div>

      {/* Sequential Entries */}
      <div className={styles.ledgerPanel}>
        <div className={styles.tableHeader}>
           <div className={styles.tableTitleGroup}>
              <h2 className={styles.tableTitle}>Sequential Fiscal Log</h2>
              <span className={styles.liveIndicator}>LIVE SEQUENCING</span>
           </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>DATE & REFERENCE</th>
              <th>DESCRIPTION</th>
              <th>ACCOUNT LINES (Dr / Cr)</th>
              <th className={styles.textRight}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id}>
                <td>
                  <div style={{ fontWeight: 800 }}>{new Date(entry.date).toLocaleDateString()}</div>
                  <div className={styles.codeBadge} style={{ display: 'inline-block', marginTop: '4px' }}>{entry.reference || 'GL-ENT'}</div>
                </td>
                <td style={{ maxWidth: '300px' }}>{entry.description}</td>
                <td>
                   {entry.lines.map((line: any) => (
                      <div key={line.id} style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', padding: '2px 0' }}>
                         <span style={{ minWidth: '150px' }}>{line.account.name}</span>
                         <span style={{ minWidth: '80px', color: line.debit > 0 ? '#279C5A' : '#64748B' }}>
                           {line.debit > 0 ? `+ ${line.debit.toLocaleString()}` : ''}
                         </span>
                         <span style={{ minWidth: '80px', color: line.credit > 0 ? '#EF4444' : '#64748B' }}>
                           {line.credit > 0 ? `- ${line.credit.toLocaleString()}` : ''}
                         </span>
                      </div>
                   ))}
                </td>
                <td className={styles.textRight}>
                   <button className={styles.moreBtn}><MoreHorizontal size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW ENTRY MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                 <h2 className={styles.title} style={{ fontSize: '1.4rem' }}>Sequential Entry Authorization</h2>
                 <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                    <X size={20}/>
                 </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                 <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Transaction Date</label>
                       <input 
                         type="date" 
                         className={styles.input}
                         value={newEntry.date}
                         onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                       />
                    </div>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Reference / Document #</label>
                       <input 
                         type="text" 
                         className={styles.input}
                         placeholder="e.g., INV-2024-001"
                         value={newEntry.reference}
                         onChange={(e) => setNewEntry({...newEntry, reference: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                    <label className={styles.label}>Context / Description</label>
                    <input 
                      type="text" 
                      className={styles.input}
                      placeholder="e.g., Payment for advertising services"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                    />
                 </div>

                 {/* Line Items */}
                 <div className={styles.lineItemsGrid}>
                    <div className={styles.lineHeader}>
                       <span>ACCOUNT</span>
                       <span>DEBIT</span>
                       <span>CREDIT</span>
                       <span></span>
                    </div>
                    {newEntry.lines.map((line, idx) => (
                       <div key={idx} className={styles.lineRow}>
                          <select 
                            className={styles.select}
                            value={line.accountId}
                            onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                            required
                          >
                             <option value="">Select Account</option>
                             {accounts.map(acc => (
                               <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                             ))}
                          </select>
                          <input 
                            type="number" 
                            className={styles.input}
                            value={line.debit}
                            onChange={(e) => handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                          />
                          <input 
                            type="number" 
                            className={styles.input}
                            value={line.credit}
                            onChange={(e) => handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                          />
                          <button type="button" onClick={() => handleRemoveLine(idx)} className={styles.removeBtn}>
                             <MinusCircle size={16} color="#EF4444"/>
                          </button>
                       </div>
                    ))}
                    <button type="button" className={styles.addLineBtn} onClick={handleAddLine} style={{ padding: '12px', display: 'flex', gap: '8px', color: '#279C5A', fontWeight: 700 }}>
                       <PlusCircle size={16}/> Add Transaction Line
                    </button>
                    
                    <div className={styles.entryFooter}>
                       <span className={isBalanced ? styles.balanced : styles.imbalance}>
                          {isBalanced ? 'Balanced Account' : `Difference: Rp ${(totalDebit - totalCredit).toLocaleString()}`}
                       </span>
                       <div style={{ display: 'flex', gap: '24px' }}>
                          <span>Total Dr: Rp {totalDebit.toLocaleString()}</span>
                          <span>Total Cr: Rp {totalCredit.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   className={styles.btnPrimary} 
                   style={{ width: '100%' }}
                   disabled={isSubmitting || !isBalanced}
                 >
                    {isSubmitting ? 'Posting Entries...' : 'Authorize Transaction'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
