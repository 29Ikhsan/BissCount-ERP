'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  UserCheck,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function HRMLanding() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  return (
    <div className={styles.container}>
      {/* Header with Period Selector */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <Briefcase size={24} color="#10B981"/>
          </div>
          <div>
            <h1 className={styles.title}>Human Capital Management</h1>
            <p className={styles.subtitle}>Institutional administration for your workforce and payroll operations.</p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
           <div className={styles.periodSelector}>
              <Calendar size={16} color="#6B7280" />
              <select 
                className={styles.dropdown} 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select 
                className={styles.dropdown} 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
           </div>
           <div className={styles.badge}><ShieldCheck size={14}/> CORETAX READY</div>
        </div>
      </div>

      {/* Main Hub Grid */}
      <div className={styles.hubGrid}>
        {/* Module 1: Employee Data */}
        <Link href={`/hrm/employees?month=${month}&year=${year}`} className={styles.hubCard}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            <Users size={32} color="white" />
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Employee Registry</h2>
            <p className={styles.cardDesc}>
              Manage personal profiles, banking details, NPWP, and BPJS identifiers. 
              Institutional data entry for your entire workforce.
            </p>
            <div className={styles.cardAction}>
              Configure Registry <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* Module 2: Payroll Center */}
        <Link href={`/hrm/payroll?month=${month}&year=${year}`} className={styles.hubCard}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
            <CreditCard size={32} color="white" />
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Payroll Processing</h2>
            <p className={styles.cardDesc}>
              Execute monthly salary runs, calculate TER-compliant PPh 21, and 
              generate automated accounting journals.
            </p>
            <div className={styles.cardAction} style={{ color: '#3B82F6' }}>
              Process Payroll <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Summary Section */}
      <div className={styles.summaryPanel}>
        <h3 className={styles.panelTitle}>Active Workforce Overview</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Total Staff</div>
            <div className={styles.summaryValue}>2 Active</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Payroll Status ({months[month-1].label})</div>
            <div className={styles.summaryStatus}>PENDING PROCESSING</div>
          </div>
          <div className={styles.summaryItem}>
             <div className={styles.summaryLabel}>Compliance Score</div>
             <div className={styles.summaryValue} style={{ color: '#10B981' }}>100% Valid</div>
          </div>
          <div className={styles.summaryItem}>
             <div className={styles.summaryLabel}>Last Run</div>
             <div className={styles.summaryValue}>N/A</div>
          </div>
        </div>
      </div>
    </div>
  );
}
