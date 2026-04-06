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
  ClipboardList,
  Search,
  Package
} from 'lucide-react';
import styles from './page.module.css';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Tooltip from '@/components/common/Tooltip';

function PurchaseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatCurrency } = useLanguage();
  const { showToast } = useToast();
  const [docType, setDocType] = useState('REQUISITION');
  const [discount, setDiscount] = useState(0);
  const [wht, setWht] = useState(0);
  const [whtRate, setWhtRate] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [advanceRate, setAdvanceRate] = useState(0);
  const [isVatTaxable, setIsVatTaxable] = useState(false);

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

  const [items, setItems] = useState<any[]>([
    { id: 1, productId: '', sku: '', description: '', quantity: 1, unitPrice: 0, taxId: '', taxRate: 0 }
  ]);

  const [contacts, setContacts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [masterData, setMasterData] = useState({ products: [] as any[], taxes: [] as any[] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [contactsRes, ccRes, prodRes, taxRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/cost-centers'),
          fetch('/api/inventory'),
          fetch('/api/taxes')
        ]);
        const contactsData = await contactsRes.json();
        const ccData = await ccRes.json();
        const prodData = await prodRes.json();
        const taxData = await taxRes.json();
        
        if (contactsData.contacts) {
          setContacts(contactsData.contacts.filter((c: any) => c.type === 'Vendor' || c.type === 'Both'));
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

  const handleItemChange = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const product = masterData.products.find(p => p.id === value);
          return {
            ...item,
            productId: value,
            sku: product?.sku || '',
            description: product?.name || '',
            unitPrice: product?.cost || 0,
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

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), productId: '', sku: '', description: '', quantity: 1, unitPrice: 0, taxId: '', taxRate: 0 }]);
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
  const balanceDue = grandTotal - advance;

  // Helpers for WHT and Advance based on percentage
  useEffect(() => {
    if (whtRate > 0) {
      setWht(dpp * (whtRate / 100));
    }
  }, [whtRate, dpp]);

  useEffect(() => {
    if (advanceRate > 0) {
      setAdvance(grandTotal * (advanceRate / 100));
    }
  }, [advanceRate, grandTotal]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const grandTotalVal = Math.max(0, subtotal - discount + calculateTax() - wht);
      const payload = {
        supplier: formData.vendorName || (formData.vendorId === 'manual' ? 'Unregistered Vendor' : 'Unknown'),
        contactId: formData.vendorId && formData.vendorId !== 'manual' ? formData.vendorId : undefined,
        costCenterId: selectedCostCenter || undefined,
        date: new Date(formData.date).toISOString(),
        expectedDate: new Date(formData.dueDate).toISOString(),
        items: items,
        discountAmount: discount,
        isVatTaxable: isVatTaxable,
        type: docType
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (res.ok) {
        showToast(`${getTitle()} saved successfully (PO No: ${responseBody.purchaseOrder?.poNumber})!`, 'success');
        router.push('/purchases');
      } else {
        showToast(`Error: ${responseBody.error || 'Failed to save document'}`, 'error');
      }
    } catch (e) {
      showToast('Network error connecting to Backend API.', 'error');
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
              <div className={styles.metaFieldItem} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>VAT STATUS</label>
                <select 
                  className={styles.docTypeSelect} 
                  style={{ fontSize: '0.9rem', padding: '4px 8px', border: isVatTaxable ? '2px solid #0EA5E9' : '1px solid #e2e8f0' }}
                  value={isVatTaxable ? 'TAXABLE' : 'NON_TAXABLE'}
                  onChange={(e) => setIsVatTaxable(e.target.value === 'TAXABLE')}
                >
                  <option value="NON_TAXABLE">Non-Taxable</option>
                  <option value="TAXABLE">VAT Taxable (11/12)</option>
                </select>
              </div>
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
                  <div className={styles.metaFieldItem} style={{ borderTop: '1px solid #f1f5f9', marginTop: '4px', paddingTop: '4px' }}>
                    <label>Cost Center / Project</label>
                    <select 
                      className={styles.metaInputSmall}
                      value={selectedCostCenter}
                      onChange={(e) => setSelectedCostCenter(e.target.value)}
                    >
                      <option value="">-- No Tag --</option>
                      {costCenters.map(cc => (
                        <option key={cc.id} value={cc.id}>{cc.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.itemsArea}>
            <div className={styles.itemsHeader}>
              <div style={{ flex: 1.8 }}>Description</div>
              <div style={{ flex: 0.5, textAlign: 'center' }}>Qty</div>
              <div style={{ flex: 0.8, textAlign: 'right' }}>Unit Price</div>
              {isVatTaxable && <th style={{ flex: 0.8, textAlign: 'right', fontSize: '0.75rem', color: '#0EA5E9' }}>VAT Base (DPP)</th>}
              <div style={{ flex: 0.6, textAlign: 'right' }}>Tax %</div>
              <div style={{ flex: 1, textAlign: 'right' }}>Total</div>
              <div style={{ width: '30px' }}></div>
            </div>
            
            <div className={styles.itemsList}>
              {items.map((item, index) => (
                <div key={item.id} className={styles.itemRow}>
                  <div style={{ flex: 1 }}>
                    <select 
                      className={styles.tableInput}
                      value={item.productId}
                      onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                    >
                      <option value="">-- Manual --</option>
                      {masterData.products.map(p => (
                        <option key={p.id} value={p.id}>{p.sku}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 2.5 }}>
                    <input type="text" className={styles.tableInput} placeholder="Procured goods or service description..." 
                           value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                  </div>
                  <div style={{ flex: 0.5 }}>
                    <input type="number" className={styles.tableInput} style={{ textAlign: 'center' }} 
                           value={item.quantity === 0 ? '' : item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 0.8 }}>
                    <input type="number" className={styles.tableInput} style={{ textAlign: 'right' }} placeholder="0.00" 
                           value={item.unitPrice === 0 ? '' : item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  </div>
                  {isVatTaxable && (
                    <div style={{ flex: 0.8, textAlign: 'right', fontSize: '0.85rem', color: '#0EA5E9', fontWeight: 600, paddingTop: '8px' }}>
                      {formatCurrency(item.unitPrice * (11/12))}
                    </div>
                  )}
                  <div style={{ flex: 0.6, opacity: isVatTaxable ? 1 : 0.4 }}>
                    <input 
                      type="number" 
                      step="0.01"
                      list="tax-options-p"
                      disabled={!isVatTaxable}
                      className={styles.tableInput} 
                      style={{ textAlign: 'right', backgroundColor: !isVatTaxable ? '#f1f5f9' : 'transparent' }}
                      value={isVatTaxable ? item.taxRate : 0} 
                      onChange={(e) => handleItemChange(item.id, 'taxRate', e.target.value)}
                      placeholder="0"
                    />
                    <datalist id="tax-options-p">
                      <option value="0">Zero (0%)</option>
                      <option value="11">PPN (11%)</option>
                      <option value="10">Pajak (10%)</option>
                    </datalist>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right', fontWeight: 500, paddingTop: '8px' }}>
                    {formatCurrency(item.quantity * item.unitPrice)}
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
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className={styles.calcRow} style={{ alignItems: 'center' }}>
                <span>Commercial Discount <Tooltip content="Potongan harga beli dari vendor sebelum pengenaan pajak (PPN)." /></span>
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
              <div className={styles.calcRow} style={{ color: '#0EA5E9', fontWeight: 600 }}>
                <span>Tax Base (DPP / Harga for Tax) <Tooltip content="Dasar Pengenaan Pajak untuk pembelian ini." /></span>
                <span>{formatCurrency(dpp)}</span>
              </div>
              <div className={styles.calcRow} style={{ color: isVatTaxable ? '#64748b' : '#334155', opacity: isVatTaxable ? 0.7 : 1 }}>
                <span>Estimated Tax (VAT) <Tooltip content="Pajak Pertambahan Nilai (PPN) 11% yang akan menjadi Pajak Masukan bagi perusahaan." /></span>
                <span>{formatCurrency(vat)}</span>
              </div>
              <div className={styles.calcRow} style={{ alignItems: 'center' }}>
                <span>Withholding Tax (WHT) <Tooltip content="Pajak yang wajib dipotong oleh perusahaan saat membayar tagihan vendor (PPh 23/21)." /></span>
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
              <div className={styles.calcRowTotal} style={{ paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <span>Grand Total</span>
                <span style={{ color: getThemeColor() }}>{formatCurrency(Math.max(0, grandTotal))}</span>
              </div>
              <div className={styles.calcRow} style={{ alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Downpayment / Advance</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    style={{ width: '45px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', fontSize: '0.75rem', padding: '2px' }} 
                    value={advanceRate === 0 ? '' : advanceRate} 
                    placeholder="%"
                    onChange={(e) => setAdvanceRate(parseFloat(e.target.value) || 0)} 
                  />
                  <span style={{ color: getThemeColor(), fontWeight: 600 }}>-Rp</span>
                  <input 
                    type="number" 
                    style={{ width: '90px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', fontSize: '0.85rem', padding: '4px 6px', color: getThemeColor(), fontWeight: 600 }} 
                    value={advance === 0 ? '' : advance} 
                    placeholder="0"
                    onChange={(e) => {
                      setAdvance(parseFloat(e.target.value) || 0);
                      setAdvanceRate(0); 
                    }} 
                  />
                </div>
              </div>
              <div className={styles.calcRowTotal} style={{ marginTop: '8px', backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                <span style={{ color: '#0369a1', fontSize: '1.05rem' }}>Balance Due</span>
                <span style={{ color: '#0369a1', fontSize: '1.3rem' }}>{formatCurrency(Math.max(0, balanceDue))}</span>
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

