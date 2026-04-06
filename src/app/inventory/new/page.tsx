'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  PackageSearch,
  Tag,
  Boxes,
  Truck,
  Image as ImageIcon,
  TestTubeDiagonal,
  Plus,
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import styles from './page.module.css';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

export default function NewInventoryItem() {
  const router = useRouter();
  const { formatCurrency } = useLanguage();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    barcode: '',
    salesPrice: '',
    costPrice: '',
    taxId: '',
    initialStock: '0',
    minStock: '10',
    maxStock: '100',
    uom: 'Units',
    preferredSupplierId: '',
    trackInventory: true
  });

  const [isManufactured, setIsManufactured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bomItems, setBomItems] = useState<any[]>([
    { id: 1, sku: '', name: '', quantity: 1, uom: 'Units', estCost: 0 }
  ]);

  const [masterData, setMasterData] = useState({
    taxes: [] as any[],
    vendors: [] as any[],
    products: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [taxRes, contactRes, productRes] = await Promise.all([
          fetch('/api/taxes'),
          fetch('/api/contacts'),
          fetch('/api/inventory')
        ]);
        
        const taxData = await taxRes.json();
        const contactData = await contactRes.json();
        const productData = await productRes.json();

        setMasterData({
          taxes: taxData.taxes || [],
          vendors: contactData.contacts?.filter((c: any) => c.role === 'Vendor' || c.role === 'Both') || [],
          products: productData.products || []
        });
      } catch (e) {
        console.error('Failed to load master data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMasterData();
  }, []);

  // Auto-calculate cost if BOM changes
  useEffect(() => {
    if (isManufactured) {
      const totalCost = bomItems.reduce((sum, item) => sum + (item.quantity * item.estCost), 0);
      setFormData(prev => ({ ...prev, costPrice: totalCost.toString() }));
    }
  }, [bomItems, isManufactured]);

  const handleBomChange = (id: number, field: string, value: any) => {
    let updatedBom = bomItems.map(item => {
      if (item.id === id) {
        if (field === 'sku') {
          const selectedProd = masterData.products.find((p: any) => p.sku === value);
          return { 
            ...item, 
            sku: value, 
            name: selectedProd?.name || '', 
            estCost: selectedProd?.cost || 0 
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setBomItems(updatedBom);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        isManufactured,
        bomItems: isManufactured ? bomItems : null
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (res.ok) {
        showToast(`Product ${formData.name} created successfully!`, 'success');
        router.push('/inventory');
      } else {
        showToast(`Error: ${responseBody.error || 'Failed to generate product'}`, 'error');
      }
    } catch (e) {
      showToast('Network error connecting to Backend API.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back to Inventory
        </button>
        <button className={styles.saveBtn} onClick={handleSave} disabled={isSubmitting}>
          <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Product Master'}
        </button>
      </div>

      <div className={styles.mainPanel}>
        {/* Basic Information */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrap}><PackageSearch size={18} /></div>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.formGrid}>
              
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Product Name *</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Precision Sensor X-1"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>SKU (Stock Keeping Unit) *</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. SKU-12345"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Category</label>
                <select 
                  className={styles.input}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option>Electronics</option>
                  <option>Hardware</option>
                  <option>Networking</option>
                  <option>Raw Material</option>
                  <option>Service</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Barcode / UPC</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Scan or enter barcode"
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Unit of Measure (UoM)</label>
                <select 
                  className={styles.input}
                  value={formData.uom}
                  onChange={(e) => handleChange('uom', e.target.value)}
                >
                  <option>Units</option>
                  <option>Boxes</option>
                  <option>Kilograms (kg)</option>
                  <option>Liters (L)</option>
                  <option>Meters (m)</option>
                  <option>Pallets</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Financial & Pricing */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrap} style={{backgroundColor: '#D1FAE5', color: '#10B981'}}><Tag size={18} /></div>
            <h2 className={styles.sectionTitle}>Financial & Pricing</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.formGrid}>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Sales Price (Revenue)</label>
                <div className={styles.inputGroup}>
                  <span className={styles.inputPrefix}>Rp</span>
                  <input 
                    type="number" 
                    className={styles.inputWithPrefix} 
                    placeholder="0"
                    value={formData.salesPrice}
                    onChange={(e) => handleChange('salesPrice', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Cost Price (COGS)</label>
                <div className={styles.inputGroup}>
                  <span className={styles.inputPrefix}>Rp</span>
                  <input 
                    type="number" 
                    className={styles.inputWithPrefix} 
                    placeholder="0"
                    value={formData.costPrice}
                    onChange={(e) => handleChange('costPrice', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Sales Tax / VAT Binding</label>
                <select 
                  className={styles.input}
                  value={formData.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                >
                  <option value="">-- No Tax --</option>
                  {masterData.taxes.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Preferred Supplier (Vendor)</label>
                <div className={styles.inputGroup}>
                  <span className={styles.inputPrefix}><Truck size={14} /></span>
                  <select 
                    className={styles.inputWithPrefix}
                    value={formData.preferredSupplierId}
                    onChange={(e) => handleChange('preferredSupplierId', e.target.value)}
                  >
                    <option value="">-- Select Vendor --</option>
                    {masterData.vendors.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Inventory Tracking Policies */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrap} style={{backgroundColor: '#FEF3C7', color: '#F59E0B'}}><Boxes size={18} /></div>
            <h2 className={styles.sectionTitle}>Inventory Policies</h2>
          </div>
          <div className={styles.sectionContent}>
            
            <label className={styles.toggleLabel}>
              <input 
                type="checkbox" 
                style={{display: 'none'}} 
                checked={formData.trackInventory}
                onChange={(e) => handleChange('trackInventory', e.target.checked)}
              />
              <div className={styles.toggleSwitch}></div>
              <span className={styles.toggleText}>Track Inventory for this item (Calculates COGS)</span>
            </label>

            {formData.trackInventory && (
              <div className={styles.formGrid} style={{ marginTop: '24px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Initial Stock on Hand</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={formData.initialStock}
                    onChange={(e) => handleChange('initialStock', e.target.value)}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Warehouse Bin Location</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="e.g. Aisle 5, Shelf B"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Min Reorder Point (Alert)</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={formData.minStock}
                    onChange={(e) => handleChange('minStock', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Stock Target</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={formData.maxStock}
                    onChange={(e) => handleChange('maxStock', e.target.value)}
                  />
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Bill of Materials (BOM) */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrap} style={{backgroundColor: '#E0E7FF', color: '#4F46E5'}}><TestTubeDiagonal size={18} /></div>
            <h2 className={styles.sectionTitle}>Bill of Materials (Assembly / Recipes)</h2>
          </div>
          <div className={styles.sectionContent}>
            <label className={styles.toggleLabel}>
              <input 
                type="checkbox" 
                style={{display: 'none'}} 
                checked={isManufactured}
                onChange={(e) => setIsManufactured(e.target.checked)}
              />
              <div className={styles.toggleSwitch}></div>
              <span className={styles.toggleText}>This item is manufactured or assembled from other items</span>
            </label>

            {isManufactured && (
              <div style={{ marginTop: '24px', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: '12px', color: '#6B7280', fontWeight: 600 }}>COMPONENT SKU</th>
                      <th style={{ padding: '12px', color: '#6B7280', fontWeight: 600 }}>QUANTITY</th>
                      <th style={{ padding: '12px', color: '#6B7280', fontWeight: 600 }}>EST. COST</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px dotted #E5E7EB' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <select 
                            className={styles.input} 
                            style={{ width: '100%', border: 'none', borderBottom: '1px solid #d1d5db', borderRadius: 0 }}
                            value={item.sku}
                            onChange={(e) => handleBomChange(item.id, 'sku', e.target.value)}
                          >
                            <option value="">-- Select Component --</option>
                            {masterData.products.filter(p => p.sku !== formData.sku).map(p => (
                              <option key={p.id} value={p.sku}>[{p.sku}] {p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input type="number" className={styles.input} style={{ width: '80px', border: 'none', borderBottom: '1px solid #d1d5db', borderRadius: 0, textAlign: 'center' }} 
                                 value={item.quantity} onChange={(e) => handleBomChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                          {formatCurrency(item.quantity * item.estCost)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                           <button style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                                   onClick={() => setBomItems(bomItems.filter(b => b.id !== item.id))} disabled={bomItems.length === 1}>
                             <Trash2 size={16} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB' }}>
                  <button 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px dashed #4F46E5', color: '#4F46E5', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setBomItems([...bomItems, { id: Date.now(), sku: '', name: '', quantity: 1, uom: 'Units', estCost: 0 }])}
                  >
                    <Plus size={14} /> Add Component
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Image */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrap} style={{backgroundColor: '#F3F4F6', color: '#6B7280'}}><ImageIcon size={18} /></div>
            <h2 className={styles.sectionTitle}>Product Media</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.photoUploadArea}>
              <ImageIcon className={styles.uploadIcon} size={48} />
              <div className={styles.uploadText}>Click or drag image to upload</div>
              <div className={styles.uploadHint}>JPG, PNG up to 5MB (Recomended 500x500px)</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
