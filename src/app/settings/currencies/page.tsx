'use client';

import { 
  Plus,
  Globe2,
  RefreshCw,
  CheckCircle2,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

// --- Default Currency Data ---
const baseCurrency = { code: 'IDR', name: 'Indonesian Rupiah' };

export default function CurrencySettings() {
  const [rates, setRates] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ id: '', name: '', rate: 0 });

  const fetchRatesFromAPI = async () => {
    try {
      const res = await fetch('/api/currencies');
      const data = await res.json();
      if (data.currencies) setRates(data.currencies);
    } catch (e) {
      console.error('Failed to fetch currency rates');
    }
  };

  useEffect(() => {
    fetchRatesFromAPI();
  }, []);

  const fetchLiveRates = async () => {
    setIsFetching(true);
    // Simulation: Use current state to "push" updates back to API (mimicking a backend fetch)
    const promises = rates.map(r => 
      fetch('/api/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...r,
          rate: r.rate + (Math.random() - 0.5) * 50 // Minor flux
        })
      })
    );
    
    await Promise.all(promises);
    await fetchRatesFromAPI();
    setIsFetching(false);
  };

  const handleAddCurrency = async () => {
    try {
      const res = await fetch('/api/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCurrency)
      });
      
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewCurrency({ id: '', name: '', rate: 0 });
        fetchRatesFromAPI();
      }
    } catch (e) {
      alert('Network error adding currency.');
    }
  };

  const deleteCurrency = async (id: string) => {
    try {
      const res = await fetch(`/api/currencies?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchRatesFromAPI();
    } catch (e) {
      alert('Network error removing currency.');
    }
  };
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}><Globe2 style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Multi-Currency Settings</h1>
          <p className={styles.pageSubtitle}>Manage foreign exchange configurations for accurate international procurement and sales.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: isFetching ? 'not-allowed' : 'pointer' }}
            onClick={fetchLiveRates}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? styles.spinner : ''} /> {isFetching ? 'Fetching...' : 'Fetch Live Rates'}
          </button>
          <button className={styles.btnPrimary} onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add Currency
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Accounting Base Currency</div>
          <div className={styles.kpiValueWrapper}>
            <div className={styles.kpiValue}>{baseCurrency.code}</div>
            <div className={styles.badgeBase}>Primary Ledger</div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>{baseCurrency.name}</div>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Forex Gain/Loss Mapping</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#6B7280' }}>Realized Gain Acc:</span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>8-1000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#6B7280' }}>Realized Loss Acc:</span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>9-1000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Currency Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Supported Currency</h3>
              <button className={styles.iconBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>ISO CURRENCY CODE</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. GBP"
                    value={newCurrency.id}
                    onChange={(e) => setNewCurrency({...newCurrency, id: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>CURRENCY NAME</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. British Pound Sterling"
                    value={newCurrency.name}
                    onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>INITIAL EXCHANGE RATE (TO IDR)</label>
                  <input 
                    type="number" 
                    className={styles.inputField} 
                    value={newCurrency.rate}
                    onChange={(e) => setNewCurrency({...newCurrency, rate: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
               <button className={styles.btnOutline} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
               <button className={styles.btnPrimary} onClick={handleAddCurrency}>Add Currency</button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.card}>
        <table className={styles.currencyTable}>
          <thead>
            <tr>
              <th style={{ width: '25%' }}>CURRENCY CODE</th>
              <th style={{ width: '25%' }}>EXCHANGE RATE</th>
              <th style={{ width: '25%' }}>STATUS</th>
              <th style={{ width: '25%', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((currency) => (
              <tr key={currency.id}>
                <td>
                  <span className={styles.currencyCode}>{currency.id}</span>
                  <div className={styles.currencyName}>{currency.name}</div>
                </td>
                <td>
                  <span className={styles.rateText}>1 {currency.id} = Rp {currency.rate.toLocaleString('id-ID')}</span>
                  <div className={styles.rateDate}>Updated: {new Date(currency.lastUpdated).toLocaleString()}</div>
                </td>
                <td>
                  <span className={styles.statusActive}><CheckCircle2 size={14} /> Active</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className={styles.actionBtn} onClick={() => deleteCurrency(currency.id)}>Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
