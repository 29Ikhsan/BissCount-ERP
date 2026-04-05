'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { 
  Package, 
  Plus, 
  Play, 
  CheckCircle, 
  Settings, 
  Search, 
  Filter, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Box,
  Layout,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

import LedgerPulse from '@/components/accounting/LedgerPulse';
import { X } from 'lucide-react';

export default function ProductionDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New States for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [newOrder, setNewOrder] = useState({
    productId: '',
    quantity: 1,
    warehouseId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [prodRes, orderRes, whRes] = await Promise.all([
        fetch('/api/products?type=FINISHED_GOOD'),
        fetch('/api/production'),
        fetch('/api/inventory/warehouses')
      ]);
      
      const prodData = await prodRes.json();
      const orderData = await orderRes.json();
      const whData = await whRes.json();
      
      setProducts(prodData.products || []);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setWarehouses(whData.warehouses || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewOrder({ productId: '', quantity: 1, warehouseId: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startProduction = async (id: string) => {
    const res = await fetch('/api/production', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'START' })
    });
    if (res.ok) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'IN_PROGRESS' } : o));
    }
  };

  const completeProduction = async (id: string) => {
    const res = await fetch('/api/production', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'COMPLETE' })
    });
    if (res.ok) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'COMPLETED' } : o));
    }
  };

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing AKSIA Workshop Floor...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox} style={{ backgroundColor: 'rgba(39, 156, 90, 0.1)' }}>
            <Layers size={24} color="#279C5A"/>
          </div>
          <div>
            <h1 className={styles.title}>AKSIA Manufacturing</h1>
            <p className={styles.subtitle}>Institutional control of manufacturing cycles and BOM assets.</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Link href="/production/bom" className={styles.btnSecondary}><Settings size={16}/> BOM Registry</Link>
          <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
            <Plus size={16}/> Create Work Order
          </button>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.leftCol}>
          {/* Manufacturing Analytics Summary */}
          <div className={styles.statsBar}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(39, 156, 90, 0.1)' }}>
                <TrendingUp size={18} color="#279C5A"/>
              </div>
              <div className={styles.statInfo}>
                 <span className={styles.statLabel}>YIELD QUALITY</span>
                 <span className={styles.statValue}>98.4%</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Layers size={18} color="#3B82F6"/>
              </div>
              <div className={styles.statInfo}>
                 <span className={styles.statLabel}>ACTIVE RUNS</span>
                 <span className={styles.statValue}>{orders.filter(o => o.status === 'IN_PROGRESS').length}</span>
              </div>
            </div>
          </div>

          {/* Production List (Workshop Queue) */}
          <div className={styles.workshopHub}>
            <div className={styles.workshopHeader}>
               <div className={styles.headerTitleGroup}>
                  <h2 className={styles.panelTitle}>Workshop Floor Queue</h2>
                  <span className={styles.liveIndicator}>LIVE TRACKING</span>
               </div>
               <div className={styles.searchBox}>
                  <Search size={14} color="#94A3B8"/>
                  <input type="text" placeholder="Filter orders..." className={styles.searchInput}/>
               </div>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>BATCH</th>
                  <th>PRODUCTION TARGET</th>
                  <th>STATUS</th>
                  <th className={styles.textRight}>WORKFLOW</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className={styles.row}>
                    <td className={styles.orderNo}>#{order.orderNo}</td>
                    <td>
                      <div className={styles.productInfo}>
                        <p className={styles.productName}>{order.product?.name}</p>
                        <span className={styles.productSku}>{order.quantity} Units • {order.warehouse?.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.textRight}>
                      <div className={styles.actions}>
                        {order.status === 'PLANNED' && (
                          <button className={styles.startBtn} onClick={() => startProduction(order.id)}>
                            Launch <Play size={14}/>
                          </button>
                        )}
                        {order.status === 'IN_PROGRESS' && (
                          <button className={styles.completeBtn} onClick={() => completeProduction(order.id)}>
                            Finalize <CheckCircle size={14}/>
                          </button>
                        )}
                        {order.status === 'COMPLETED' && (
                          <div className={styles.successMeta}>
                             <CheckCircle size={14} color="#279C5A"/>
                             <span style={{ color: '#279C5A', fontWeight: 700 }}>Invoiced to Asset</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Ledger Pulse */}
        <div className={styles.rightCol}>
           <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>Financial Integrity</h3>
              <LedgerPulse />
           </div>
           
           <div className={styles.auditCard}>
              <p className={styles.auditText}>
                <strong>Compliance Note:</strong> All manufacturing completions trigger an automatic 
                Journal Entry (Debit: Finished Goods 1004, Credit: Raw Materials 1002).
              </p>
           </div>
        </div>
      </div>

      {/* NEW WORK ORDER MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Launch Work Order</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Product to Produce</label>
                  <select 
                    className={styles.select}
                    required
                    value={newOrder.productId}
                    onChange={(e) => setNewOrder({...newOrder, productId: e.target.value})}
                  >
                    <option value="">Select Finished Good</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Target Quantity</label>
                  <input 
                    type="number" 
                    className={styles.input}
                    min="1"
                    required
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder({...newOrder, quantity: parseInt(e.target.value)})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Storage Warehouse</label>
                  <select 
                    className={styles.select}
                    required
                    value={newOrder.warehouseId}
                    onChange={(e) => setNewOrder({...newOrder, warehouseId: e.target.value})}
                  >
                    <option value="">Select Target Warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Scheduling...' : 'Launch Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
