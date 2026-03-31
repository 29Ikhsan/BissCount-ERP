'use client';

import { 
  Building,
  Plus,
  Briefcase
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

// --- Dummy Data ---
const projects = [
  { id: 'PRJ-24-01', name: 'Cabang Bali Expansion', status: 'Active', revenue: 450000, expenses: 320000, marginTarget: 30, manager: 'Budi Santoso' },
  { id: 'PRJ-24-02', name: 'Marketing Campaign Q1', status: 'Active', revenue: 120000, expenses: 155000, marginTarget: 15, manager: 'Siti Kusuma' },
  { id: 'DEP-IT', name: 'IT Infrastructure (Cost Center)', status: 'Active', revenue: 0, expenses: 85000, marginTarget: 0, manager: 'Alex Wong' },
  { id: 'PRJ-23-99', name: 'Website Redesign', status: 'Closed', revenue: 0, expenses: 15000, marginTarget: 0, manager: 'Siti Kusuma' },
];

export default function ProjectsCostCenters() {
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const activeProjects = projects.filter(p => p.status === 'Active');
  const totalProjectRevenue = activeProjects.reduce((sum, p) => sum + p.revenue, 0);
  const totalProjectExpenses = activeProjects.reduce((sum, p) => sum + p.expenses, 0);
  const totalNetMargin = totalProjectRevenue - totalProjectExpenses;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}><Briefcase style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Cost Centers & Projects</h1>
          <p className={styles.pageSubtitle}>Track revenue and expenses independently tagged per project, branch, or departmental cost center.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => router.push('/projects/new')}>
          <Plus size={16} /> New Cost Center
        </button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCardBlue}>
          <div className={styles.kpiLabel}>TOTAL ALLOCATED REVENUE</div>
          <div className={styles.kpiValue}>{formatCurrency(totalProjectRevenue)}</div>
        </div>
        <div className={styles.kpiCardBlue} style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
          <div className={styles.kpiLabel} style={{ color: '#991B1B' }}>TOTAL ALLOCATED EXPENSES</div>
          <div className={styles.kpiValue} style={{ color: '#DC2626' }}>{formatCurrency(totalProjectExpenses)}</div>
        </div>
        <div className={styles.kpiCardGreen}>
          <div className={styles.kpiLabel}>PROJECTED NET MARGIN</div>
          <div className={styles.kpiValue}>{formatCurrency(totalNetMargin)}</div>
        </div>
      </div>

      {/* Projects List */}
      <div className={styles.listContainer}>
        <table className={styles.projectTable}>
          <thead>
            <tr>
              <th style={{ width: '30%' }}>PROJECT / COST CENTER</th>
              <th style={{ width: '10%' }}>STATUS</th>
              <th style={{ width: '20%', textAlign: 'right' }}>REVENUE</th>
              <th style={{ width: '20%', textAlign: 'right' }}>EXPENSES</th>
              <th style={{ width: '20%', textAlign: 'right' }}>NET P&L</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const netProfit = project.revenue - project.expenses;
              const marginActual = project.revenue > 0 ? (netProfit / project.revenue) * 100 : 0;
              
              let progressClass = styles.progressFill;
              if (project.revenue > 0 && marginActual < project.marginTarget) progressClass = styles.progressFillWarning;
              if (netProfit < 0 && project.revenue > 0) progressClass = styles.progressFillDanger;

              return (
                <tr key={project.id}>
                  <td>
                    <span className={styles.projectName}>{project.name}</span>
                    <span className={styles.projectCode}>{project.id} • {project.manager}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${
                      project.status === 'Active' ? styles.badgeActive : styles.badgeClosed
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className={styles.textRight}>
                    <span className={styles.moneyText}>{formatCurrency(project.revenue)}</span>
                  </td>
                  <td className={styles.textRight}>
                    <span className={styles.moneyTextSecondary}>{formatCurrency(project.expenses)}</span>
                  </td>
                  <td className={styles.textRight}>
                    <div className={netProfit >= 0 ? styles.moneyTextSuccess : styles.moneyTextDanger}>
                      {formatCurrency(netProfit)}
                    </div>
                    {project.revenue > 0 && (
                      <div className={styles.progressContainer}>
                        <div className={styles.progressLabels}>
                          <span>Margin: {marginActual.toFixed(1)}%</span>
                          <span>Target: {project.marginTarget}%</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div className={progressClass} style={{ width: `${Math.min(Math.max((marginActual / project.marginTarget) * 100, 0), 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
