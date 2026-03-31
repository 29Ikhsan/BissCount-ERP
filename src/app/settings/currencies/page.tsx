'use client';

import { 
  Plus,
  Globe2,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import styles from './page.module.css';

// --- Default Currency Data ---
const baseCurrency = { code: 'IDR', name: 'Indonesian Rupiah' };

const exchangeRates = [
  { id: 'USD', name: 'US Dollar', rate: 15650.00, lastUpdated: '2026-03-25 08:00 AM' },
  { id: 'SGD', name: 'Singapore Dollar', rate: 11520.45, lastUpdated: '2026-03-25 08:00 AM' },
  { id: 'EUR', name: 'Euro', rate: 17100.20, lastUpdated: '2026-03-24 16:30 PM' },
  { id: 'JPY', name: 'Japanese Yen', rate: 104.50, lastUpdated: '2026-03-24 16:30 PM' },
];

export default function CurrencySettings() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}><Globe2 style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Multi-Currency Settings</h1>
          <p className={styles.pageSubtitle}>Manage foreign exchange configurations for accurate international procurement and sales.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <RefreshCw size={14} /> Fetch Live Rates
          </button>
          <button className={styles.btnPrimary}>
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

      {/* Currency Exchange Rates List */}
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
            {exchangeRates.map((currency) => (
              <tr key={currency.id}>
                <td>
                  <span className={styles.currencyCode}>{currency.id}</span>
                  <div className={styles.currencyName}>{currency.name}</div>
                </td>
                <td>
                  <span className={styles.rateText}>1 {currency.id} = Rp {currency.rate.toLocaleString('id-ID')}</span>
                  <div className={styles.rateDate}>Updated: {currency.lastUpdated}</div>
                </td>
                <td>
                  <span className={styles.statusActive}><CheckCircle2 size={14} /> Active</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className={styles.actionBtn}>Edit Rate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
