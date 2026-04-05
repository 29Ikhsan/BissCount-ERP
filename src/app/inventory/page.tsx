'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Package, 
  Plus, 
  TrendingUp, 
  AlertCircle, 
  BarChart2, 
  Search, 
  Filter, 
  MoreHorizontal,
  X,
  PlusCircle,
  MinusCircle,
  Layers,
  Activity,
  ShieldCheck,
  CreditCard,
  Warehouse
} from 'lucide-react';
import Link from 'next/link';

export default function InventoryHub() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'RAW_MATERIAL',
    price: 0,
    cost: 0
  });

  const fetchData = () => {
    setLoading(true);
    fetch('/api/inventory')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewProduct({ sku: '', name: '', category: 'RAW_MATERIAL', price: 0, cost: 0 });
        fetchData();
      }
    } catch (error) {
      console.error('Product creation failed');
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
          <div className={styles.iconBox} style={{ backgroundColor: 'rgba(39, 156, 90, 0.1)' }}>
            <Package size={24} color="#279C5A"/>
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Inventory Command</h1>
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
           <div className={styles.metricSub}>ASSET VALUATION</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Low Stock Alerts</div>
           <div className={styles.metricValue} style={{ color: '#92400E' }}>{data?.stats.lowStockAlerts || 0} SKUs</div>
           <div className={styles.metricSub}>THRESHOLD TRIGGERS</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Out of Stock</div>
           <div className={styles.metricValue} style={{ color: '#991B1B' }}>{data?.stats.outOfStock || 0} SKUs</div>
           <div className={styles.metricSub}>ZERO QUANTITY</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Total SKUs</div>
           <div className={styles.metricValue}>{data?.stats.totalSKUs || 0} Products</div>
           <div className={styles.metricSub}>UNIQUE CATALOGUE</div>
        </div>
      </div>

      {/* Product List */}
      <div className={styles.inventoryList}>
        <div className={styles.tableHeader}>
           <div className={styles.tableTitleGroup}>
              <h2 className={styles.tableTitle}>Stock Realization</h2>
              <span className={styles.liveIndicator}>LIVE TRACKING</span>
           </div>
           <div className={styles.integratedBagde}><Activity size={14}/> Integrated with Operations</div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>PRODUCT & SKU</th>
              <th>CATEGORY</th>
              <th>WAREHOUSE STATUS</th>
              <th>QUANTITY</th>
              <th>VALUATION (IDR)</th>
              <th>ACCOUNTING STATUS</th>
              <th className={styles.textRight}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p: any) => (
              <tr key={p.id}>
                <td>
                  <span className={styles.sku}>{p.sku}</span>
                  <span className={styles.productName}>{p.name}</span>
                </td>
                <td>{p.category}</td>
                <td>
                  {p.inventoryLevels?.length > 0 ? (
                    p.inventoryLevels.map((l: any) => (
                      <div key={l.id} className={styles.warehouseLevel}>
                        <Warehouse size={12}/> {l.warehouse.name}: {l.quantity}
                      </div>
                    ))
                  ) : <span className={styles.noStock}>No registered stock.</span>}
                </td>
                <td><span className={styles.totalQty}>{p.totalQuantity} Units</span></td>
                <td>Rp {(p.totalQuantity * p.cost).toLocaleString()}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[p.status.toLowerCase().replace(/_/g, '')] || ''}`}>
                    {p.status}
                  </span>
                </td>
                <td className={styles.textRight}>
                   <div className={styles.actions}>
                      <button className={styles.adjustBtn} title="Quick Adjust"><Activity size={16}/></button>
                      <button className={styles.moreBtn}><MoreHorizontal size={16}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW PRODUCT MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
               <h2 className={styles.modalTitle}>Register Strategic Asset</h2>
               <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleCreateProduct}>
               <div className={styles.modalBody}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Product SKU</label>
                       <input 
                         type="text" 
                         className={styles.input}
                         required
                         placeholder="SKU-001"
                         value={newProduct.sku}
                         onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                       />
                    </div>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Product Name</label>
                       <input 
                         type="text" 
                         className={styles.input}
                         required
                         placeholder="Emerald Widget"
                         value={newProduct.name}
                         onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Category</label>
                    <select 
                      className={styles.select}
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      <option value="RAW_MATERIAL">Raw Material</option>
                      <option value="FINISHED_GOOD">Finished Good</option>
                      <option value="MERCHANDISE">Merchandise</option>
                      <option value="PACKAGING">Packaging</option>
                    </select>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Unit Cost (IDR)</label>
                       <input 
                         type="number" 
                         className={styles.input}
                         value={newProduct.cost}
                         onChange={(e) => setNewProduct({...newProduct, cost: Number(e.target.value)})}
                       />
                    </div>
                    <div className={styles.formGroup}>
                       <label className={styles.label}>Selling Price (IDR)</label>
                       <input 
                         type="number" 
                         className={styles.input}
                         value={newProduct.price}
                         onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                       />
                    </div>
                  </div>
               </div>
               <div className={styles.modalFooter}>
                  <button type="submit" className={styles.btnPrimary} style={{ width: '100%' }}>
                     {isSubmitting ? 'Registering...' : 'Add to Catalogue'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
