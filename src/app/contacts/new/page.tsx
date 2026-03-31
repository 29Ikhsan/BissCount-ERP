'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, User, Camera, Mail, Phone, MapPin, 
  CreditCard, Briefcase, Globe, CheckCircle
} from 'lucide-react';
import styles from './page.module.css';

export default function NewContact() {
  const router = useRouter();
  const [contactType, setContactType] = useState('COMPANY'); // COMPANY, INDIVIDUAL
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    role: 'Customer', // Customer, Vendor, Employee
    currency: 'USD',
    paymentTerms: 'Due on Receipt',
    address: '',
    city: '',
    postalCode: '',
    country: 'United States'
  });

  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contactType,
          ...formData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create contact');
      }
      
      setShowToast(true);
      setTimeout(() => {
        router.push('/contacts');
      }, 1500);
      
    } catch (error) {
      console.error(error);
      alert('Error saving contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {showToast && (
        <div className={styles.toast}>
          <CheckCircle size={20} />
          Contact saved successfully! Redirecting...
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Add New Contact</h1>
          <p className={styles.pageSubtitle}>Create a new Client, Vendor, or Employee record in your CRM.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnCancel} onClick={() => router.push('/contacts')}>
            Cancel
          </button>
          <button className={styles.btnSave} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* Left Col: Principal Information */}
        <div className={styles.leftCol}>
          
          {/* Type Selector */}
          <div className={styles.typeSelector}>
            <button 
              type="button" 
              className={`${styles.typeBtn} ${contactType === 'COMPANY' ? styles.typeBtnActive : ''}`}
              onClick={() => setContactType('COMPANY')}
            >
              <Building2 size={24} />
              Company / Vendor
            </button>
            <button 
              type="button" 
              className={`${styles.typeBtn} ${contactType === 'INDIVIDUAL' ? styles.typeBtnActive : ''}`}
              onClick={() => setContactType('INDIVIDUAL')}
            >
              <User size={24} />
              Individual / Freelancer
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Briefcase className={styles.cardIcon} size={20} />
              <h2 className={styles.cardTitle}>General Information</h2>
            </div>
            
            <div className={styles.avatarSection}>
              <div className={styles.avatarCircle}>
                <Camera size={32} />
              </div>
              <span style={{ fontSize: '0.875rem', color: '#64748B' }}>Upload Logo/Photo</span>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>{contactType === 'COMPANY' ? 'Company Name' : 'Full Name'}</label>
              <input 
                type="text" 
                className={styles.inputField} 
                placeholder={contactType === 'COMPANY' ? 'e.g. Acme Corp' : 'e.g. John Doe'} 
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required 
              />
            </div>

            <div className={styles.inputRow}>
              <div>
                <label className={styles.inputLabel}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94A3B8' }} />
                  <input 
                    type="email" 
                    className={styles.inputField} 
                    style={{ paddingLeft: '40px' }} 
                    placeholder="contact@example.com" 
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={styles.inputLabel}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94A3B8' }} />
                  <input 
                    type="tel" 
                    className={styles.inputField} 
                    style={{ paddingLeft: '40px' }} 
                    placeholder="+1 (555) 000-0000" 
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Website</label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94A3B8' }} />
                <input 
                  type="url" 
                  className={styles.inputField} 
                  style={{ paddingLeft: '40px' }} 
                  placeholder="https://www.example.com" 
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Operations & Billing */}
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <CreditCard className={styles.cardIcon} size={20} />
              <h2 className={styles.cardTitle}>Billing & Financial Terms</h2>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Primary Role</label>
              <select 
                className={styles.selectField}
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
              >
                <option value="Customer">Customer (Accounts Receivable)</option>
                <option value="Vendor">Vendor (Accounts Payable)</option>
                <option value="Employee">Employee (Payroll)</option>
                <option value="Both">Both</option>
              </select>
            </div>

            <div className={styles.inputRow}>
              <div>
                <label className={styles.inputLabel}>Default Currency</label>
                <select 
                  className={styles.selectField}
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div>
                <label className={styles.inputLabel}>Payment Terms</label>
                <select 
                  className={styles.selectField}
                  value={formData.paymentTerms}
                  onChange={(e) => handleChange('paymentTerms', e.target.value)}
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <MapPin className={styles.cardIcon} size={20} />
              <h2 className={styles.cardTitle}>Address & Shipping</h2>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Street Address</label>
              <textarea 
                className={styles.textareaField} 
                placeholder="123 Business Avenue, Suite 100"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              ></textarea>
            </div>

            <div className={styles.inputRow}>
              <div>
                <label className={styles.inputLabel}>City</label>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  placeholder="City Name"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
              <div>
                <label className={styles.inputLabel}>Postal / Zip Code</label>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  placeholder="Postal Code" 
                  value={formData.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Country</label>
              <select 
                className={styles.selectField}
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
              >
                <option value="United States">United States</option>
                <option value="Indonesia">Indonesia</option>
                <option value="Singapore">Singapore</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
