'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  Building,
  CalendarDays,
  FileDigit,
  MapPin,
  ClipboardList
} from 'lucide-react';
import styles from './page.module.css';

function PurchaseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [docType, setDocType] = useState('REQUISITION');
  const [discount, setDiscount] = useState(0);
  const [wht, setWht] = useState(0);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setDocType(type.toUpperCase());
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    vendorId: '',
    vendorName: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    requisitioner: '',
    deliveryLocation: 'Main HQ Warehouse',
    notes: ''
  });

  const [items, setItems] = useState([
    { id: 1, sku: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }
  ]);

  const [contacts, setContacts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await fetch('/api/contacts');
        const data = await res.json();
        if (data.contacts) {
          // Filter out customers from purchases list context
          setContacts(data.contacts.filter((c: any) => c.type === 'Vendor' || c.type === 'Both'));
        }
      } catch (e) {
        console.error('Failed to load contacts');
      }
    }
    loadContacts();
  }, []);

  const getTitle = () => {
    if (docType === 'REQUISITION') return 'Purchase Requisition (PR)';
    if (docType === 'PURCHASE_ORDERS') return 'Purchase Order (PO)';
    if (docType === 'GOODS_RECEIPT') return 'Goods Receipt (GR)';
    return 'Vendor Bill';
  };

  const getThemeColor = () => {
    if (docType === 'REQUISITION') return '#3B82F6';
    if (docType === 'PURCHASE_ORDERS') return '#F59E0B';
    if (docType === 'GOODS_RECEIPT') return '#8B5CF6';
    return '#10B981'; // Bill
  };

  const handleItemChange = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), sku: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice) * (item.taxRate / 100)), 0);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const grandTotal = Math.max(0, calculateSubtotal() - discount + calculateTax() - wht);
      const payload = {
        supplier: formData.vendorName || (formData.vendorId === 'manual' ? 'Unregistered Vendor' : 'Unknown'),
        contactId: formData.vendorId && formData.vendorId !== 'manual' ? formData.vendorId : undefined,
        date: new Date(formData.date).toISOString(),
        expectedDate: new Date(formData.dueDate).toISOString(),
        amount: grandTotal,
        // we can also pass items to be stored if the PO architecture handles it.
        items: items
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (res.ok) {
        alert(`${getTitle()} saved successfully (PO No: ${responseBody.purchaseOrder?.poNumber})!`);
        router.push('/purchases');
      } else {
        alert(`Error: ${responseBody.error || 'Failed to save document'}`);
      }
    } catch (e) {
      alert('Network error connecting to Backend API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back to Purchases
        </button>
        <div className={styles.topNavActions}>
          <button className={styles.draftBtn} disabled={isSubmitting}>Save Draft</button>
          <button className={styles.submitBtn} 
            style={{ backgroundColor: getThemeColor(), borderColor: getThemeColor() }}
            onClick={handleSave}
            disabled={isSubmitting}
          >
            <Save size={16} /> {isSubmitting ? 'Saving...' : `Save ${getTitle()}`}
          </button>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainPanel}>
          <div className={styles.headerArea} style={{ borderTop: `4px solid ${getThemeColor()}`}}>
            <div className={styles.headerTop}>
              <select className={styles.docTypeSelect} value={docType} onChange={(e) => setDocType(e.target.value)} style={{ color: getThemeColor() }}>
                <option value="REQUISITION">PURCHASE REQUISITION</option>
                <option value="PURCHASE_ORDERS">PURCHASE ORDER</option>
                <option value="GOODS_RECEIPT">GOODS RECEIPT</option>
                <option value="VENDOR_BILLS">VENDOR BILL</option>
              </select>
              <div className={styles.docIdNumber}>#PRC-{new Date().getFullYear()}-XXXX</div>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaBox}>
                <div className={styles.metaLabel}><Building size={14} /> Vendor Info</div>
                <select 
                  className={styles.metaInputLarge}
                  value={formData.vendorId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedV = contacts.find(c => c.id === selectedId);
                    setFormData({
                      ...formData, 
                      vendorId: selectedId,
                      vendorName: selectedV ? selectedV.name : (selectedId === 'manual' ? 'Unregistered Vendor' : '')
                    });
                  }}
                  style={{ marginBottom: '8px', WebkitAppearance: 'menulist' }}
                >
                  <option value="">-- Select Vendor --</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                  <option value="manual">+ Unregistered Vendor (Manual)</option>
                </select>
                <textarea className={styles.metaTextArea} placeholder="Vendor Address & Contact details..."></textarea>
              </div>
              <div className={styles.metaBox}>
                <div className={styles.metaLabel}><MapPin size={14} /> Delivery Location</div>
                <input type="text" className={styles.metaInputLarge} placeholder="Ship to location" 
                  value={formData.deliveryLocation} onChange={(e) => setFormData({...formData, deliveryLocation: e.target.value})} />
                {(docType === 'REQUISITION' || docType === 'PURCHASE_ORDERS') && (
                  <>
                     <div className={styles.metaFieldsSmall}>
                        <div className={styles.metaFieldItem}>
                          <label>Requesting Dept</label>
                          <input type="text" className={styles.metaInputSmall} placeholder="e.g. IT, Admin" 
                            value={formData.requisitioner} onChange={(e) => setFormData({...formData, requisitioner: e.target.value})} />
                        </div>
                     </div>
                  </>
                )}
              </div>
              <div className={styles.metaBox}>
                <div className={styles.metaLabel}><CalendarDays size={14} /> Dates</div>
                <div className={styles.metaFieldsSmall}>
                  <div className={styles.metaFieldItem}>
                    <label>Issue Date</label>
                    <input type="date" className={styles.metaInputSmall} 
                      value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className={styles.metaFieldItem}>
                    <label>Expected Delivery</label>
                    <input type="date" className={styles.metaInputSmall} 
                      value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.itemsArea}>
            <div className={styles.itemsHeader}>
              <div style={{ flex: 1 }}>Item SKU</div>
              <div style={{ flex: 2.5 }}>Description</div>
              <div style={{ flex: 0.5, textAlign: 'center' }}>Qty</div>
              <div style={{ flex: 1, textAlign: 'right' }}>Unit Price</div>
              <div style={{ flex: 0.8, textAlign: 'right' }}>Tax %</div>
              <div style={{ flex: 1, textAlign: 'right' }}>Total</div>
              <div style={{ width: '30px' }}></div>
            </div>
            
            <div className={styles.itemsList}>
              {items.map((item, index) => (
                <div key={item.id} className={styles.itemRow}>
                  <div style={{ flex: 1 }}>
                    <input type="text" className={styles.tableInput} placeholder="SKU-123" 
                           value={item.sku} onChange={(e) => handleItemChange(item.id, 'sku', e.target.value)} />
                  </div>
                  <div style={{ flex: 2.5 }}>
                    <input type="text" className={styles.tableInput} placeholder="Procured goods or service description..." 
                           value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                  </div>
                  <div style={{ flex: 0.5 }}>
                    <input type="number" className={styles.tableInput} style={{ textAlign: 'center' }} 
                           value={item.quantity === 0 ? '' : item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="number" className={styles.tableInput} style={{ textAlign: 'right' }} placeholder="0.00" 
                           value={item.unitPrice === 0 ? '' : item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 0.8 }}>
                    <input type="number" className={styles.tableInput} style={{ textAlign: 'right' }} placeholder="0" 
                           value={item.taxRate === 0 ? '' : item.taxRate} onChange={(e) => handleItemChange(item.id, 'taxRate', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'right', fontWeight: 500, paddingTop: '8px' }}>
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                  <div style={{ width: '30px', display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                    <button className={styles.deleteBtn} onClick={() => handleRemoveItem(item.id)} disabled={items.length === 1}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button className={styles.addBtn} onClick={handleAddItem} style={{ color: getThemeColor() }}>
              <Plus size={16} /> Add Line Item
            </button>
          </div>

          <div className={styles.footerArea}>
            <div className={styles.notesArea}>
              <label>Purchase Terms / Notes</label>
              <textarea placeholder="Specify delivery instructions, penalties for late arrival, shipping terms, or reasons for requisition..."
                 value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
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
                <span>Estimated Tax (VAT)</span>
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
                <span style={{ color: getThemeColor() }}>${Math.max(0, calculateSubtotal() - discount + calculateTax() - wht).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewPurchaseDocument() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading Form...</div>}>
      <PurchaseFormContent />
    </Suspense>
  );
}

