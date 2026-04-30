'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Zap } from 'lucide-react';
import styles from './LedgerPulse.module.css';

interface JournalLine {
  id: string;
  debit: number;
  credit: number;
  account: {
    code: string;
    name: string;
  };
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: JournalLine[];
}

export default function LedgerPulse() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJournals = async () => {
    try {
      const res = await fetch('/api/accounting/journal');
      const data = await res.json();
      if (data.journals) {
        // Only show relevant manufacturing/inventory journals for this hub
        const relevant = data.journals
          .filter((j: JournalEntry) => 
            j.description.toLowerCase().includes('production') || 
            j.description.toLowerCase().includes('inventory') ||
            j.description.toLowerCase().includes('material')
          )
          .slice(0, 5);
        setJournals(relevant);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch ledger pulse:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
    const interval = setInterval(fetchJournals, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className={styles.emptyPulse}>
       <div className={styles.heartbeatDot}></div>
       <p className={styles.emptyText}>Synchronizing Ledger Heartbeat...</p>
    </div>
  );

  return (
    <div className={styles.pulseContainer}>
      <div className={styles.pulseHeader}>
        <div className={styles.pulseTitleGroup}>
          <div className={styles.heartbeatDot}></div>
          <span className={styles.pulseTitle}>Live Ledger Pulse</span>
        </div>
        <Zap size={12} color="#279C5A" />
      </div>

      <div className={styles.pulseList}>
        {journals.length > 0 ? (
          journals.map((journal) => (
            <div key={journal.id} className={styles.journalEntry}>
              <div className={styles.entryHeader}>
                <span className={styles.entryTime}>
                  {new Date(journal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={styles.entryId}>
                  #{journal.id.slice(-4).toUpperCase()}
                </span>
              </div>
              
              <p className={styles.entryDesc}>
                {journal.description}
              </p>

              <div className={styles.lineItems}>
                {journal.lines.map((line) => (
                  <div key={line.id} className={styles.lineItem}>
                    <span className={styles.accCode}>{line.account.code}</span>
                    <span className={line.debit > 0 ? styles.amountDebit : styles.amountCredit}>
                      {line.debit > 0 
                        ? `+${line.debit.toLocaleString()}` 
                        : `-${line.credit.toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyPulse}>
            <Activity size={24} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No recent manufacturing journals detected.</p>
          </div>
        )}
      </div>

      <div className={styles.pulseFooter}>
        <a href="/accounting/ledger" className={styles.viewAll}>
          VIEW FULL AUDIT TRAIL
        </a>
      </div>
    </div>
  );
}
