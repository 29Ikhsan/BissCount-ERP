'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  FileCheck,
  UploadCloud,
  X,
  Plus,
  Trash2,
  CalendarDays,
  Store,
  Wallet
} from 'lucide-react';
import styles from './page.module.css';

export default function NewExpenseForm() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    merchant: '',
    date: '',
    reference: '',
    paymentMethod: 'Corporate Card',
    currency: 'USD',
  });

  const [items, setItems] = useState([
    { id: 1, category: 'IT Infrastructure', costCenter: '', description: '', amount: 0, taxRate: 0, whtRate: 0 }
  ]);

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const calcSubtotal = () => items.reduce((acc, item) => acc + (item.amount), 0);
  const calcTax = () => items.reduce((acc, item) => acc + (item.amount * (item.taxRate / 100)), 0);
  const calcWht = () => items.reduce((acc, item) => acc + (item.amount * (item.whtRate / 100)), 0);
  const grandTotal = calcSubtotal() + calcTax() - calcWht();

  // Handlers
  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), category: 'Office Supplies', costCenter: '', description: '', amount: 0, taxRate: 0, whtRate: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async () => {
    if (!formData.merchant || !formData.date) {
      alert("Please fill merchant name and document date before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date: new Date(formData.date).toISOString(),
        merchant: formData.merchant,
        category: items[0]?.category || 'Unknown',
        amount: grandTotal,
        notes: formData.reference
      };

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (res.ok) {
        alert(`Expense request for ${formData.merchant} submitted successfully!`);
        router.push('/expenses');
      } else {
        alert(`Error: ${responseBody.error || 'Failed to record expense'}`);
      }
    } catch (e) {
      alert('Network error connecting to Backend API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Navigation */}
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back to Expenses
        </button>
        <div className={styles.topNavActions}>
          <button className={styles.draftBtn} disabled={isSubmitting}>Save as Draft</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Left Column - Form Details */}
        <div className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Record New Expense</h2>
            <span className={styles.panelBadge}>Unsubmitted</span>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}><Store size={15} /> Merchant & Payment Details</h3>
            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label>Merchant / Vendor Name</label>
                <input type="text" placeholder="e.g. AWS, Starbucks, Delta Airlines" className={styles.inputText} 
                  value={formData.merchant} onChange={e => setFormData({...formData, merchant: e.target.value})} />
              </div>
              <div className={styles.inputGroup}>
                <label>Date of Expense</label>
                <div className={styles.dateWrapper}>
                  <CalendarDays size={14} className={styles.inputIcon} />
                  <input type="date" className={styles.inputDate} 
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Payment Method</label>
                <div className={styles.dateWrapper}>
                  <Wallet size={14} className={styles.inputIcon} />
                  <select className={styles.inputSelect} 
                    value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                    <option>Corporate Card (xxx-1234)</option>
                    <option>Cash (Reimbursement)</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Reference / Receipt No.</label>
                <input type="text" placeholder="#REC-xxx" className={styles.inputText} 
                  value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})}/>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}><FileCheck size={15} /> Expense Categorizations</h3>
            <div className={styles.itemsWrapper}>
              
              <div className={styles.itemsHeader}>
                <div style={{ flex: 1.5 }}>Category (COA)</div>
                <div style={{ flex: 1.5 }}>Description</div>
                <div style={{ flex: 1.5 }}>Cost Center / Proj</div>
                <div style={{ flex: 0.8 }}>Amount</div>
                <div style={{ flex: 0.6 }}>VAT (%)</div>
                <div style={{ flex: 0.6 }}>WHT (%)</div>
                <div style={{ width: '30px' }}></div>
              </div>

              {items.map((item, index) => (
                <div key={item.id} className={styles.itemRow}>
                  <div style={{ flex: 1.5 }}>
                    <select className={styles.itemSelect} value={item.category} onChange={e => handleItemChange(item.id, 'category', e.target.value)}>
                      <option>Travel & Lodging</option>
                      <option>Meals & Entertainment</option>
                      <option>IT Infrastructure</option>
                      <option>Office Supplies</option>
                      <option>Marketing</option>
                      <option>Rent / Utilities</option>
                    </select>
                  </div>
                  <div style={{ flex: 1.5 }}>
                    <input type="text" className={styles.itemInput} placeholder="What was this for?" 
                           value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} />
                  </div>
                  <div style={{ flex: 1.5 }}>
                    <select className={styles.itemSelect} value={item.costCenter} onChange={e => handleItemChange(item.id, 'costCenter', e.target.value)}>
                      <option value="">-- None --</option>
                      <option>Cabang Bali Expansion</option>
                      <option>Marketing Campaign Q1</option>
                      <option>IT Infrastructure</option>
                    </select>
                  </div>
                  <div style={{ flex: 0.8 }}>
                    <input type="number" className={styles.itemInput} placeholder="0.00" 
                           value={item.amount === 0 ? '' : item.amount} onChange={e => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 0.6 }}>
                    <input type="number" className={styles.itemInput} placeholder="0" 
                           value={item.taxRate === 0 ? '' : item.taxRate} onChange={e => handleItemChange(item.id, 'taxRate', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 0.6 }}>
                    <input type="number" className={styles.itemInput} placeholder="0" 
                           value={item.whtRate === 0 ? '' : item.whtRate} onChange={e => handleItemChange(item.id, 'whtRate', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ width: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className={styles.deleteBtn} onClick={() => handleRemoveItem(item.id)} disabled={items.length === 1}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className={styles.addLineBtn} onClick={handleAddItem}>
              <Plus size={14} /> Add Line Item
            </button>
          </div>

        </div>

        {/* Right Column - Summary & Overrides */}
        <div className={styles.sidePanel}>
          
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Expense Summary</h3>
            
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${calcSubtotal().toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Estimated Tax (VAT)</span>
              <span>${calcTax().toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>WHT Deduction (PPh)</span>
              <span style={{ color: '#DC2626' }}>-${calcWht().toFixed(2)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total Request (Net)</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.receiptCard}>
            <h3 className={styles.receiptTitle}>Attachments & Receipts</h3>
            <p className={styles.receiptDesc}>Attach your physical or digital receipts to ensure compliance with company policy.</p>
            
            <div className={styles.dropZone}>
              <UploadCloud size={28} className={styles.uploadIcon} />
              <div className={styles.uploadMain}>Click to browse or drag & drop</div>
              <div className={styles.uploadSub}>PDF, JPG, PNG (Max 10MB)</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
