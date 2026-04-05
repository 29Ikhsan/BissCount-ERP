'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Target 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewLeadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    value: '',
    source: 'Google',
    status: 'NEW'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push('/crm/leads');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/crm/leads" className={styles.backBtn}>
          <ArrowLeft size={16}/> Back to Leads
        </Link>
        <h1 className={styles.title}>Capture New Lead</h1>
      </div>

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          {/* Contact Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact Information</h2>
            
            <div className={styles.inputGroup}>
              <label><User size={14}/> Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Alex Johnson"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className={styles.inputGroup}>
              <label><Mail size={14}/> Email Address</label>
              <input 
                type="email" 
                placeholder="alex@company.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className={styles.inputGroup}>
              <label><Phone size={14}/> Phone Number</label>
              <input 
                type="tel" 
                placeholder="+62 812..."
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          {/* Business Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Lead Details</h2>

            <div className={styles.inputGroup}>
              <label><Building size={14}/> Company Name</label>
              <input 
                type="text" 
                placeholder="Startup X"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            </div>

            <div className={styles.inputGroup}>
              <label><Target size={14}/> Estimated Deal Value</label>
              <input 
                type="number" 
                placeholder="50,000,000"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
              />
            </div>

            <div className={styles.inputGroup}>
              <label><Target size={14}/> Lead Source</label>
              <select 
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
              >
                <option value="Google">Google Search</option>
                <option value="Referral">Customer Referral</option>
                <option value="Social">Social Media</option>
                <option value="Campaign">Marketing Campaign</option>
                <option value="Direct">Direct Outreach</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <Link href="/crm/leads" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.saveBtn} disabled={submitting}>
            <Save size={16}/> {submitting ? 'Capturing...' : 'Save Lead'}
          </button>
        </div>
      </form>
    </div>
  );
}
