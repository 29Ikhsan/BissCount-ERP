'use client';

import { 
  Plus, 
  Download,
  Filter,
  Calendar,
  UploadCloud,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Expenses() {
  const router = useRouter();
  const [expensesList, setExpensesList] = useState<any[]>([]);

  useEffect(() => {
    const fetchLiveExpenses = async () => {
      try {
        const res = await fetch('/api/expenses');
        const data = await res.json();
        if (data.expenses && data.expenses.length > 0) {
          const mapped = data.expenses.map((exp: any) => {
            const dateObj = new Date(exp.date);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return {
              id: exp.id,
              date: dateStr,
              merchant: exp.merchant,
              category: exp.category,
              employee: exp.employeeName,
              amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(exp.amount)
            };
          });
          setExpensesList(mapped);
        }
      } catch (e) {
        console.error('Error fetching expenses', e);
      }
    };
    fetchLiveExpenses();
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Expenses</h1>
          <p className={styles.pageSubtitle}>Streamline your organizational spend. Review, approve, and audit financial claims with institutional-grade precision.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.addBtn} onClick={() => router.push('/expenses/new')}>
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCardBlue}>
          <div className={styles.kpiLabel}>TOTAL EXPENSES (MTD)</div>
          <div className={styles.kpiValue}>$42,850.12 <span className={styles.kpiTrend}>↗ 8.2%</span></div>
        </div>
        <div className={styles.kpiCardDefault}>
          <div className={styles.kpiLabel}>PENDING APPROVAL</div>
          <div className={styles.kpiValueMain}>14 <span className={styles.kpiSub}>Requests</span></div>
        </div>
        <div className={styles.kpiCardDefault}>
          <div className={styles.kpiLabel}>AWAITING REIMBURSEMENT</div>
          <div className={styles.kpiValueMain}>$3,120.00 <span className={styles.kpiSub}>Approved</span></div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.tableSection}>
          <div className={styles.tableControls}>
            <div className={styles.filterGroup}>
              <button className={styles.filterBtn}><Filter size={14}/> Filter</button>
              <button className={styles.filterBtn}><Calendar size={14}/> Date Range</button>
            </div>
            <button className={styles.exportBtn}>
              <Download size={14} /> Export CSV
            </button>
          </div>
          
          <table className={styles.expenseTable}>
            <thead>
              <tr>
                <th>DATE</th>
                <th>MERCHANT</th>
                <th>CATEGORY</th>
                <th>EMPLOYEE</th>
                <th className={styles.textRight}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {expensesList.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <div className={styles.dateBlock}>
                      <span className={styles.dateMonth}>{exp.date.split(' ')[0]}</span>
                      <span className={styles.dateDay}>{exp.date.split(' ')[1].replace(',', '')}</span>
                      <span className={styles.dateYear}>{exp.date.split(' ')[2]}</span>
                    </div>
                  </td>
                  <td><span className={styles.merchantName}>{exp.merchant}</span></td>
                  <td>
                    <span className={styles.categoryBadge}>{exp.category}</span>
                  </td>
                  <td><span className={styles.employeeName}>{exp.employee}</span></td>
                  <td className={styles.textRight}><span className={styles.amountText}>{exp.amount}</span></td>
                </tr>
              ))}
              {expensesList.length === 0 && (
                <tr>
                   <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No expenses reported yet. Click "New Entry" to submit a claim.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className={styles.viewAllContainer}>
             <button className={styles.viewAllBtn}>View All Transactions</button>
          </div>
        </div>

        <div className={styles.sideSection}>
          <div className={styles.scanCard}>
            <h3 className={styles.scanTitle}>Smart Scan</h3>
            <p className={styles.scanDesc}>Upload receipts and our AI will automatically extract merchant, date, and tax details into your ledger.</p>
            <div className={styles.dropZone}>
              <UploadCloud size={32} className={styles.uploadIcon} />
              <div className={styles.uploadTextBold}>Drop files or click to upload</div>
              <div className={styles.uploadTextFormat}>JPG, PDF, PNG UP TO 10MB</div>
            </div>
          </div>

          <div className={styles.complianceCard}>
            <div className={styles.complianceHeader}>
              <ShieldCheck className={styles.complianceIcon} size={20} />
              <h3 className={styles.complianceTitle}>Compliance Center</h3>
            </div>
            
            <div className={styles.complianceList}>
              <div className={styles.complianceItem}>
                <div className={`${styles.compDot} ${styles.dotRed}`}></div>
                <div className={styles.compContent}>
                  <div className={styles.compName}>Missing Tax ID</div>
                  <div className={styles.compDesc}>United Airlines receipt is missing a valid VAT/Tax ID number for reimbursement.</div>
                  <button className={styles.compAction}>REQUEST EDIT</button>
                </div>
              </div>
              
              <div className={styles.complianceItem}>
                <div className={`${styles.compDot} ${styles.dotGreen}`}></div>
                <div className={styles.compContent}>
                  <div className={styles.compName}>Auto-Policy Match</div>
                  <div className={styles.compDesc}>CloudServer Pro matches the recurring 'IT Subscriptions' policy. Auto-approved.</div>
                </div>
              </div>

              <div className={styles.complianceItem}>
                <div className={`${styles.compDot} ${styles.dotGray}`}></div>
                <div className={styles.compContent}>
                  <div className={styles.compName}>Limit Warning</div>
                  <div className={styles.compDesc}>Department 'Marketing' has reached 90% of its quarterly travel budget.</div>
                </div>
              </div>
            </div>
            
            <button className={styles.policyBtn}>View Spending Policies</button>
          </div>

          <div className={styles.cardPromo}>
            <div className={styles.promoOverlay}></div>
            <div className={styles.promoContent}>
              <div className={styles.promoLabel}>COMING SOON</div>
              <h3 className={styles.promoTitle}>Corporate Credit Cards</h3>
              <p className={styles.promoDesc}>
                Unified spend management with physical cards for every employee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
