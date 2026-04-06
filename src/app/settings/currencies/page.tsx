'use client';

import React, { useState, useEffect } from 'react';
import styles from './Currencies.module.css';

interface Currency {
  id: string;
  name: string;
  rate: number;
  lastUpdated: string;
}

interface Account {
  id: string;
  name: string;
  code: string;
  currencyCode: string;
  balance: number;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/currencies').then(res => res.json()),
      fetch('/api/accounting/accounts').then(res => res.json())
    ]).then(([currData, accData]) => {
      setCurrencies(currData.currencies || []);
      setAccounts(accData.accounts || []);
      setLoading(false);
    });
  }, []);

  const handleRevalue = async (accountId: string) => {
    const rate = prompt("Enter current exchange rate:");
    if (!rate) return;

    try {
      const res = await fetch('/api/accounting/revaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, targetExchangeRate: parseFloat(rate) })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Revaluation successful! Adjustment amount: ${data.adjustmentAmount}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to perform revaluation.");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>Multi-Currency Management</h1>
          <p>Configure exchange rates and manage foreign currency revaluation.</p>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.section}>
          <h2>Active Currencies</h2>
          <div className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Rate (to IDR)</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map(c => (
                  <tr key={c.id}>
                    <td className={styles.bold}>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.rate.toLocaleString()}</td>
                    <td>{new Date(c.lastUpdated).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Foreign Currency Accounts</h2>
          <div className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Currency</th>
                  <th>Balance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.filter(a => a.currencyCode !== 'IDR').map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className={styles.accCode}>{a.code}</div>
                      <div className={styles.accName}>{a.name}</div>
                    </td>
                    <td><span className={styles.currencyBadge}>{a.currencyCode}</span></td>
                    <td>{a.balance.toLocaleString()}</td>
                    <td>
                      <button 
                        className={styles.revalueBtn}
                        onClick={() => handleRevalue(a.id)}
                      >
                        Revalue
                      </button>
                    </td>
                  </tr>
                ))}
                {accounts.filter(a => a.currencyCode !== 'IDR').length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.empty}>No foreign currency accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
