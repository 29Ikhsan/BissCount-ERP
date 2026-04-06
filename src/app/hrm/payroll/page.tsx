'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { 
  CreditCard, 
  Search, 
  Calendar, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Building2,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

export default function PayrollCenter() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollResult, setPayrollResult] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hrm/employees');
      const data = await res.json();
      setEmployees(data || []);
      
      // Also check if payroll for this period exists (Optional, could be a separate API)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunPayroll = async () => {
    if (!confirm(`Execute Payroll Run for ${month}/${year}? This will generate a General Ledger entry.`)) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/hrm/payroll/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year })
      });
      const data = await res.json();
      
      if (res.ok) {
        setPayrollResult(data);
        showToast(`Success! Payroll for ${data.count} employees processed. Journal ID: ${data.journalId}`, 'success');
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast('Failed to connect to the payroll engine.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotalGross = () => {
    return employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumb}>
            <Link href="/hrm">HCM</Link> <ChevronRight size={14} /> <span className={styles.activeBreadcrumb}>PAYROLL CENTER</span>
          </div>
          <h1 className={styles.title}>Payroll Processing</h1>
          <p className={styles.subtitle}>Execute salary runs and generate DJP-compliant PPh 21 reports.</p>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.periodBox}>
              <Calendar size={16} />
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                 <option value={1}>January</option>
                 <option value={2}>February</option>
                 <option value={3}>March</option>
                 <option value={4}>April</option>
                 <option value={5}>May</option>
                 <option value={6}>June</option>
                 <option value={7}>July</option>
                 <option value={8}>August</option>
                 <option value={9}>September</option>
                 <option value={10}>October</option>
                 <option value={11}>November</option>
                 <option value={12}>December</option>
              </select>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
           </div>
           <button className={styles.btnSecondary} onClick={() => window.print()}><Download size={16} /> Export Reports</button>
           <button 
             className={styles.btnPrimary} 
             onClick={handleRunPayroll}
             disabled={isProcessing}
           >
             <Zap size={16} className={isProcessing ? styles.spinIcon : ''} /> 
             {isProcessing ? 'Processing...' : 'Run Payroll'}
           </button>
        </div>
      </div>

      {/* Analytics Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Monthly Gross Pay</div>
          <div className={styles.statValue}>Rp {calculateTotalGross().toLocaleString()}</div>
          <div className={styles.statSub}>{employees.length} EMPLOYEES ACTIVE</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Estimated PPh 21</div>
          <div className={styles.statValue}>Rp {(payrollResult?.totalPPh21 || calculateTotalGross() * 0.05).toLocaleString()}</div>
          <div className={styles.statSub}>TER CATEGORY COMPLIANT</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>BPJS Contributions</div>
          <div className={styles.statValue}>Rp {(calculateTotalGross() * 0.04).toLocaleString()}</div>
          <div className={styles.statSub}>KES & KET INTEGRATED</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ledger Status</div>
          <div className={styles.statValue} style={{ color: payrollResult ? '#10B981' : '#F59E0B' }}>
            {payrollResult ? 'POSTED' : 'WAITING'}
          </div>
          <div className={styles.statSub}>{payrollResult ? `JOURNAL ID: ${payrollResult.journalId.split('-')[0]}` : 'READY FOR PROCESSING'}</div>
        </div>
      </div>

      {/* Employee List Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
           <h3 className={styles.tableTitle}>Payroll Registry — {month}/{year}</h3>
           <div className={styles.searchBox}>
              <Search size={16} />
              <input type="text" placeholder="Search employees..." />
           </div>
        </div>
        <table className={styles.table}>
          <thead>
             <tr>
                <th>EMPLOYEE</th>
                <th>POSITION</th>
                <th>PTKP STYLE</th>
                <th style={{ textAlign: 'right' }}>BASE SALARY</th>
                <th style={{ textAlign: 'center' }}>STATUS</th>
             </tr>
          </thead>
          <tbody>
             {employees.map(emp => (
                <tr key={emp.id}>
                   <td>
                      <div className={styles.empInfo}>
                         <div className={styles.avatar}>{emp.name[0]}</div>
                         <div>
                            <div className={styles.empName}>{emp.name}</div>
                            <div className={styles.empCode}>{emp.employeeId}</div>
                         </div>
                      </div>
                   </td>
                   <td>{emp.jobTitle || 'Staff'}</td>
                   <td><span className={styles.ptkpBadge}>{emp.ptkpStatus || 'TK/0'}</span></td>
                   <td style={{ textAlign: 'right', fontWeight: 700 }}>Rp {emp.salary?.toLocaleString()}</td>
                   <td style={{ textAlign: 'center' }}>
                      <div className={payrollResult ? styles.statusCheck : styles.statusWait}>
                         {payrollResult ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                         {payrollResult ? 'PROCESSED' : 'PENDING'}
                      </div>
                   </td>
                </tr>
             ))}
          </tbody>
        </table>
      </div>

      {/* Journal Preview */}
      {payrollResult && (
        <div className={styles.journalPanel}>
           <div className={styles.journalHeader}>
              <h3 className={styles.panelTitle}><FileText size={20} /> Automated Payroll Ledger Entry</h3>
              <div className={styles.complianceNote}><ShieldCheck size={14} /> EXPORTED TO GENERAL LEDGER</div>
           </div>
           <div className={styles.journalEntries}>
              <div className={styles.journalLine}>
                 <span>6003 - Beban Gaji & Upah</span>
                 <span className={styles.debit}>Rp {payrollResult.totalGross.toLocaleString()}</span>
              </div>
              <div className={styles.journalLine}>
                 <span>2003 - Hutang Gaji</span>
                 <span className={styles.credit}>Rp {(payrollResult.totalGross - payrollResult.totalPPh21).toLocaleString()}</span>
              </div>
              <div className={styles.journalLine}>
                 <span>2004 - Hutang PPh Pasal 21</span>
                 <span className={styles.credit}>Rp {payrollResult.totalPPh21.toLocaleString()}</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
