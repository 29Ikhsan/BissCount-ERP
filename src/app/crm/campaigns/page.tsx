'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Megaphone, 
  Plus, 
  TrendingUp, 
  Target, 
  DollarSign, 
  PieChart, 
  Calendar, 
  ChevronRight,
  MoreHorizontal,
  X,
  ArrowLeft,
  Activity,
  Layers,
  Globe
} from 'lucide-react';
import Link from 'next/link';

export default function CampaignHub() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'GOOGLE_ADS',
    budget: 0,
    actualSpend: 0,
    status: 'ACTIVE'
  });

  const fetchCampaigns = () => {
    setLoading(true);
    fetch('/api/crm/campaigns')
      .then(res => res.json())
      .then(data => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewCampaign({ name: '', type: 'GOOGLE_ADS', budget: 0, actualSpend: 0, status: 'ACTIVE' });
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Campaign creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = campaigns.reduce((acc, c) => ({
    spend: acc.spend + c.actualSpend,
    leads: acc.leads + (c.leadCount || 0),
    revenue: acc.revenue + (c.wonValue || 0)
  }), { spend: 0, leads: 0, revenue: 0 });

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing AKSIA Marketing Engine...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/crm" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Marketing ROI Command</h1>
            <p className={styles.subtitle}>Strategic attribution of marketing spend to closed-won revenue.</p>
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
          <Plus size={16}/> New Campaign
        </button>
      </div>

      {/* Metrics Row */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total Ad Spend</div>
          <div className={styles.metricValue}>Rp {totals.spend.toLocaleString()}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Leads Generated</div>
          <div className={styles.metricValue}>{totals.leads}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Won Revenue</div>
          <div className={styles.metricValue}>Rp {totals.revenue.toLocaleString()}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Overall ROI</div>
          <div className={styles.metricValue} style={{ color: '#279C5A' }}>
            {totals.spend > 0 ? (totals.revenue / totals.spend * 1).toFixed(2) : 0}x
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className={styles.campaignList}>
        <div className={styles.tableHeader}>
           <h2 className={styles.tableTitle}>Active Multi-Channel Campaigns</h2>
           <div className={styles.tableActions}>
              <Activity size={16}/> <span className={styles.liveIndicator}>LIVE TRACKING</span>
           </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>CAMPAIGN & CHANNEL</th>
              <th>STATUS</th>
              <th>BUDGET UTILIZATION</th>
              <th>LEADS</th>
              <th>WON REVENUE</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id}>
                <td>
                  <span className={styles.campaignName}>{c.name}</span>
                  <span className={styles.campaignType}>{c.type}</span>
                </td>
                <td>
                  <span className={styles.statusBadge} style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                    {c.status}
                  </span>
                </td>
                <td>
                  <div className={styles.utilizationInfo}>
                    <div className={styles.budgetLabel}>
                      Rp {c.actualSpend.toLocaleString()} / Rp {c.budget.toLocaleString()}
                    </div>
                    <div className={styles.progressBarContainer}>
                      <div className={styles.progressBar} style={{ width: `${Math.min((c.actualSpend / c.budget) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </td>
                <td>{c.leadCount || 0}</td>
                <td>Rp {c.wonValue?.toLocaleString() || 0}</td>
                <td><span className={styles.roiBadge}>{c.roi}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Launch Strategy</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Campaign Name</label>
                <input 
                  type="text" 
                  className={styles.input}
                  required
                  placeholder="e.g., Google Ads - Jakarta Real Estate"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Channel Type</label>
                <select 
                  className={styles.select}
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                >
                  <option value="GOOGLE_ADS">Google Ads</option>
                  <option value="FACEBOOK_ADS">Facebook Ads</option>
                  <option value="LINKEDIN_ADS">LinkedIn Ads</option>
                  <option value="EMAIL_MARKETING">Email Marketing</option>
                  <option value="DIRECT_OUTREACH">Direct Outreach</option>
                  <option value="OTHERS">Institutional/Others</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Target Budget (IDR)</label>
                <input 
                  type="number" 
                  className={styles.input}
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({...newCampaign, budget: parseInt(e.target.value)})}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Actual Spend (IDR)</label>
                <input 
                  type="number" 
                  className={styles.input}
                  value={newCampaign.actualSpend}
                  onChange={(e) => setNewCampaign({...newCampaign, actualSpend: parseInt(e.target.value)})}
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="submit" className={styles.btnPrimary} style={{ width: '100%', marginTop: '20px' }}>
                  {isSubmitting ? 'Launching...' : 'Activate Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
