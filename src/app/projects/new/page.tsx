'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Briefcase, Calendar, Users, 
  Target, BarChart2, CheckCircle
} from 'lucide-react';
import styles from './page.module.css';

export default function NewCostCenter() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    budget: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/cost-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create cost center');
      }
      
      setShowToast(true);
      setTimeout(() => {
        router.push('/projects');
      }, 1500);
      
    } catch (error) {
      console.error(error);
      alert('Error creating cost center');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {showToast && (
        <div className={styles.toast}>
          <CheckCircle size={20} />
          Cost Center Created Successfully!
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}><Briefcase size={28} /> Create Cost Center</h1>
          <p className={styles.pageSubtitle}>Establish a new isolated project or departmental ledger to track margins and budgets natively.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnCancel} onClick={() => router.push('/projects')}>
            Cancel
          </button>
          <button className={styles.btnSave} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Cost Center'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        
        {/* Left Column */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Project Identity</h2>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Cost Center Name</label>
              <input 
                type="text" 
                className={styles.inputField} 
                placeholder="e.g. Marketing Campaign Q4" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className={styles.inputRow}>
              <div>
                <label className={styles.inputLabel}>Project Code / Alias</label>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  placeholder="PRJ-Q4-MKT" 
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className={styles.inputLabel}>Department Tag</label>
                <select className={styles.selectField}>
                  <option>Marketing</option>
                  <option>Information Technology</option>
                  <option>Operations / Manufacturing</option>
                  <option>C-Suite / Executive</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Description</label>
              <textarea className={styles.textareaField} placeholder="Describe the purpose of this project allocation..."></textarea>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Users size={20} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Management & Ownership</h2>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Project Manager</label>
              <select className={styles.selectField}>
                <option>Assign User...</option>
                <option>Siti Kusuma (Marketing VP)</option>
                <option>Budi Santoso (Operations Head)</option>
                <option>Alex Wong (IT Director)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Target size={20} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Financial Budgets</h2>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Expected Expense Budget</label>
              <div className={styles.currencyWrapper}>
                <span className={styles.currencySymbol}>Rp</span>
                <input 
                  type="number" 
                  className={`${styles.inputField} ${styles.currencyField}`} 
                  placeholder="150000000" 
                  value={formData.budget === 0 ? '' : formData.budget}
                  onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Expected Revenue Output</label>
              <div className={styles.currencyWrapper}>
                <span className={styles.currencySymbol}>Rp</span>
                <input type="number" className={`${styles.inputField} ${styles.currencyField}`} placeholder="280000000" />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Target Profit Margin (%)</label>
              <div className={styles.currencyWrapper}>
                <input type="number" className={styles.inputField} placeholder="35" style={{ paddingRight: '40px' }} />
                <span style={{ position: 'absolute', right: '16px', top: '13px', color: '#64748B', fontWeight: 600 }}>%</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Calendar size={20} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Timeline Duration</h2>
            </div>

            <div className={styles.inputRow}>
              <div>
                <label className={styles.inputLabel}>Start Date</label>
                <input type="date" className={styles.inputField} />
              </div>
              <div>
                <label className={styles.inputLabel}>End Date (Optional)</label>
                <input type="date" className={styles.inputField} />
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
