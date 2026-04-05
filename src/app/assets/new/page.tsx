'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  Monitor,
  CalendarClock,
  TrendingDown
} from 'lucide-react';
import styles from './page.module.css';

export default function NewAssetRegistration() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    category: 'IT Equipment',
    location: '',
    purchaseDate: '',
    purchaseCost: '',
    supplier: '',
    
    // Depreciation
    depreciationMethod: 'Straight Line',
    usefulLife: '',
    salvageValue: '0',
    depreciationStartDate: '',
    costCenterId: ''
  });
  const [costCenters, setCostCenters] = useState<any[]>([]);

  useState(() => {
    fetch('/api/cost-centers')
      .then(res => res.json())
      .then(data => {
        if (data.costCenters) setCostCenters(data.costCenters);
      });
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back to Assets Register
        </button>
        <button className={styles.saveBtn}>
          <Save size={16} /> Capitalize Asset (Save)
        </button>
      </div>

      <div className={styles.mainPanel}>
        {/* Asset Identity */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrap}><Monitor size={18} /></div>
            <h2 className={styles.sectionTitle}>Capital Asset Details</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.formGrid}>
              
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Asset Name / Description *</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Delivery Van (Ford Transit)"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Asset Category</label>
                <select 
                  className={styles.input}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option>IT Equipment</option>
                  <option>Furniture & Fixtures</option>
                  <option>Vehicles</option>
                  <option>Machinery & Plant</option>
                  <option>Buildings</option>
                  <option>Land</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Serial Number / VIN</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. SN-998822"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Location / Department</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Main HQ - Finance Dept"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Cost Center / Project (Tagging)</label>
                <select 
                  className={styles.input}
                  value={formData.costCenterId}
                  onChange={(e) => handleChange('costCenterId', e.target.value)}
                >
                  <option value="">-- No Tag --</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Purchase Info */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrap} style={{backgroundColor: '#D1FAE5', color: '#10B981'}}><CalendarClock size={18} /></div>
            <h2 className={styles.sectionTitle}>Acquisition & Valuation</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.formGrid}>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Purchase Date</label>
                <input 
                  type="date" 
                  className={styles.input}
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Original Purchase Cost (Capitalized) *</label>
                <div className={styles.inputGroup}>
                  <span className={styles.inputPrefix}>Rp</span>
                  <input 
                    type="number" 
                    className={styles.inputWithPrefix} 
                    placeholder="0"
                    value={formData.purchaseCost}
                    onChange={(e) => handleChange('purchaseCost', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.label}>Vendor / Supplier Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Ford Dealership Jakarta"
                  value={formData.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                />
              </div>

            </div>
          </div>
        </div>

        {/* Depreciation Engine */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrap} style={{backgroundColor: '#FEF3C7', color: '#F59E0B'}}><TrendingDown size={18} /></div>
            <h2 className={styles.sectionTitle}>Depreciation Engine</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Depreciation Method</label>
                  <select 
                    className={styles.input}
                    value={formData.depreciationMethod}
                    onChange={(e) => handleChange('depreciationMethod', e.target.value)}
                  >
                    <option>Straight Line</option>
                    <option>Double Declining Balance</option>
                    <option>Units of Production</option>
                    <option>No Depreciation (Land)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Useful Life (Years)</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    placeholder="e.g. 5"
                    value={formData.usefulLife}
                    onChange={(e) => handleChange('usefulLife', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Salvage / Residual Value</label>
                  <div className={styles.inputGroup}>
                    <span className={styles.inputPrefix}>Rp</span>
                    <input 
                      type="number" 
                      className={styles.inputWithPrefix} 
                      placeholder="0"
                      value={formData.salvageValue}
                      onChange={(e) => handleChange('salvageValue', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Depreciation Start Date</label>
                  <input 
                    type="date" 
                    className={styles.input}
                    value={formData.depreciationStartDate}
                    onChange={(e) => handleChange('depreciationStartDate', e.target.value)}
                  />
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
