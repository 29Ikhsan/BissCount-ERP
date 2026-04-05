'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Building, 
  Plus, 
  TrendingDown, 
  ShieldCheck, 
  Activity, 
  ChevronRight, 
  MoreHorizontal,
  X,
  Play,
  Calendar,
  Layers,
  Calculator,
  Download,
  Truck,
  HardDrive
} from 'lucide-react';
import Link from 'next/link';

export default function FixedAssetHub() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isDeprModalOpen, setIsDeprModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'MACHINERY',
    purchaseDate: new Date().toISOString().split('T')[0],
    cost: 0,
    residualValue: 0,
    usefulLife: 48
  });

  const [deprRun, setDeprRun] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const fetchAssets = () => {
    setLoading(true);
    fetch('/api/accounting/assets')
      .then(res => res.json())
      .then(data => {
        setAssets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/accounting/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      });
      if (res.ok) {
        setIsAssetModalOpen(false);
        setNewAsset({ name: '', category: 'MACHINERY', purchaseDate: new Date().toISOString().split('T')[0], cost: 0, residualValue: 0, usefulLife: 48 });
        fetchAssets();
      }
    } catch (error) {
      console.error('Asset creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunDepreciation = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/accounting/assets/depreciate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deprRun)
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Success: ${data.message} Total: Rp ${data.totalAmount.toLocaleString()}`);
        setIsDeprModalOpen(false);
        fetchAssets();
      } else {
        const err = await res.json();
        alert(err.error || 'Depreciation run failed');
      }
    } catch (error) {
       console.error('Depreciation run failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = assets.reduce((acc, curr) => ({
    totalCost: acc.totalCost + curr.cost,
    totalAccum: acc.totalAccum + curr.accumulatedDepr,
    totalNet: acc.totalNet + curr.netBookValue
  }), { totalCost: 0, totalAccum: 0, totalNet: 0 });

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Analyzing AKSIA Capital Registry...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox} style={{ backgroundColor: 'rgba(39, 156, 90, 0.1)' }}>
            <Building size={24} color="#279C5A"/>
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Fixed Asset Registry</h1>
            <p className={styles.subtitle}>Strategic oversight of business capital, property, and automated depreciation runs.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.btnSecondary} onClick={() => setIsDeprModalOpen(true)} style={{ marginRight: '10px' }}>
              <Play size={16}/> Run Depreciation
           </button>
           <button className={styles.btnPrimary} onClick={() => setIsAssetModalOpen(true)}>
             <Plus size={16}/> Register Asset
           </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Gross Capital Assets</div>
           <div className={styles.metricValue}>Rp {stats.totalCost.toLocaleString()}</div>
           <div className={styles.metricSub}>TOTAL PURCHASE COST</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Accumulated Depreciation</div>
           <div className={styles.metricValue} style={{ color: '#EF4444' }}>Rp {stats.totalAccum.toLocaleString()}</div>
           <div className={styles.metricSub}>CUMULATIVE EROSION</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Net Book Value</div>
           <div className={styles.metricValue} style={{ color: '#279C5A' }}>Rp {stats.totalNet.toLocaleString()}</div>
           <div className={styles.metricSub}>CURRENT BALANCE SHEET VALUE</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Monthly Expense</div>
           <div className={styles.metricValue}>Rp {assets.reduce((sum, a) => sum + a.monthlyDepr, 0).toLocaleString()}</div>
           <div className={styles.metricSub}>EST. MONTHLY P&L IMPACT</div>
        </div>
      </div>

      {/* Asset List */}
      <div className={styles.assetPanel}>
        <div className={styles.tableHeader}>
           <div className={styles.tableTitleGroup}>
              <h2 className={styles.tableTitle}>Property & Equipment realization</h2>
              <span className={styles.liveIndicator}>AUDIT READY</span>
           </div>
           <div className={styles.integratedBagde}><ShieldCheck size={14}/> Integrated with General Ledger</div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ASSET & CATEGORY</th>
              <th>PURCHASE DATE</th>
              <th className={styles.numeric}>ORIGINAL COST</th>
              <th className={styles.numeric}>ACCUM. DEPR</th>
              <th className={styles.numeric}>NET BOOK VALUE</th>
              <th>LIFE METER</th>
              <th className={styles.textRight}>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr key={asset.id}>
                <td>
                  <span className={styles.assetName}>{asset.name}</span>
                  <span className={styles.assetCategory}>{asset.category}</span>
                </td>
                <td>{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                <td className={styles.numeric}>Rp {asset.cost.toLocaleString()}</td>
                <td className={styles.numeric} style={{ color: '#EF4444' }}>Rp {asset.accumulatedDepr.toLocaleString()}</td>
                <td className={styles.numeric} style={{ fontWeight: 800 }}>Rp {asset.netBookValue.toLocaleString()}</td>
                <td>
                   <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>
                      {Math.round((asset.accumulatedDepr / asset.cost) * 100)}% Depreciated
                   </div>
                   <div className={styles.lifeMeterContainer}>
                      <div className={styles.lifeMeter} style={{ width: `${(asset.accumulatedDepr / asset.cost) * 100}%` }}></div>
                   </div>
                </td>
                <td className={styles.textRight}>
                   <button className={styles.moreBtn}><ChevronRight size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW ASSET MODAL */}
      {isAssetModalOpen && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                 <h2 className={styles.modalTitle}>Capital Asset Authorization</h2>
                 <button className={styles.closeBtn} onClick={() => setIsAssetModalOpen(false)}>
                    <X size={20}/>
                 </button>
              </div>
              <form onSubmit={handleCreateAsset}>
                 <div className={styles.formGroup}>
                    <label className={styles.label}>Asset Full Name</label>
                    <input 
                      type="text" 
                      className={styles.input}
                      required
                      placeholder="e.g., CNC Milling Machine Gen 4"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                    />
                 </div>
                 <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Category</label>
                       <select 
                         className={styles.select}
                         value={newAsset.category}
                         onChange={(e) => setNewAsset({...newAsset, category: e.target.value})}
                       >
                          <option value="MACHINERY">Production Machinery</option>
                          <option value="VEHICLES">Logistics Vehicles</option>
                          <option value="COMPUTERS">IT & Tech Assets</option>
                          <option value="OFFICE">Office Equipment</option>
                          <option value="BUILDINGS">Property & Infrastructure</option>
                       </select>
                    </div>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Purchase Date</label>
                       <input 
                         type="date" 
                         className={styles.input}
                         value={newAsset.purchaseDate}
                         onChange={(e) => setNewAsset({...newAsset, purchaseDate: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Purchase Cost (IDR)</label>
                       <input 
                         type="number" 
                         className={styles.input}
                         value={newAsset.cost}
                         onChange={(e) => setNewAsset({...newAsset, cost: Number(e.target.value)})}
                       />
                    </div>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Useful Life (Months)</label>
                       <input 
                         type="number" 
                         className={styles.input}
                         value={newAsset.usefulLife}
                         onChange={(e) => setNewAsset({...newAsset, usefulLife: Number(e.target.value)})}
                       />
                    </div>
                 </div>
                 
                 <button type="submit" className={styles.btnPrimary} style={{ width: '100%', marginTop: '20px' }}>
                    {isSubmitting ? 'Registering...' : 'Authorize Asset Record'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* DEPRECIATION RUN MODAL */}
      {isDeprModalOpen && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent} style={{ width: '400px' }}>
              <div className={styles.modalHeader}>
                 <h2 className={styles.modalTitle}>Depreciation Run</h2>
                 <button className={styles.closeBtn} onClick={() => setIsDeprModalOpen(false)}>
                    <X size={20}/>
                 </button>
              </div>
              <div style={{ marginBottom: '20px' }}>
                 <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
                    This process will calculate value erosion for all active assets and 
                    <strong> post automated Journal Entries</strong> to your General Ledger.
                 </p>
              </div>
              <div className={styles.formGrid}>
                 <div className={styles.formGroup}>
                    <label className={styles.label}>Month</label>
                    <input type="number" className={styles.input} value={deprRun.month} onChange={(e) => setDeprRun({...deprRun, month: Number(e.target.value)})}/>
                 </div>
                 <div className={styles.formGroup}>
                    <label className={styles.label}>Year</label>
                    <input type="number" className={styles.input} value={deprRun.year} onChange={(e) => setDeprRun({...deprRun, year: Number(e.target.value)})}/>
                 </div>
              </div>
              <button 
                onClick={handleRunDepreciation} 
                className={styles.btnPrimary} 
                style={{ width: '100%', background: '#EF4444' }}
                disabled={isSubmitting}
              >
                 {isSubmitting ? 'Processing...' : 'Authorize Month-End Run'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
