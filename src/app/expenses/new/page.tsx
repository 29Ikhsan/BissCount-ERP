'use client';

import React, { useState, useEffect } from 'react';
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
  Wallet,
  Search,
  BookOpen
} from 'lucide-react';
import styles from './page.module.css';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

export default function NewExpenseForm() {
  const router = useRouter();
  const { formatCurrency } = useLanguage();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    merchant: '',
    contactId: '',
    date: '',
    reference: '',
    paymentMethod: 'CASH',
    currency: 'IDR',
  });

  const [items, setItems] = useState<any[]>([
    { 
      id: 1, accountId: '', categoryName: '', description: '', amount: 0, 
      taxId: '', taxRate: 0, whtId: '', whtRate: 0,
      taxObjectCode: '', tkuId: '0000000000000000000000', workerStatus: 'Resident',
      ptkpStatus: 'TK/0', passportNo: '', facilityCap: 'N/A'
    }
  ]);

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [masterData, setMasterData] = useState({ accounts: [] as any[], taxes: [] as any[] });

  const taxObjectCodes = [
    { code: '24-101-01', name: 'Dividen' },
    { code: '24-104-05', name: 'Jasa Aktuaris' },
    { code: '24-104-19', name: 'Jasa Profesional / Tenaga Ahli' },
    { code: '24-104-20', name: 'Jasa Teknik / Manajemen' },
    { code: '28-409-01', name: 'Sewa Tanah/Bangunan' }
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [ccRes, accRes, taxRes, conRes] = await Promise.all([
          fetch('/api/cost-centers'),
          fetch('/api/accounts'),
          fetch('/api/taxes'),
          fetch('/api/contacts')
        ]);
        const ccData = await ccRes.json();
        const accData = await accRes.json();
        const taxData = await taxRes.json();
        const conData = await conRes.json();

        if (ccData.costCenters) setCostCenters(ccData.costCenters);
        if (accData.accounts) setMasterData(prev => ({ ...prev, accounts: accData.accounts }));
        if (taxData.taxes) setMasterData(prev => ({ ...prev, taxes: taxData.taxes }));
        if (conData.contacts) setContacts(conData.contacts);
      } catch (e) {
        console.error('Failed to load expense master data');
      }
    }
    loadData();
  }, []);

  // Calculations
  const calcSubtotal = () => items.reduce((acc, item) => acc + (item.amount), 0);
  const calcTax = () => items.reduce((acc, item) => acc + (item.amount * (item.taxRate / 100)), 0);
  const calcWht = () => items.reduce((acc, item) => acc + (item.amount * (item.whtRate / 100)), 0);
  const grandTotalValue = calcSubtotal() + calcTax() - calcWht();

  // Handlers
  const handleAddItem = () => {
    setItems([...items, { 
      id: Date.now(), accountId: '', categoryName: '', description: '', amount: 0, 
      taxId: '', taxRate: 0, whtId: '', whtRate: 0,
      taxObjectCode: '', tkuId: '0000000000000000000000', workerStatus: 'Resident',
      ptkpStatus: 'TK/0', passportNo: '', facilityCap: 'N/A'
    }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'accountId') {
          const acc = masterData.accounts.find(a => a.id === value);
          return { ...item, accountId: value, categoryName: acc?.name || '' };
        }
        if (field === 'taxId') {
          const t = masterData.taxes.find(tax => tax.id === value);
          return { ...item, taxId: value, taxRate: t?.rate || 0 };
        }
        if (field === 'whtId') {
          const t = masterData.taxes.find(tax => tax.id === value);
          return { ...item, whtId: value, whtRate: t?.rate || 0 };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (!formData.merchant || !formData.date) {
      showToast("Please fill merchant name and document date before submitting.", 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date: new Date(formData.date).toISOString(),
        merchant: formData.merchant,
        contactId: formData.contactId || undefined,
        items: items,
        paymentMethod: formData.paymentMethod,
        notes: formData.reference,
        costCenterId: items[0]?.costCenter || undefined
      };

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (res.ok) {
        const msg = responseBody.expense.referenceCode 
          ? `Expense submitted! Reference: ${responseBody.expense.referenceCode}`
          : `Expense request for ${formData.merchant} submitted successfully!`;
        showToast(msg, 'success');
        // If bank transfer, maybe show a quick modal? For now, toast is fine.
        setTimeout(() => router.push('/expenses'), 3000);
      } else {
        showToast(`Error: ${responseBody.error || 'Failed to record expense'}`, 'error');
      }
    } catch (e) {
      showToast('Network error connecting to Backend API.', 'error');
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
                <div className={styles.dateWrapper}>
                  <Search size={14} className={styles.inputIcon} />
                  <select 
                    className={styles.inputSelect} 
                    value={formData.contactId} 
                    onChange={e => {
                      const con = contacts.find(c => c.id === e.target.value);
                      setFormData({...formData, contactId: e.target.value, merchant: con?.name || ''});
                    }}
                  >
                    <option value="">-- New / One-time Vendor --</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.idType}: {c.taxId || c.idNumber})</option>
                    ))}
                  </select>
                </div>
                {formData.contactId === '' && (
                  <input 
                    type="text" 
                    placeholder="Enter Custom Merchant Name" 
                    className={styles.inputText} 
                    style={{ marginTop: '8px' }}
                    value={formData.merchant} 
                    onChange={e => setFormData({...formData, merchant: e.target.value})} 
                  />
                )}
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
                    <option value="CASH">Cash (Reimbursement)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (Vendor/ATK)</option>
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
                <div style={{ flex: 1.2 }}>Category (COA)</div>
                <div style={{ flex: 1.2 }}>Description</div>
                <div style={{ flex: 0.6 }}>Amount</div>
                <div style={{ flex: 0.4 }}>VAT%</div>
                <div style={{ flex: 0.4 }}>WHT%</div>
                <div style={{ flex: 1.2 }}>Tax Object (Unifikasi)</div>
                <div style={{ width: '30px' }}></div>
              </div>

              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                <div className={styles.itemRow}>
                  <div style={{ flex: 1.2 }}>
                    <select className={styles.itemSelect} value={item.accountId} onChange={e => handleItemChange(item.id, 'accountId', e.target.value)}>
                      <option value="">-- Select Account --</option>
                      {masterData.accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1.2 }}>
                    <input type="text" className={styles.itemInput} placeholder="Description..." 
                           value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} />
                  </div>
                  <div style={{ flex: 0.6 }}>
                    <input type="number" className={styles.itemInput} placeholder="0.00" 
                           value={item.amount === 0 ? '' : item.amount} onChange={e => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 0.4 }}>
                    <input type="number" step="0.1" className={styles.itemInput} placeholder="0" list="vat-rates"
                           value={item.taxRate} onChange={e => handleItemChange(item.id, 'taxRate', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 0.4 }}>
                    <input type="number" step="0.1" className={styles.itemInput} placeholder="0" list="wht-rates"
                           value={item.whtRate} onChange={e => handleItemChange(item.id, 'whtRate', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 1.2 }}>
                    <select 
                      className={styles.itemSelect} 
                      value={item.taxObjectCode || ''} 
                      onChange={e => handleItemChange(item.id, 'taxObjectCode', e.target.value)}
                      disabled={item.whtRate === 0}
                    >
                      <option value="">-- No WHT Code --</option>
                      {taxObjectCodes.map(code => (
                        <option key={code.code} value={code.code}>{code.code} - {code.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className={styles.deleteBtn} onClick={() => handleRemoveItem(item.id)} disabled={items.length === 1}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {item.whtRate > 0 && (
                  <div className={styles.whtDetailRow} style={{ display: 'flex', gap: '8px', padding: '0 12px 12px', background: '#F8FAFC', borderRadius: '0 0 8px 8px', marginTop: '-8px', marginBottom: '8px', border: '1px solid #E2E8F0', borderTop: 'none' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>STATUS PEGAWAI</label>
                      <select className={styles.itemSelect} style={{ padding: '4px' }} value={item.workerStatus} onChange={e => handleItemChange(item.id, 'workerStatus', e.target.value)}>
                        <option value="Resident">Resident (DN)</option>
                        <option value="Non-Resident">Non-Resident (LN)</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>ID TKU (22 DIGIT)</label>
                      <input type="text" className={styles.itemInput} style={{ padding: '4px' }} value={item.tkuId} onChange={e => handleItemChange(item.id, 'tkuId', e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>FASILITAS</label>
                      <input type="text" className={styles.itemInput} style={{ padding: '4px' }} value={item.facilityCap} onChange={e => handleItemChange(item.id, 'facilityCap', e.target.value)} />
                    </div>
                  </div>
                )}
                </React.Fragment>
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
              <span>{formatCurrency(calcSubtotal())}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Estimated Tax (VAT)</span>
              <span>{formatCurrency(calcTax())}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>WHT Deduction (PPh)</span>
              <span style={{ color: '#DC2626' }}>-{formatCurrency(calcWht())}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total Request (Net)</span>
              <span>{formatCurrency(grandTotalValue)}</span>
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
