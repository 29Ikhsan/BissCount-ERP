'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Plus, 
  Search, 
  X,
  Layers,
  Activity,
  Warehouse,
  ArrowRightLeft,
  TrendingUp,
  Box,
  ShieldCheck
} from 'lucide-react';

export default function InventoryHub() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Advanced Module States
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [layersModalOpen, setLayersModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [fifoLayers, setFifoLayers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Form states
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', category: 'RAW_MATERIAL', price: 0, cost: 0
  });
  
  const [adjForm, setAdjForm] = useState({ type: 'ADD', quantity: 1, reason: '', warehouseId: '' });
  const [transferForm, setTransferForm] = useState({ fromWarehouseId: '', toWarehouseId: '', quantity: 1 });

  const fetchData = () => {
    setLoading(true);
    fetch('/api/inventory')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
      
    // Fetch Warehouses for dropdowns
    fetch('/api/inventory/warehouses')
       .then(res => res.json())
       .then(d => {
          if (d.warehouses) setWarehouses(d.warehouses);
       });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdjust = (product: any) => {
     setSelectedProduct(product);
     const defaultWh = product.inventoryLevels?.[0]?.warehouseId || '';
     setAdjForm({ type: 'ADD', quantity: 1, reason: '', warehouseId: defaultWh });
     setAdjustModalOpen(true);
  };

  const openTransfer = (product: any) => {
     setSelectedProduct(product);
     const defaultWh = product.inventoryLevels?.[0]?.warehouseId || '';
     setTransferForm({ fromWarehouseId: defaultWh, toWarehouseId: '', quantity: 1 });
     setTransferModalOpen(true);
  };

  const openLayers = async (product: any) => {
     setSelectedProduct(product);
     setLayersModalOpen(true);
     setFifoLayers([]); // loading state
     const res = await fetch(`/api/inventory/${product.id}/batches`);
     const d = await res.json();
     if(d.batches) setFifoLayers(d.batches);
  };

  const handleAdjust = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
     try {
       const res = await fetch('/api/inventory/adjust', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...adjForm, productId: selectedProduct.id })
       });
       if (res.ok) {
         setAdjustModalOpen(false);
         fetchData();
       } else {
         const err = await res.json();
         alert(err.error || 'Adjustment failed');
       }
     } finally {
       setIsSubmitting(false);
     }
  };

  const handleTransfer = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/inventory/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...transferForm, productId: selectedProduct.id })
        });
        if (res.ok) {
          setTransferModalOpen(false);
          fetchData();
        } else {
          const err = await res.json();
          alert(err.error || 'Transfer failed');
        }
      } finally {
        setIsSubmitting(false);
      }
   };

  const filteredProducts = data?.products?.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing AKSIA Physical Assets...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox} style={{ backgroundColor: '#279C5A' }}>
            <Warehouse size={28} color="white"/>
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Warehouse Command</h1>
            <p className={styles.subtitle}>Institutional multi-warehouse stock management and physical asset tracking.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon}/>
              <input 
                type="text" 
                placeholder="Search SKU or Product..." 
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
             <Plus size={16}/> New Product
           </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Total Inventory Value</div>
           <div className={styles.metricValue}>Rp {(data?.stats.totalValue || 0).toLocaleString()}</div>
           <div className={styles.metricSub}>FISCAL ASSET VALUATION</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Low Stock Alerts</div>
           <div className={styles.metricValue} style={{ color: '#F59E0B' }}>{data?.stats.lowStockAlerts || 0} <span style={{fontSize: '11px', color: '#64748B'}}>SKUs</span></div>
           <div className={styles.metricSub}>THRESHOLD TRIGGERS</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Out of Stock</div>
           <div className={styles.metricValue} style={{ color: '#EF4444' }}>{data?.stats.outOfStock || 0} <span style={{fontSize: '11px', color: '#64748B'}}>SKUs</span></div>
           <div className={styles.metricSub}>ZERO QUANTITY CRITICAL</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Inventory Turnover</div>
           <div className={styles.metricValue}>4.2x</div>
           <div className={styles.metricSub}>EFFICIENCY INDEX</div>
        </div>
      </div>

      {/* Product List */}
      <div className={styles.inventoryList}>
        <div className={styles.tableHeader}>
           <div className={styles.tableTitleGroup}>
              <h2 className={styles.tableTitle}>Global Stock Realization</h2>
              <span className={styles.liveIndicator}>LIVE TRACKING</span>
           </div>
           <div className={styles.integratedBadge}><Activity size={14}/> Integrated with Ledger</div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>PRODUCT IDENTIFIER</th>
              <th>CATEGORY</th>
              <th>WAREHOUSE DISTRIBUTION</th>
              <th>QUANTITY</th>
              <th>VALUATION (IDR)</th>
              <th className={styles.textRight}>OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p: any) => (
              <tr key={p.id} className={styles.row}>
                <td>
                  <span className={styles.sku}>{p.sku}</span>
                  <span className={styles.productName}>{p.name}</span>
                </td>
                <td style={{fontSize: '11px', fontWeight: 600, color: '#64748B'}}>{p.category}</td>
                <td>
                  {p.inventoryLevels?.length > 0 ? (
                    p.inventoryLevels.map((l: any) => (
                      <div key={l.id} className={styles.warehouseLevel}>
                        <Warehouse size={12} color="#94A3B8"/> {l.warehouse.name}: <strong>{l.quantity}</strong>
                      </div>
                    ))
                  ) : <span style={{fontSize: '11px', color: '#EF4444'}}>No Physical Stock.</span>}
                </td>
                <td><span className={styles.totalQty}>{p.totalQuantity.toLocaleString()} Units</span></td>
                <td><span style={{fontFamily: 'JetBrains Mono', fontWeight: 700}}>Rp {(p.totalQuantity * p.cost).toLocaleString()}</span></td>
                <td className={styles.textRight}>
                   <div className={styles.actions}>
                      <button className={styles.adjustBtn} title="Cost Layers (FIFO)" onClick={() => openLayers(p)}><Layers size={16}/></button>
                      <button className={styles.adjustBtn} style={{ background: '#EFF6FF', color: '#3B82F6' }} title="Transfer Stock" onClick={() => openTransfer(p)}><ArrowRightLeft size={16}/></button>
                      <button className={styles.adjustBtn} style={{ background: '#FEE2E2', color: '#EF4444' }} title="Stock Adjustment" onClick={() => openAdjust(p)}><Activity size={16}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FIFO LAYERS MODAL - Institutional Style */}
      {layersModalOpen && selectedProduct && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent} style={{ width: '600px' }}>
              <div className={styles.modalHeader}>
                 <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{background: '#D1FAE5', padding: '10px', borderRadius: '12px'}}>
                       <Layers size={20} color="#279C5A" />
                    </div>
                    <div>
                        <h2 className={styles.modalTitle}>Fiscal Cost Layers</h2>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{selectedProduct.name} • {selectedProduct.sku}</span>
                    </div>
                 </div>
                 <button className={styles.closeBtn} onClick={() => setLayersModalOpen(false)}><X size={20}/></button>
              </div>
              <div className={styles.modalBody} style={{ padding: '32px' }}>
                 <p style={{ fontSize: '12px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #279C5A', color: '#475569', marginBottom: '24px', lineHeight: 1.5 }}>
                   <strong>Audit Note:</strong> This visualizer displays the raw purchasing batches currently stored in memory. The oldest batch (top) is the primary COGS source for FIFO depletion.
                 </p>
                 
                 <table className={styles.table} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                    <thead style={{ background: '#F8FAFC' }}>
                       <tr>
                          <th style={{ fontSize: '10px' }}>ACQUISITION</th>
                          <th style={{ fontSize: '10px' }}>LOCATION</th>
                          <th style={{ fontSize: '10px' }}>UNIT COST (IDR)</th>
                          <th style={{ fontSize: '10px', textAlign: 'right' }}>REMAINING</th>
                       </tr>
                    </thead>
                    <tbody>
                       {fifoLayers.map((b: any, idx: number) => (
                          <tr key={b.id} style={{ background: idx === 0 ? '#F0FDF4' : '#fff' }}>
                             <td style={{ fontSize: '12px', color: '#64748B' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                             <td style={{ fontSize: '12px', fontWeight: 600 }}>{b.warehouse?.name || 'Central'}</td>
                             <td style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>Rp {b.unitCost.toLocaleString()}</td>
                             <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px', color: idx === 0 ? '#10B981' : '#1E293B', fontFamily: 'JetBrains Mono' }}>{b.remainingQty.toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>

                 {fifoLayers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>No active fiscal batches found.</div>
                 )}
                 
                 <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <div style={{ padding: '12px 24px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                       <span style={{fontSize: '10px', fontWeight: 700, color: '#94A3B8', display: 'block', textTransform: 'uppercase', marginBottom: '4px'}}>Current Valuation</span>
                       <span style={{fontWeight: 900, fontSize: '18px', fontFamily: 'JetBrains Mono'}}>Rp {fifoLayers.reduce((sum, b) => sum + (b.remainingQty * b.unitCost), 0).toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {adjustModalOpen && selectedProduct && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent} style={{ width: '450px' }}>
              <div className={styles.modalHeader}>
                 <h2 className={styles.modalTitle}>Physical Stock Opname</h2>
                 <button className={styles.closeBtn} onClick={() => setAdjustModalOpen(false)}><X size={20}/></button>
              </div>
              <form onSubmit={handleAdjust}>
                 <div className={styles.modalBody} style={{padding: '32px'}}>
                    <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>
                      Adjusting <strong>{selectedProduct.name}</strong>. Shrinkage will post a Ledger entry automatically.
                    </p>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Warehouse / Location</label>
                       <select className={styles.select} required value={adjForm.warehouseId} onChange={e => setAdjForm({...adjForm, warehouseId: e.target.value})}>
                          <option value="">Select Location</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                       </select>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                        <div className={styles.formGroup}>
                           <label className={styles.label}>Action</label>
                           <select className={styles.select} value={adjForm.type} onChange={e => setAdjForm({...adjForm, type: e.target.value})}>
                              <option value="ADD">Found / Add (+)</option>
                              <option value="REMOVE">Shrink / Remove (-)</option>
                           </select>
                        </div>
                        <div className={styles.formGroup}>
                           <label className={styles.label}>Qty</label>
                           <input type="number" min="1" required className={styles.input} value={adjForm.quantity} onChange={e => setAdjForm({...adjForm, quantity: Number(e.target.value)})}/>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Adjustment Reason</label>
                       <input type="text" placeholder="Audit mismatch..." required className={styles.input} value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})}/>
                    </div>
                 </div>
                 <div className={styles.modalFooter} style={{padding: '24px 32px', background: '#F8FAFC'}}>
                    <button type="submit" disabled={isSubmitting} className={styles.btnPrimary} style={{ width: '100%', background: adjForm.type === 'REMOVE' ? '#EF4444' : '#279C5A' }}>
                       {isSubmitting ? 'Posting...' : 'Commit Adjustment'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {transferModalOpen && selectedProduct && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent} style={{ width: '450px' }}>
              <div className={styles.modalHeader}>
                 <h2 className={styles.modalTitle}>Multi-Warehouse Transit</h2>
                 <button className={styles.closeBtn} onClick={() => setTransferModalOpen(false)}><X size={20}/></button>
              </div>
              <form onSubmit={handleTransfer}>
                 <div className={styles.modalBody} style={{padding: '32px'}}>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Source Warehouse</label>
                       <select className={styles.select} required value={transferForm.fromWarehouseId} onChange={e => setTransferForm({...transferForm, fromWarehouseId: e.target.value})}>
                          <option value="">Select Origin</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                       </select>
                    </div>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Destination</label>
                       <select className={styles.select} required value={transferForm.toWarehouseId} onChange={e => setTransferForm({...transferForm, toWarehouseId: e.target.value})}>
                          <option value="">Select Destination</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                       </select>
                    </div>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Transfer Quantity</label>
                       <input type="number" min="1" required className={styles.input} value={transferForm.quantity} onChange={e => setTransferForm({...transferForm, quantity: Number(e.target.value)})}/>
                    </div>
                 </div>
                 <div className={styles.modalFooter} style={{padding: '24px 32px', background: '#F8FAFC'}}>
                    <button type="submit" disabled={isSubmitting} className={styles.btnPrimary} style={{ width: '100%', background: '#3B82F6' }}>
                       {isSubmitting ? 'Routing...' : 'Execute Stock Transit'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
