'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Building, 
  TrendingUp,
  ChevronRight,
  UserCheck,
  XCircle,
  MoreHorizontal,
  X,
  CreditCard,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // New States for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    company: '',
    value: 0,
    source: 'Direct',
    campaignId: ''
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const fetchLeads = () => {
    setLoading(true);
    fetch('/api/crm/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchCampaigns = () => {
    fetch('/api/crm/campaigns')
      .then(res => res.json())
      .then(data => setCampaigns(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchLeads();
    fetchCampaigns();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewLead({ name: '', email: '', company: '', value: 0, source: 'Direct', campaignId: '' });
        fetchLeads();
      }
    } catch (error) {
      console.error('Lead creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToCustomer = async (leadId: string) => {
    if (!confirm('Promote this lead to an official Customer?')) return;
    
    try {
      const res = await fetch('/api/crm/leads/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Promotion failed');
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                         (l.company && l.company.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'NEW': return '#279C5A'; // AKSIA Green
      case 'CONTACTED': return '#3B82F6';
      case 'QUALIFIED': return '#10B981';
      case 'LOST': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing AKSIA Leads Database...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox} style={{ backgroundColor: 'rgba(39, 156, 90, 0.1)' }}>
            <Users size={24} color="#279C5A"/>
          </div>
          <div>
            <h1 className={styles.title}>AKSIA Lead Engine</h1>
            <p className={styles.subtitle}>Institutional tracking of growth opportunities and conversion funnels.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon}/>
            <input 
              type="text" 
              placeholder="Search leads..." 
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
            <Plus size={16}/> New Lead
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
           <div className={styles.tableTitleGroup}>
              <h2 className={styles.panelTitle}>Prospect Pipeline</h2>
              <span className={styles.liveIndicator}>LIVE HUB</span>
           </div>
           <select 
             className={styles.filterStatusSelect}
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
           >
             <option value="ALL">All Status</option>
             <option value="NEW">New</option>
             <option value="CONTACTED">Contacted</option>
             <option value="QUALIFIED">Qualified</option>
             <option value="LOST">Lost</option>
           </select>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>LEAD NAME</th>
              <th>ORGANIZATION</th>
              <th>STATUS</th>
              <th>EST. VALUE</th>
              <th>SOURCE</th>
              <th className={styles.textRight}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => (
              <tr key={lead.id} className={styles.row}>
                <td>
                  <div className={styles.leadInfo}>
                    <span className={styles.leadName}>{lead.name}</span>
                    <div className={styles.leadContact}>
                      <Mail size={12}/> {lead.email || 'N/A'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.companyInfo}>
                    <Building size={14}/> {lead.company || 'Private Entity'}
                  </div>
                </td>
                <td>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: `${getStatusColor(lead.status)}15`, color: getStatusColor(lead.status) }}
                  >
                    {lead.status}
                  </span>
                </td>
                <td>
                  <div className={styles.valueInfo}>
                    <span className={styles.value}>Rp {Number(lead.value).toLocaleString()}</span>
                  </div>
                </td>
                <td>
                  <span className={styles.sourceBadge}>{lead.source || 'Direct'}</span>
                </td>
                <td className={styles.textRight}>
                  <div className={styles.actions}>
                    {lead.status !== 'QUALIFIED' && (
                      <button 
                        className={styles.convertBtn} 
                        title="Promote to Customer"
                        onClick={() => handleConvertToCustomer(lead.id)}
                      >
                        <UserCheck size={16}/>
                      </button>
                    )}
                    <button className={styles.moreBtn}><MoreHorizontal size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyState}>No lead records synchronized.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NEW LEAD MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Capture New Prospect</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input 
                    type="text" 
                    className={styles.input}
                    required
                    placeholder="John Doe"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input 
                    type="email" 
                    className={styles.input}
                    placeholder="john@example.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Organization / Company</label>
                  <input 
                    type="text" 
                    className={styles.input}
                    placeholder="Global Corp"
                    value={newLead.company}
                    onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Potential Value (IDR)</label>
                  <div className={styles.inputWithIcon}>
                    <CreditCard size={16} className={styles.fieldIcon}/>
                    <input 
                      type="number" 
                      className={styles.input}
                      value={newLead.value}
                      onChange={(e) => setNewLead({...newLead, value: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Acquisition Source</label>
                  <select 
                    className={styles.select}
                    value={newLead.source}
                    onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                  >
                    <option value="Direct">Direct Entry</option>
                    <option value="Website">AKSIA Website</option>
                    <option value="Referral">Business Referral</option>
                    <option value="Campaign">Marketing Campaign</option>
                  </select>
                </div>

                {newLead.source === 'Campaign' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Associated Campaign</label>
                    <select 
                      className={styles.select}
                      value={newLead.campaignId}
                      onChange={(e) => setNewLead({...newLead, campaignId: e.target.value})}
                    >
                      <option value="">Select Active Campaign</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Engage Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
