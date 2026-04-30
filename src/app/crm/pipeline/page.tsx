'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  Target, 
  Flag,
  ArrowRight,
  TrendingUp,
  Layout,
  X,
  User,
  CreditCard,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STAGES = [
  { id: 'DISCOVERY', label: 'Discovery', color: '#3B82F6', prob: 10 },
  { id: 'PROPOSAL', label: 'Proposal', color: '#8B5CF6', prob: 35 },
  { id: 'NEGOTIATION', label: 'Negotiation', color: '#F59E0B', prob: 65 },
  { id: 'WON', label: 'Closed Won', color: '#10B981', prob: 100 },
  { id: 'LOST', label: 'Closed Lost', color: '#EF4444', prob: 0 }
];

export default function PipelineBoard() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  
  // Period State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // New States for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState({
    title: '',
    value: 0,
    stage: 'DISCOVERY',
    contactId: '',
    expectedClose: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppRes, contactRes] = await Promise.all([
        fetch(`/api/crm/opportunities?month=${selectedMonth}&year=${selectedYear}`),
        fetch('/api/contacts')
      ]);
      const oppData = await oppRes.json();
      const contactData = await contactRes.json();
      
      setOpportunities(Array.isArray(oppData) ? oppData : []);
      setContacts(Array.isArray(contactData.contacts) ? contactData.contacts : []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const handleCreateOrUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = '/api/crm/opportunities';
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { id: editingId, ...newDeal } : newDeal;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        setNewDeal({ title: '', value: 0, stage: 'DISCOVERY', contactId: '', expectedClose: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Deal operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (deal: any) => {
    setEditingId(deal.id);
    setNewDeal({
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      contactId: deal.contactId || '',
      expectedClose: deal.expectedClose ? new Date(deal.expectedClose).toISOString().split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const updateStage = async (id: string, newStage: string) => {
    const probability = STAGES.find(s => s.id === newStage)?.prob || 0;
    
    try {
      const res = await fetch('/api/crm/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stage: newStage, probability })
      });
      
      if (res.ok) {
        setOpportunities(prev => prev.map(op => 
          op.id === id ? { ...op, stage: newStage, probability } : op
        ));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing AKSIA Pipeline Intelligence...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox} style={{ backgroundColor: 'rgba(39, 156, 90, 0.1)' }}>
            <Layout size={24} color="#279C5A"/>
          </div>
          <div>
            <h1 className={styles.title}>AKSIA Pipeline Board</h1>
            <p className={styles.subtitle}>Institutional stage tracking and weighted revenue projections.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.periodPicker}>
            <select 
              className={styles.periodSelect}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <select 
              className={styles.periodSelect}
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className={styles.btnPrimary} onClick={() => {
            setEditingId(null);
            setNewDeal({ title: '', value: 0, stage: 'DISCOVERY', contactId: '', expectedClose: '' });
            setIsModalOpen(true);
          }}>
            <Plus size={16}/> New Opportunity
          </button>
        </div>
      </div>

      {/* Board Layout */}
      <div className={styles.board}>
        {STAGES.map((stage, idx) => (
          <div key={stage.id} className={styles.column}>
            <div className={styles.columnHeader}>
              <div className={styles.columnTitleGroup}>
                <div className={styles.stageIndicator} style={{ backgroundColor: stage.color }}></div>
                <span className={styles.columnLabel}>{stage.label}</span>
              </div>
              <div className={styles.columnFinancials}>
                 <span className={styles.stageTotalVal}>Rp {opportunities.filter(o => o.stage === stage.id).reduce((sum, o) => sum + o.value, 0).toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.cardsContainer}>
              {opportunities.filter(o => o.stage === stage.id).map(deal => (
                <div key={deal.id} className={styles.card} onClick={() => openEditModal(deal)}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{deal.title}</h3>
                  </div>
                  
                  <div className={styles.cardMain}>
                    <div className={styles.clientInfo}>
                       <span className={styles.cardClient}>{deal.contact?.name || deal.lead?.name || 'Potential Client'}</span>
                    </div>
                    <div className={styles.cardValueRow}>
                      <span className={styles.cardAmountValue}>Rp {deal.value.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.footerMetas}>
                      <div className={styles.confidenceBadge} style={{ 
                        backgroundColor: deal.probability > 70 ? '#D1FAE5' : deal.probability > 40 ? '#FEF3C7' : '#F3F4F6',
                        color: deal.probability > 70 ? '#065F46' : deal.probability > 40 ? '#92400E' : '#4B5563'
                      }}>
                        {deal.probability}% Prob
                      </div>
                      {deal.expectedClose && (
                        <div className={styles.timeBadge}>
                          <Clock size={10}/> {new Date(deal.expectedClose).toLocaleDateString(undefined, {month: 'short', year: '2-digit'})}
                        </div>
                      )}
                    </div>
                    {idx < STAGES.length - 1 && (
                      <button 
                        className={styles.quickNextBtn} 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStage(deal.id, STAGES[idx+1].id);
                        }}
                      >
                        <ArrowRight size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button className={styles.addCardBtn} onClick={() => {
                setEditingId(null);
                setNewDeal({ ...newDeal, stage: stage.id });
                setIsModalOpen(true);
              }}>
                <Plus size={14}/> Add Deal
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NEW/EDIT OPPORTUNITY MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Modify Opportunity' : 'Initiate Opportunity'}</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateDeal}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Deal Title</label>
                  <input 
                    type="text" 
                    className={styles.input}
                    required
                    placeholder="e.g., Enterprise Software Licensing"
                    value={newDeal.title}
                    onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contract Value (IDR)</label>
                  <div className={styles.inputWithIcon}>
                    <CreditCard size={16} className={styles.fieldIcon}/>
                    <input 
                      type="number" 
                      className={styles.input}
                      required
                      value={isNaN(newDeal.value) ? '' : newDeal.value}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setNewDeal({...newDeal, value: isNaN(val) ? 0 : val});
                      }}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className={styles.label} style={{ marginBottom: 0 }}>Associated Contact</label>
                    <button 
                      type="button" 
                      onClick={() => router.push('/contacts/new')} 
                      style={{ fontSize: '11px', color: '#279C5A', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                    >
                      + Quick Create
                    </button>
                  </div>
                  <select 
                    className={styles.select}
                    value={newDeal.contactId}
                    onChange={(e) => setNewDeal({...newDeal, contactId: e.target.value})}
                  >
                    <option value="">Select Contact (Optional)</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Expected Close / Milestone</label>
                  <input 
                    type="date"
                    className={styles.input}
                    value={newDeal.expectedClose}
                    onChange={(e) => setNewDeal({...newDeal, expectedClose: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Pipeline Stage</label>
                  <select 
                    className={styles.select}
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({...newDeal, stage: e.target.value})}
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Syncing...' : editingId ? 'Update Record' : 'Deploy Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
