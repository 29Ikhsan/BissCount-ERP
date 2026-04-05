'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react';

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
      const res = await fetch('/api/journal');
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
    // Poll for updates every 10 seconds to keep the pulse "live"
    const interval = setInterval(fetchJournals, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="p-4 text-center text-slate-400 text-xs animate-pulse">
      Syncing Ledger Heartbeat...
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#279C5A] animate-ping"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Ledger Pulse</span>
        </div>
        <Zap size={12} className="text-[#279C5A]" />
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {journals.length > 0 ? (
          journals.map((journal) => (
            <div key={journal.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-medium text-slate-400">
                  {new Date(journal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-mono">
                  #{journal.id.slice(-4).toUpperCase()}
                </span>
              </div>
              
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-2 truncate">
                {journal.description}
              </p>

              <div className="space-y-1">
                {journal.lines.map((line) => (
                  <div key={line.id} className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      {line.debit > 0 ? (
                        <ArrowUpRight size={10} className="text-[#279C5A]" />
                      ) : (
                        <ArrowDownLeft size={10} className="text-rose-500" />
                      )}
                      <span className={line.debit > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500'}>
                        {line.account.code}
                      </span>
                    </div>
                    <span className={line.debit > 0 ? 'text-[#279C5A] font-bold' : 'text-slate-500'}>
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
          <div className="p-8 text-center">
            <Activity size={24} className="mx-auto text-slate-200 mb-2" />
            <p className="text-[10px] text-slate-400 italic">No recent manufacturing journals detected.</p>
          </div>
        )}
      </div>

      <div className="p-2 bg-slate-50 dark:bg-slate-800/30 text-center">
        <button className="text-[9px] text-[#279C5A] font-bold hover:underline">
          VIEW FULL AUDIT TRAIL
        </button>
      </div>
    </div>
  );
}
