'use client';

import { 
  Building,
  Plus,
  Briefcase
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function ProjectsCostCenters() {
  const router = useRouter();
  const { t, formatCurrency } = useLanguage();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCostCenters = async () => {
    try {
      const res = await fetch('/api/cost-centers');
      const data = await res.json();
      if (data.costCenters) setProjects(data.costCenters);
    } catch (e) {
      console.error('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCostCenters();
  }, []);


  const activeProjects = projects.filter(p => !p.closed);
  const totalProjectRevenue = activeProjects.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const totalProjectExpenses = activeProjects.reduce((sum, p) => sum + (p.expenses || 0), 0);
  const totalNetMargin = totalProjectRevenue - totalProjectExpenses;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}><Briefcase style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> {t('ProjectAnalytics')}</h1>
          <p className={styles.pageSubtitle}>{t('ProjectSubtitle')}</p>
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
              const rev = project.revenue || 0;
              const exp = project.expenses || 0;
              const netProfit = rev - exp;
              const marginActual = rev > 0 ? (netProfit / rev) * 100 : 0;
              const marginTarget = project.marginTarget || 20;
              
              let progressClass = styles.progressFill;
              if (rev > 0 && marginActual < marginTarget) progressClass = styles.progressFillWarning;
              if (netProfit < 0 && rev > 0) progressClass = styles.progressFillDanger;

              return (
                <tr key={project.id}>
                  <td>
                    <span className={styles.projectName}>{project.name}</span>
                    <span className={styles.projectCode}>{project.code} • {project.manager || 'No Manager'}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${
                      !project.closed ? styles.badgeActive : styles.badgeClosed
                    }`}>
                      {!project.closed ? 'Active' : 'Closed'}
                    </span>
                  </td>
                  <td className={styles.textRight}>
                    <span className={styles.moneyText}>{formatCurrency(rev)}</span>
                  </td>
                  <td className={styles.textRight}>
                    <span className={styles.moneyTextSecondary}>{formatCurrency(exp)}</span>
                  </td>
                  <td className={styles.textRight}>
                    <div className={netProfit >= 0 ? styles.moneyTextSuccess : styles.moneyTextDanger}>
                      {formatCurrency(netProfit)}
                    </div>
                    {rev > 0 && (
                      <div className={styles.progressContainer}>
                        <div className={styles.progressLabels}>
                          <span>Margin: {marginActual.toFixed(1)}%</span>
                          <span>Target: {marginTarget}%</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div className={progressClass} style={{ width: `${Math.min(Math.max((marginActual / marginTarget) * 100, 0), 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {projects.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>No Projects found. Create your first cost center to start tracking.</td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Loading projects...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
