'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { X, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ManualJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: any[];
  tags: any[];
}

export default function ManualJournalModal({ isOpen, onClose, onSuccess, accounts, tags }: ManualJournalModalProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState([
    { accountId: '', costCenterId: '', debit: 0, credit: 0 },
    { accountId: '', costCenterId: '', debit: 0, credit: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && lines.length >= 2;

  const addLine = () => {
    setLines([...lines, { accountId: '', costCenterId: '', debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    
    // Clear the opposite field if one is entered
    if (field === 'debit' && value > 0) newLines[index].credit = 0;
    if (field === 'credit' && value > 0) newLines[index].debit = 0;
    
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError('Journal entry must be balanced (Debit = Credit).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/accounting/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          reference,
          description,
          lines: lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0))
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save entry');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <h2 className={styles.modalTitle}>New Journal Entry</h2>
            <p className={styles.modalSubtitle}>Create a balanced financial transaction manualy.</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Transaction Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Reference #</label>
              <input 
                type="text" 
                placeholder="e.g. JV-2026-001" 
                value={reference} 
                onChange={(e) => setReference(e.target.value)} 
                required 
              />
            </div>
            <div className={styles.inputGroupFull}>
              <label>Description (Narrative)</label>
              <input 
                type="text" 
                placeholder="Describe the purpose of this entry..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className={styles.lineTableWrapper}>
            <table className={styles.lineTable}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Tag / Project</th>
                  <th className={styles.numCell}>Debit</th>
                  <th className={styles.numCell}>Credit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <select 
                        value={line.accountId} 
                        onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                        required
                      >
                        <option value="">Select Account...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select 
                        value={line.costCenterId} 
                        onChange={(e) => updateLine(idx, 'costCenterId', e.target.value)}
                      >
                        <option value="">No Tag</option>
                        {tags.map(tag => (
                          <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.numCell}>
                      <input 
                        type="number" 
                        step="0.01"
                        value={line.debit || ''} 
                        onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value))}
                        disabled={line.credit > 0}
                      />
                    </td>
                    <td className={styles.numCell}>
                      <input 
                        type="number" 
                        step="0.01"
                        value={line.credit || ''} 
                        onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value))}
                        disabled={line.debit > 0}
                      />
                    </td>
                    <td className={styles.actionCell}>
                      <button type="button" onClick={() => removeLine(idx)} className={styles.removeBtn}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.formFooter}>
            <button type="button" className={styles.addBtn} onClick={addLine}>
              <Plus size={16} /> Add Line
            </button>
            <div className={styles.balanceSummary}>
              <div className={styles.summaryItem}>
                <span>Total Debit:</span>
                <strong>{totalDebit.toLocaleString()}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Total Credit:</span>
                <strong>{totalCredit.toLocaleString()}</strong>
              </div>
              <div className={`${styles.statusBadge} ${isBalanced ? styles.statusSuccess : styles.statusError}`}>
                {isBalanced ? (
                  <><CheckCircle2 size={14} /> Balanced</>
                ) : (
                  <><AlertCircle size={14} /> Unbalanced ({difference.toLocaleString()})</>
                )}
              </div>
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.submitGroup}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className={styles.btnSubmit} disabled={!isBalanced || loading}>
              {loading ? 'Posting Entry...' : 'Post Journal Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
