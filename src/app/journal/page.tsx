'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, Trash2, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

export default function ManualJournal() {
  const router = useRouter();
  const { formatCurrency } = useLanguage();
  const { showToast } = useToast();
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/accounts').then(res => res.json()),
      fetch('/api/cost-centers').then(res => res.json())
    ]).then(([accountsData, ccData]) => {
        if (accountsData.accounts) setChartOfAccounts(accountsData.accounts);
        if (ccData.costCenters) setCostCenters(ccData.costCenters);
      });
  }, []);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: ''
  });

  const [lines, setLines] = useState([
    { id: 1, accountId: '', costCenterId: '', description: '', debit: 0, credit: 0 },
    { id: 2, accountId: '', costCenterId: '', description: '', debit: 0, credit: 0 }
  ]);

  const addLine = () => {
    setLines([...lines, { id: Date.now(), accountId: '', costCenterId: '', description: '', debit: 0, credit: 0 }]);
  };

  const removeLine = (id: number) => {
    if (lines.length > 2) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: number, field: string, value: string | number) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        // If updating debit, ensure credit is 0, and vice versa (classic UI assistance)
        if (field === 'debit' && Number(value) > 0) return { ...line, debit: Number(value), credit: 0 };
        if (field === 'credit' && Number(value) > 0) return { ...line, credit: Number(value), debit: 0 };
        return { ...line, [field]: value };
      }
      return line;
    }));
  };

  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const difference = Math.abs(totalDebit - totalCredit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      showToast("Journal entries must be balanced (Total Debits = Total Credits).", "warning");
      return;
    }

    const invalidAccount = lines.find(l => !l.accountId);
    if(invalidAccount) {
      showToast("All lines must select an account", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date: new Date(formData.date).toISOString(),
        description: formData.description,
        reference: formData.reference,
        lines: lines.map(line => ({
          accountId: line.accountId,
          costCenterId: line.costCenterId || undefined,
          debit: line.debit,
          credit: line.credit
        }))
      };

      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (res.ok) {
        showToast("Manual Journal Entry successfully posted!", "success");
        router.push('/');
      } else {
        showToast(`Error: ${responseBody.error || 'Failed to post journal'}`, "error");
      }
    } catch (err) {
      showToast('Network error connecting to Backend API.', "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Manual Journal</h1>
          <p className={styles.pageSubtitle}>Record general ledger adjusting entries, depreciation, and complex transactions.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>Cancel</button>
          <button 
            className={`${styles.btnPrimary} ${!isBalanced ? styles.btnDisabled : ''}`} 
            onClick={handleSubmit}
            disabled={!isBalanced || isSubmitting}
          >
            <Save size={16} /> {isSubmitting ? 'Posting...' : 'Post Journal'}
          </button>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          {/* Header Details */}
          <div className={styles.formSection}>
            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>JOURNAL DATE</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className={styles.inputField} 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>REFERENCE NO. (OPTIONAL)</label>
                <input 
                  type="text" 
                  placeholder="e.g. ADJ-2024-001"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className={styles.inputField} 
                />
              </div>
            </div>
            <div className={styles.inputGroup} style={{ marginTop: '24px' }}>
              <label>MEMO / DESCRIPTION</label>
              <textarea 
                placeholder="Description for this journal entry..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={styles.textArea} 
                rows={2}
                required
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Journal Lines</h3>
            
            <table className={styles.linesTable}>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>ACCOUNT</th>
                  <th style={{ width: '25%' }}>DESCRIPTION</th>
                  <th style={{ width: '20%' }}>COST CENTER</th>
                  <th style={{ width: '12.5%' }} className={styles.textRight}>DEBITS</th>
                  <th style={{ width: '12.5%' }} className={styles.textRight}>CREDITS</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id}>
                    <td>
                      <select 
                        required
                        value={line.accountId}
                        onChange={(e) => updateLine(line.id, 'accountId', e.target.value)}
                        className={styles.inputField}
                      >
                        <option value="" disabled>Select account...</option>
                        {chartOfAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Line description..." 
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                        className={styles.inputField} 
                      />
                    </td>
                    <td>
                      <select 
                        value={line.costCenterId}
                        onChange={(e) => updateLine(line.id, 'costCenterId', e.target.value)}
                        className={styles.inputField}
                      >
                        <option value="">-- No Tag --</option>
                        {costCenters.map(cc => (
                          <option key={cc.id} value={cc.id}>{cc.code}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={line.debit === 0 ? '' : line.debit}
                        onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                        className={`${styles.inputField} ${styles.textRight} ${styles.inputMoney}`} 
                        placeholder="0.00"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={line.credit === 0 ? '' : line.credit}
                        onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                        className={`${styles.inputField} ${styles.textRight} ${styles.inputMoney}`} 
                        placeholder="0.00"
                      />
                    </td>
                    <td className={styles.textCenter}>
                      <button 
                        type="button" 
                        onClick={() => removeLine(line.id)} 
                        className={styles.deleteBtn}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.addLineRow}>
              <button type="button" onClick={addLine} className={styles.addLineBtn}>
                <Plus size={16} /> Add Line
              </button>
            </div>
            
            {/* Totals Section */}
            <div className={styles.totalsContainer}>
              <div className={styles.totalsBox}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total Debits:</span>
                  <span className={styles.totalAmount}>{formatCurrency(totalDebit)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total Credits:</span>
                  <span className={styles.totalAmount}>{formatCurrency(totalCredit)}</span>
                </div>
                
                {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
                  <div className={styles.differenceRow}>
                    <span className={styles.differenceLabel}>Out of balance by:</span>
                    <span className={styles.differenceAmount}>{formatCurrency(difference)}</span>
                  </div>
                )}
                
                {isBalanced && totalDebit > 0 && (
                  <div className={styles.balancedRow}>
                    <span className={styles.balancedBadge}>BALANCED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
