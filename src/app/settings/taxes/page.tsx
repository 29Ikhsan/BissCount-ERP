'use client';

import { 
  Plus,
  PercentSquare
} from 'lucide-react';
import styles from './page.module.css';

// --- Default Tax Data ---
const taxRates = [
  { id: 'T01', name: 'PPN 11%', desc: 'Pajak Pertambahan Nilai Umum', rate: 11.0, type: 'Sales & Purchases', scope: 'sales_purchases', coaMap: '2-1200 (VAT Payable)' },
  { id: 'T02', name: 'PPh 23', desc: 'Pajak Penghasilan Pasal 23', rate: 2.0, type: 'Withholding (WHT)', scope: 'wht', coaMap: '2-1230 (Income Tax PPh 23)' },
  { id: 'T03', name: 'PPh 21', desc: 'Pajak Penghasilan Karyawan / Jasa Pribadi', rate: 5.0, type: 'Withholding (WHT)', scope: 'wht', coaMap: '2-1210 ( इनकम Tax PPh 21)' },
  { id: 'T04', name: 'Zero Rated VAT', desc: 'Ekspor / Bebas PPN', rate: 0.0, type: 'Sales', scope: 'sales', coaMap: '2-1200 (VAT Payable)' },
];

export default function TaxSettings() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}><PercentSquare style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Tax Configuration Master</h1>
          <p className={styles.pageSubtitle}>Define tax rates, rules, and global default Chart of Account bindings natively utilized in forms.</p>
        </div>
        <button className={styles.btnPrimary}>
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
            {taxRates.map((tax) => (
              <tr key={tax.id}>
                <td>
                  <span className={styles.taxName}>{tax.name}</span>
                  <span className={styles.taxGroup}>{tax.desc}</span>
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
                  <span className={styles.coaText}>{tax.coaMap}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className={styles.actionBtn}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
