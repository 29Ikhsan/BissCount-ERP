'use client';

import { 
  Plus,
  PercentSquare,
  X,
  RefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

// --- Default Tax Data ---
export default function TaxSettings() {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTax, setNewTax] = useState({ name: '', desc: '', rate: 11.0, scope: 'sales_purchases', type: 'Sales & Purchases', accountId: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [taxRes, accRes] = await Promise.all([
        fetch('/api/taxes'),
        fetch('/api/accounts')
      ]);
      const taxData = await taxRes.json();
      const accData = await accRes.json();
      
      if (taxData.taxes) setTaxes(taxData.taxes);
      if (accData.accounts) setAccounts(accData.accounts);
    } catch (e) {
      console.error('Failed to fetch tax or account data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTax = async () => {
    try {
      const res = await fetch('/api/taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTax,
          type: newTax.scope === 'sales_purchases' ? 'Sales & Purchases' : (newTax.scope === 'wht' ? 'Withholding' : 'Direct')
        })
      });
      
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewTax({ name: '', desc: '', rate: 11.0, scope: 'sales_purchases', type: 'Sales & Purchases', accountId: '' });
        fetchData();
      }
    } catch (e) {
      alert('Network error creating tax rate.');
    }
  };

  const deleteTax = async (id: string) => {
    if (!window.confirm("Delete this tax rate? This may affect existing transaction templates.")) return;
    try {
      const res = await fetch(`/api/taxes?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchData();
    } catch (e) {
      alert('Network error deleting tax configuration.');
    }
  };
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}><PercentSquare style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Tax Configuration Master</h1>
          <p className={styles.pageSubtitle}>Define tax rates, rules, and global default Chart of Account bindings natively utilized in forms.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add Tax Rate
        </button>
      </div>

      {/* Tax List */}
      <div className={styles.card}>
        <table className={styles.taxTable}>
          <thead>
            <tr>
              <th style={{ width: '35%' }}>TAX NAME & DESCRIPTION</th>
              <th style={{ width: '15%' }}>TAX SCOPE</th>
              <th style={{ width: '15%', textAlign: 'right' }}>RATE (%)</th>
              <th style={{ width: '25%' }}>MAPPED ACCOUNT (COA)</th>
              <th style={{ width: '10%' }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading tax configurations...</td></tr>
            ) : taxes.map((tax) => (
              <tr key={tax.id}>
                <td>
                  <span className={styles.taxName}>{tax.name}</span>
                  <span className={styles.taxGroup}>{tax.description}</span>
                </td>
                <td>
                  <span className={`${styles.badge} ${
                    tax.scope === 'sales_purchases' ? styles.badgeSales :
                    tax.scope === 'wht' ? styles.badgeWht : styles.badgePurchase
                  }`}>
                    {tax.type}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className={styles.rateText}>{tax.rate.toFixed(2)}%</span>
                </td>
                <td>
                  <span className={styles.coaText}>{tax.account?.name || 'Unmapped'}</span>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{tax.account?.code}</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className={styles.actionBtn} style={{ color: '#EF4444' }} onClick={() => deleteTax(tax.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Tax Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Tax Rate</h3>
              <button className={styles.iconBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>TAX NAME</label>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      placeholder="e.g. VAT 10%"
                      value={newTax.name}
                      onChange={(e) => setNewTax({...newTax, name: e.target.value})}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>TAX RATE (%)</label>
                    <input 
                      type="number" 
                      className={styles.inputField} 
                      value={newTax.rate}
                      onChange={(e) => setNewTax({...newTax, rate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>DESCRIPTION</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="Brief explanation of tax rule"
                    value={newTax.desc}
                    onChange={(e) => setNewTax({...newTax, desc: e.target.value})}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>TAX SCOPE</label>
                    <select 
                      className={styles.inputField}
                      value={newTax.scope}
                      onChange={(e) => setNewTax({...newTax, scope: e.target.value, type: e.target.options[e.target.selectedIndex].text})}
                    >
                      <option value="sales_purchases">Sales & Purchases</option>
                      <option value="sales">Sales Only</option>
                      <option value="purchase">Purchases Only</option>
                      <option value="wht">Withholding (WHT)</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>LEDGER MAPPING (COA)</label>
                    <select 
                      className={styles.inputField}
                      value={newTax.accountId}
                      onChange={(e) => setNewTax({...newTax, accountId: e.target.value})}
                    >
                      <option value="">Select Account...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
               <button className={styles.btnOutline} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
               <button className={styles.btnPrimary} onClick={handleAddTax}>Create Tax Rate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
