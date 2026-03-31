'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import styles from './page.module.css';

function DocumentFormBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [docType, setDocType] = useState('QUOTATION');
  const [discount, setDiscount] = useState(0);
  const [wht, setWht] = useState(0);
  const [downpayment, setDownpayment] = useState(0);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setDocType(type.toUpperCase());
    }
  }, [searchParams]);

  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await fetch('/api/contacts');
        const data = await res.json();
        if (data.contacts) {
          // Filter out vendors from invoices list context
          setContacts(data.contacts.filter((c: any) => c.type === 'Customer' || c.type === 'Both'));
        }
      } catch (e) {
        console.error('Failed to load contacts');
      }
    }
    loadContacts();
  }, []);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, unitPrice: 0, tax: 0, total: 0 }
  ]);

  const handleAddItem = () => {
    const newItem = {
      id: items.length + 1,
      description: '',
      quantity: 1,
      unitPrice: 0,
      tax: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.tax / 100)), 0);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        clientName: clientName || (clientId === 'manual' ? 'Walk-in Customer' : 'Unknown'),
        contactId: clientId && clientId !== 'manual' ? clientId : undefined,
        date: new Date(date).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        items
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (res.ok) {
        alert(`${docType} created successfully (Invoice No: ${responseBody.invoice?.invoiceNo})!`);
        router.push('/invoices');
      } else {
        alert(`Error: ${responseBody.error || 'Failed to generate document'}`);
      }
    } catch (e) {
      alert('Network error connecting to Backend API.');
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
          <div className={styles.docIconWrap}>
            <FileText size={24} color="#0F3B8C" />
          </div>
          <div>
            <h1 className={styles.formTitle}>Create New {docType.replace('_', ' ')}</h1>
            <p className={styles.formSubtitle}>Enter client and transaction details below to officially record this stage.</p>
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
             <label>Reference #</label>
             <input type="text" className={styles.inputText} placeholder="e.g. PO-78291" />
           </div>
        </div>

        <hr className={styles.divider} />

        {/* Grid Area */}
        <h3 className={styles.sectionTitle}>Line Items</h3>
        <table className={styles.itemTable}>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Description</th>
              <th style={{ width: '10%' }}>Qty</th>
              <th style={{ width: '20%' }}>Unit Price</th>
              <th style={{ width: '10%' }}>Tax (%)</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Amount</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td>
                  <input type="text" className={styles.gridInput} placeholder="Product or Service name" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                </td>
                <td>
                  <input type="number" min="1" className={styles.gridInput} value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} />
                </td>
                <td>
                  <input type="number" min="0" step="0.01" className={styles.gridInput} value={item.unitPrice === 0 ? '' : item.unitPrice} placeholder="$0.00" onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))} />
                </td>
                <td>
                  <input type="number" min="0" className={styles.gridInput} value={item.tax} onChange={(e) => handleItemChange(item.id, 'tax', Number(e.target.value))} />
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 600 }}>${(item.quantity * item.unitPrice).toFixed(2)}</td>
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
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className={styles.calcRow} style={{ alignItems: 'center' }}>
              <span>Commercial Discount</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#EF4444', fontWeight: 600 }}>-$</span>
                <input 
                  type="number" 
                  style={{ width: '70px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', fontSize: '0.8rem', padding: '2px 6px' }} 
                  value={discount === 0 ? '' : discount} 
                  placeholder="0.00"
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className={styles.calcRow}>
              <span>Value Added Tax (VAT)</span>
              <span>${calculateTax().toFixed(2)}</span>
            </div>
            <div className={styles.calcRow} style={{ alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <span>Withholding Tax (WHT)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#EF4444', fontWeight: 600 }}>-$</span>
                <input 
                  type="number" 
                  style={{ width: '70px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', fontSize: '0.8rem', padding: '2px 6px' }} 
                  value={wht === 0 ? '' : wht} 
                  placeholder="0.00"
                  onChange={(e) => setWht(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className={styles.calcRowTotal} style={{ paddingTop: '8px' }}>
              <span>Grand Total</span>
              <span>${Math.max(0, calculateSubtotal() - discount + calculateTax() - wht).toFixed(2)}</span>
            </div>
            <div className={styles.calcRow} style={{ alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Downpayment / Advance</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#0EA5E9', fontWeight: 600 }}>-$</span>
                <input 
                  type="number" 
                  style={{ width: '80px', textAlign: 'right', border: '1px solid #BAE6FD', borderRadius: '4px', outline: 'none', fontSize: '0.85rem', padding: '4px 6px', color: '#0EA5E9', fontWeight: 600 }} 
                  value={downpayment === 0 ? '' : downpayment} 
                  placeholder="0.00"
                  onChange={(e) => setDownpayment(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className={styles.calcRowTotal} style={{ marginTop: '8px', backgroundColor: '#EFF6FF', padding: '12px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
              <span style={{ color: '#1E40AF', fontSize: '1.05rem' }}>Balance Due</span>
              <span style={{ color: '#1E40AF', fontSize: '1.3rem' }}>${Math.max(0, (calculateSubtotal() - discount + calculateTax() - wht) - downpayment).toFixed(2)}</span>
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
