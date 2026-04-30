'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  FileText,
  Search,
  Package
} from 'lucide-react';
import styles from './page.module.css';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Tooltip from '@/components/common/Tooltip';

function DocumentFormBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatCurrency } = useLanguage();
  const { showToast } = useToast();
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const [docType, setDocType] = useState('QUOTATION');
  const [discount, setDiscount] = useState(0);
  const [wht, setWht] = useState(0);
  const [whtRate, setWhtRate] = useState(0);
  const [downpayment, setDownpayment] = useState(0);
  const [dpRate, setDpRate] = useState(0);
  const [isVatTaxable, setIsVatTaxable] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoEmail, setAutoEmail] = useState(true); // Default to on for efficiency

  useEffect(() => {
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    if (type) setDocType(type.toUpperCase());
    if (id) {
      setIsEditMode(true);
      setEditId(id);
    }
  }, [searchParams]);

  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [masterData, setMasterData] = useState({ products: [] as any[], taxes: [] as any[] });
  const [selectedCostCenter, setSelectedCostCenter] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [contactsRes, ccRes, prodRes, taxRes, settingsRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/cost-centers'),
          fetch('/api/inventory'),
          fetch('/api/taxes'),
          fetch('/api/settings')
        ]);
        const contactsData = await contactsRes.json();
        const ccData = await ccRes.json();
        const prodData = await prodRes.json();
        const taxData = await taxRes.json();
        const settingsData = await settingsRes.json();
        
        if (settingsData.tenant && settingsData.tenant.logoUrl) {
          setOrgLogo(settingsData.tenant.logoUrl);
        }
        
        if (contactsData.contacts) {
          setContacts(contactsData.contacts.filter((c: any) => c.type === 'Customer' || c.type === 'Both'));
        }
        if (ccData.costCenters) {
          setCostCenters(ccData.costCenters);
        }
        setMasterData({
          products: prodData.products || [],
          taxes: taxData.taxes || []
        });
      } catch (e) {
        console.error('Failed to load form data');
      }
    }
    loadData();
  }, []);

  // Fetch data for Edit Mode
  useEffect(() => {
    if (isEditMode && editId) {
      async function fetchDocument() {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/invoices/${editId}`);
          const data = await res.json();
          if (data.invoice) {
             const inv = data.invoice;
             setDocType(inv.status === 'QUOTATION' ? 'QUOTATION' : 'INVOICE');
             setInvoiceNo(inv.invoiceNo || '');
             setClientName(inv.clientName);
             setClientId(inv.contactId || 'manual');
             setSelectedCostCenter(inv.costCenterId || '');
             setDate(new Date(inv.date).toISOString().split('T')[0]);
             setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
             setDiscount(inv.discountAmount || 0);
             setIsVatTaxable(inv.isVatTaxable || false);
             setWht(inv.whtAmount || 0);
             setWhtRate(inv.whtRate || 0);
             setAutoEmail(inv.autoEmail || false);
             
             if (inv.items && inv.items.length > 0) {
               setItems(inv.items.map((item: any) => ({
                 id: item.id,
                 productId: item.productId || '',
                 description: item.description,
                 quantity: item.quantity,
                 unitPrice: item.unitPrice,
                 taxId: item.taxId || '',
                 taxRate: item.taxRate || 0,
                 total: item.total
               })));
             }
          }
        } catch (e) {
          showToast('Failed to load document for editing.', 'error');
        } finally {
          setIsLoading(false);
        }
      }
      fetchDocument();
    }
  }, [isEditMode, editId]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<any[]>([
    { id: 1, productId: '', description: '', quantity: 1, unitPrice: 0, taxId: '', taxRate: 0, total: 0 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), productId: '', description: '', quantity: 1, unitPrice: 0, taxId: '', taxRate: 0, total: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const product = masterData.products.find(p => p.id === value);
          return {
            ...item,
            productId: value,
            description: product?.name || '',
            unitPrice: product?.price || 0,
            taxId: product?.taxId || '',
            taxRate: product?.tax?.rate || 0
          };
        }
        if (field === 'taxRate') {
          return { ...item, taxRate: Number(value) || 0, taxId: '' };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  
  const calculateTax = () => {
    if (!isVatTaxable) return 0;
    return items.reduce((sum, item) => {
      const itemTaxBase = item.unitPrice * (11/12);
      return sum + (item.quantity * itemTaxBase * (item.taxRate / 100));
    }, 0);
  };

  const dpp = subtotal - discount;
  const vat = calculateTax();
  const grandTotal = dpp + vat - wht;
  const balanceDue = grandTotal - downpayment;

  // Helpers for WHT and DP based on percentage
  useEffect(() => {
    if (whtRate > 0) {
      setWht(dpp * (whtRate / 100));
    }
  }, [whtRate, dpp]);

  useEffect(() => {
    if (dpRate > 0) {
      setDownpayment(grandTotal * (dpRate / 100));
    }
  }, [dpRate, grandTotal]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        clientName: clientName || (clientId === 'manual' ? 'Walk-in Customer' : 'Unknown'),
        contactId: clientId && clientId !== 'manual' ? clientId : undefined,
        costCenterId: selectedCostCenter || undefined,
        date: new Date(date).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        invoiceNo: invoiceNo || undefined, // Send to API if present
        items,
        discountAmount: discount,
        isVatTaxable: isVatTaxable,
        whtAmount: wht,
        whtRate: whtRate,
        autoEmail: autoEmail
      };

      const res = await fetch(isEditMode ? `/api/invoices/${editId}` : '/api/invoices', {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (res.ok) {
        showToast(`${docType} ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
        router.push('/invoices');
      } else {
        showToast(`Error: ${responseBody.error || 'Failed to generate document'}`, 'error');
      }
    } catch (e) {
      showToast('Network error connecting to Backend API.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Banner */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <button className={styles.backBtn} onClick={() => router.push('/invoices')}>
             <ArrowLeft size={16} /> Back to Hub
          </button>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} disabled={isSubmitting}><Save size={16} /> Save Draft</button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={isSubmitting}>
            <Send size={16} /> {isSubmitting ? 'Saving...' : `Generate ${docType}`}
          </button>
        </div>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          {orgLogo && (
            <img src={orgLogo} alt="Logo" style={{ height: '48px', objectFit: 'contain', marginRight: '16px' }} />
          )}
          <div className={styles.docIconWrap}>
            <FileText size={24} color="#0F3B8C" />
          </div>
          <div>
            <h1 className={styles.formTitle}>{isEditMode ? 'Edit' : 'Create New'} {docType.replace('_', ' ')}</h1>
            <p className={styles.formSubtitle}>
              {isEditMode 
                ? 'Perbarui detail dokumen Anda di bawah ini untuk memperbaiki kesalahan.' 
                : 'Masukkan detail klien dan transaksi untuk merekam dokumen ini secara resmi.'}
            </p>
          </div>
        </div>

        {/* Global Details */}
        <div className={styles.splitGrid}>
           <div className={styles.inputGroup}>
             <label>Document Type</label>
             <select 
               className={styles.inputSelect} 
               value={docType} 
               onChange={(e) => setDocType(e.target.value)}
             >
               <option value="QUOTATION">Quotation / Estimate</option>
               <option value="SALES_ORDERS">Sales Order</option>
               <option value="DELIVERIES">Delivery Note</option>
               <option value="INVOICES">Sales Invoice</option>
             </select>
           </div>
           
           <div className={styles.inputGroup}>
             <label>Project / Cost Center</label>
             <select 
               className={styles.inputSelect}
               value={selectedCostCenter}
               onChange={(e) => setSelectedCostCenter(e.target.value)}
             >
               <option value="">-- No Tag (General) --</option>
               {costCenters.map(cc => (
                 <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
               ))}
             </select>
           </div>
           
           <div className={styles.inputGroup}>
             <label>Client / Customer</label>
             <select 
               className={styles.inputSelect}
               value={clientId}
               onChange={(e) => {
                 setClientId(e.target.value);
                 const selected = contacts.find(c => c.id === e.target.value);
                 if (selected) setClientName(selected.name);
                 else if (e.target.value === 'manual') setClientName('Walk-in Customer');
                 else setClientName('');
               }}
             >
               <option value="">-- Select Client --</option>
               {contacts.map(c => (
                 <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
               ))}
               <option value="manual">+ Walk-in Customer (Unregistered)</option>
             </select>
           </div>

           <div className={styles.inputGroup}>
             <label>VAT Status</label>
             <select 
               className={styles.inputSelect}
               style={{ border: isVatTaxable ? '2px solid #0EA5E9' : '1px solid #E5E7EB', fontWeight: isVatTaxable ? 700 : 400 }}
               value={isVatTaxable ? 'TAXABLE' : 'NON_TAXABLE'}
               onChange={(e) => setIsVatTaxable(e.target.value === 'TAXABLE')}
             >
               <option value="NON_TAXABLE">Non-Taxable (No VAT)</option>
               <option value="TAXABLE">VAT Taxable (Indo Gross-up 11/12)</option>
             </select>
           </div>
        </div>

         <div style={{ marginBottom: '24px', backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '12px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              id="autoEmail" 
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              checked={autoEmail} 
              onChange={(e) => setAutoEmail(e.target.checked)} 
            />
            <label htmlFor="autoEmail" style={{ fontSize: '14px', fontWeight: 700, color: '#166534', cursor: 'pointer' }}>
               Kirim invoice ke email klien secara otomatis setelah disimpan (Automated Dispatch) 📧⚡
            </label>
         </div>

        <div className={styles.splitGridTriple}>
           <div className={styles.inputGroup}>
             <label>Document Date</label>
             <input type="date" className={styles.inputText} value={date} onChange={(e) => setDate(e.target.value)} />
           </div>
           <div className={styles.inputGroup}>
             <label>Valid Until / Due Date</label>
             <input type="date" className={styles.inputText} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
           </div>
            <div className={styles.inputGroup}>
              <label>Reference # (ID)</label>
              <input 
                type="text" 
                className={styles.inputText} 
                placeholder="e.g. INV-2026-001" 
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </div>
        </div>

        <hr className={styles.divider} />

        {/* Grid Area */}
        <h3 className={styles.sectionTitle}>Line Items</h3>
        <table className={styles.itemTable}>
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Description</th>
              <th style={{ width: '10%' }}>Qty</th>
              <th style={{ width: '15%' }}>Unit Price</th>
              {isVatTaxable && <th style={{ width: '15%', color: '#0EA5E9' }}>Tax Base (DPP)</th>}
              <th style={{ width: '10%' }}>Tax (%)</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Amount</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td>
                  <select 
                    className={styles.gridInput} 
                    value={item.productId} 
                    onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                  >
                    <option value="">-- Manual Entry --</option>
                    {masterData.products.map(p => (
                      <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                    ))}
                  </select>
                  {item.productId === '' && (
                    <input 
                      type="text" 
                      className={styles.gridInput} 
                      style={{ marginTop: '4px' }}
                      placeholder="Manual description..." 
                      value={item.description} 
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} 
                    />
                  )}
                </td>
                <td>
                  <input type="number" min="1" className={styles.gridInput} value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} />
                </td>
                <td>
                  <input type="number" min="0" step="1" className={styles.gridInput} value={item.unitPrice === 0 ? '' : item.unitPrice} placeholder="0" onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))} />
                </td>
                {isVatTaxable && (
                  <td style={{ verticalAlign: 'middle', fontSize: '0.85rem', color: '#0EA5E9', fontWeight: 600 }}>
                    {formatCurrency(item.unitPrice * (11/12))}
                  </td>
                )}
                <td style={{ opacity: isVatTaxable ? 1 : 0.4 }}>
                  <input 
                    type="number" 
                    step="0.01"
                    list="tax-options"
                    disabled={!isVatTaxable}
                    className={styles.gridInput} 
                    style={{ backgroundColor: !isVatTaxable ? '#f3f4f6' : 'white' }}
                    value={isVatTaxable ? item.taxRate : 0} 
                    onChange={(e) => handleItemChange(item.id, 'taxRate', e.target.value)}
                    placeholder="0"
                  />
                  <datalist id="tax-options">
                    <option value="0">Zero (0%)</option>
                    <option value="11">PPN (11%)</option>
                  </datalist>
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 600 }}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <button className={styles.deleteBtn} onClick={() => handleRemoveItem(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className={styles.addBtn} onClick={handleAddItem}>
          <Plus size={14} /> Add Line Item
        </button>

        <hr className={styles.divider} />

        {/* Calculation Area */}
        <div className={styles.totalsSection}>
          <div className={styles.notesArea}>
            <div className={styles.inputGroup}>
              <label>Customer Notes & Terms</label>
              <textarea 
                className={styles.textArea} 
                placeholder="Enter special instructions or payment terms here..."
                rows={4}
              ></textarea>
            </div>
          </div>
          
          <div className={styles.calcArea}>
            <div className={styles.calcRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.calcRow} style={{ alignItems: 'center' }}>
              <span>Commercial Discount <Tooltip content="Penghitungan potongan harga sebelum pengenaan pajak (VAT)." /></span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#EF4444', fontWeight: 600 }}>-Rp</span>
                <input 
                  type="number" 
                  style={{ width: '70px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', fontSize: '0.8rem', padding: '2px 6px' }} 
                  value={discount === 0 ? '' : discount} 
                  placeholder="0"
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className={styles.calcRow} style={{ color: '#0F3B8C', fontWeight: 600 }}>
              <span>Tax Base (DPP / Harga for Tax) <Tooltip content="Dasar Pengenaan Pajak (Total - Discount). Nilai ini yang menjadi basis perhitungan PPN." /></span>
              <span>{formatCurrency(dpp)}</span>
            </div>
            <div className={styles.calcRow} style={{ color: isVatTaxable ? '#6B7280' : '#475569', opacity: isVatTaxable ? 0.6 : 1 }}>
              <span>Value Added Tax (VAT) <Tooltip content="Pajak Pertambahan Nilai (PPN) sebesar 11% yang dikenakan pada penyerahan barang/jasa." /></span>
              <span>{formatCurrency(vat)}</span>
            </div>
            <div className={styles.calcRow} style={{ alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <span>Withholding Tax (WHT) <Tooltip content="Potongan pajak penghasilan (misal PPh 23) yang dipotong langsung oleh pembeli." /></span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="number" 
                  style={{ width: '45px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', fontSize: '0.75rem', padding: '2px' }} 
                  value={whtRate === 0 ? '' : whtRate} 
                  placeholder="%"
                  onChange={(e) => setWhtRate(parseFloat(e.target.value) || 0)} 
                />
                <span style={{ color: '#EF4444', fontWeight: 600 }}>-Rp</span>
                <input 
                  type="number" 
                  style={{ width: '80px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', fontSize: '0.8rem', padding: '2px 6px' }} 
                  value={wht === 0 ? '' : wht} 
                  placeholder="0"
                  onChange={(e) => {
                    setWht(parseFloat(e.target.value) || 0);
                    setWhtRate(0); // Clear rate if manual edit
                  }} 
                />
              </div>
            </div>
            <div className={styles.calcRowTotal} style={{ paddingTop: '8px' }}>
              <span>Grand Total</span>
              <span>{formatCurrency(Math.max(0, grandTotal))}</span>
            </div>
            <div className={styles.calcRow} style={{ alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Downpayment / Advance</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="number" 
                  style={{ width: '45px', textAlign: 'center', border: '1px solid #BAE6FD', borderRadius: '4px', outline: 'none', fontSize: '0.75rem', padding: '3px', color: '#0EA5E9' }} 
                  value={dpRate === 0 ? '' : dpRate} 
                  placeholder="%"
                  onChange={(e) => setDpRate(parseFloat(e.target.value) || 0)} 
                />
                <span style={{ color: '#0EA5E9', fontWeight: 600 }}>-Rp</span>
                <input 
                  type="number" 
                  style={{ width: '90px', textAlign: 'right', border: '1px solid #BAE6FD', borderRadius: '4px', outline: 'none', fontSize: '0.85rem', padding: '4px 6px', color: '#0EA5E9', fontWeight: 600 }} 
                  value={downpayment === 0 ? '' : downpayment} 
                  placeholder="0"
                  onChange={(e) => {
                    setDownpayment(parseFloat(e.target.value) || 0);
                    setDpRate(0); // Clear rate if manual edit
                  }} 
                />
              </div>
            </div>
            <div className={styles.calcRowTotal} style={{ marginTop: '8px', backgroundColor: '#EFF6FF', padding: '12px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
              <span style={{ color: '#1E40AF', fontSize: '1.05rem' }}>Balance Due</span>
              <span style={{ color: '#1E40AF', fontSize: '1.3rem' }}>{formatCurrency(Math.max(0, balanceDue))}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function NewDocumentForm() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading form template...</div>}>
      <DocumentFormBody />
    </Suspense>
  );
}
