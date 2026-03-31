'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  FileText, 
  Filter, 
  ArrowUpDown,
  Building2,
  Wrench,
  Cpu,
  Server
} from 'lucide-react';
import styles from './page.module.css';

// --- Dummy Data ---
const inventoryItems = [
  { id: 1, name: 'Precision Sensor X-1', sku: 'SKU-20948-AB', category: 'Electronics', stock: 420, maxStock: 500, status: 'Optimal', price: '$124.50', supplier: 'Global Core Tech', icon: Cpu, iconColor: '#0F3B8C', iconBg: '#E0E7FF' },
  { id: 2, name: 'Titanium Alloy Housing', sku: 'SKU-11200-TI', category: 'Hardware', stock: 12, maxStock: 200, status: 'CRITICAL', price: '$2,400.00', supplier: 'Vulcan Metals Inc.', icon: Wrench, iconColor: '#EF4444', iconBg: '#FEE2E2' },
  { id: 3, name: 'Industrial Hub 12-Port', sku: 'SKU-99081-NH', category: 'Networking', stock: 45, maxStock: 100, status: 'Warning', price: '$89.00', supplier: 'Network Solutions Corp.', icon: Server, iconColor: '#F59E0B', iconBg: '#FEF3C7' },
  { id: 4, name: 'Fiber Optic Cable 10m', sku: 'SKU-33451-FO', category: 'Infrastructure', stock: 920, maxStock: 1000, status: 'Surplus', price: '$42.75', supplier: 'Global Core Tech', icon: Building2, iconColor: '#10B981', iconBg: '#D1FAE5' },
];

const topSuppliers = [
  { id: 'S1', name: 'Global Core Tech', type: 'Premium Partner', icon: Building2 },
  { id: 'S2', name: 'Vulcan Metals Inc.', type: 'A-Grade Supply', icon: Wrench },
];

export default function Inventory() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/inventory');
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          const mapped = data.products.map((prod: any) => {
            const totalQty = prod.inventoryLevels?.reduce((sum: number, lvl: any) => sum + lvl.quantity, 0) || 0;
            return {
              id: prod.id,
              name: prod.name,
              sku: prod.sku || 'N/A',
              category: prod.category || 'Product',
              stock: totalQty,
              maxStock: Math.max(500, totalQty * 2),
              status: totalQty > 20 ? 'Optimal' : totalQty > 0 ? 'Warning' : 'CRITICAL',
              price: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(prod.price || 0),
              supplier: 'Internal DB',
              icon: Cpu,
              iconColor: totalQty > 20 ? '#0F3B8C' : '#EF4444',
              iconBg: totalQty > 20 ? '#E0E7FF' : '#FEE2E2'
            };
          });
          setItems(mapped);
        }
      } catch (err) {
        console.error('Fetch inventory failed', err);
      }
    };
    fetchProducts();
  }, []);

  const handleAdjustStock = (id: string, currentStock: number, name: string) => {
    const inputStr = window.prompt(`Enter NEW absolute stock level for ${name}:`, currentStock.toString());
    if (inputStr === null || inputStr === "") return;
    
    const newStock = parseInt(inputStr.replace(/[^0-9-]/g, ""), 10);
    if (isNaN(newStock) || newStock < 0) {
      alert("Invalid stock amount entered.");
      return;
    }

    setItems(items.map(item => {
      if (item.id === id) {
        let newStatus = 'Optimal';
        if (newStock < 20) newStatus = 'CRITICAL';
        else if (newStock < 50) newStatus = 'Warning';
        else if (newStock > item.maxStock * 0.8) newStatus = 'Surplus';
        return { ...item, stock: newStock, status: newStatus };
      }
      return item;
    }));
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Inventory Overview</h1>
          <p className={styles.pageSubtitle}>Centralized stock monitoring and supply chain management.</p>
        </div>
        
        <div className={styles.headerActions}>
          <button className={styles.reportBtn}>
            <FileText size={16} /> Generate Stock Report
          </button>
          <button className={styles.addBtn} onClick={() => router.push('/inventory/new')}>
            <Plus size={16} /> Add New Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCardBlue}>
          <div className={styles.kpiLabel}>TOTAL STOCK VALUE</div>
          <div className={styles.kpiValue}>$1,284,590.00</div>
          <div className={styles.kpiTrend}>
            +4.2% from last month
          </div>
        </div>
        <div className={styles.kpiCardRed}>
          <div className={styles.kpiLabel}>LOW STOCK ITEMS</div>
          <div className={styles.kpiValueMain}>12</div>
          <div className={styles.kpiAction}>
             Action required immediately
          </div>
        </div>
        <div className={styles.kpiCardLightBlue}>
          <div className={styles.kpiLabel}>PENDING PURCHASE ORDERS</div>
          <div className={styles.kpiValueMain}>28</div>
          <div className={styles.kpiActionBlue}>
             8 arriving this week
          </div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.tableSection}>
          <div className={styles.tableControls}>
            <div className={styles.filterGroup}>
              <button className={styles.filterBtn}><Filter size={14}/> Filter</button>
              <button className={styles.filterBtn}><ArrowUpDown size={14}/> Sort By: Level</button>
            </div>
            <div className={styles.showingText}>Showing 15 of 248 items</div>
          </div>
          
          <table className={styles.inventoryTable}>
            <thead>
              <tr>
                <th>ITEM NAME & SKU</th>
                <th>CATEGORY</th>
                <th>STOCK LEVEL</th>
                <th>UNIT PRICE</th>
                <th>SUPPLIER</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemIcon} style={{backgroundColor: item.iconBg, color: item.iconColor}}>
                        <item.icon size={18} />
                      </div>
                      <div>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemSku}>{item.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.categoryBadge}>{item.category}</span>
                  </td>
                  <td>
                    <div className={styles.stockInfo}>
                      <div className={styles.stockLabelRow}>
                        <span className={styles.stockNumbers}>{item.stock}/{item.maxStock}</span>
                        <span className={`${styles.stockStatus} ${styles[item.status]}`}>{item.status}</span>
                      </div>
                      <div className={styles.stockBarBg}>
                        <div 
                          className={`${styles.stockBarFill} ${styles[item.status + 'Bg']}`} 
                          style={{width: `${(item.stock / item.maxStock) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td><div className={styles.itemPrice}>{item.price}</div></td>
                  <td>
                    <div className={styles.supplierName}>{item.supplier}</div>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                    <button 
                      style={{ background: 'white', color: '#3B82F6', border: '1px solid #BFDBFE', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', transition: 'all 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      onClick={() => handleAdjustStock(item.id, item.stock, item.name)}
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                   <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No inventory items found. Add products to start tracking warehouse levels.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className={styles.loadMoreContainer}>
             <button className={styles.loadMoreBtn}>Load More Items</button>
          </div>
        </div>

        <div className={styles.sideSection}>
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>TOP SUPPLIERS</h3>
            <div className={styles.supplierList}>
              {topSuppliers.map((supplier) => (
                <div key={supplier.id} className={styles.supplierItem}>
                  <div className={styles.supplierIconBox}>
                    <supplier.icon size={16} />
                  </div>
                  <div>
                    <div className={styles.supplierNameLabel}>{supplier.name}</div>
                    <div className={styles.supplierTypeLabel}>{supplier.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sideCard}>
             <h3 className={styles.sideTitle}>RECENT ADJUSTMENTS</h3>
             <div className={styles.timeline}>
               <div className={styles.timelineItem}>
                 <div className={styles.timelineDot}></div>
                 <div className={styles.timelineContent}>
                   <div className={styles.timelineHeader}>
                     <span className={styles.timelineAction}>Stock-In: 500 Units</span>
                     <span className={styles.timelineTime}>2h ago</span>
                   </div>
                   <div className={styles.timelineDesc}>Precision Sensor X-1 arrived from Global Core Tech.</div>
                 </div>
               </div>
               
               <div className={styles.timelineItem}>
                 <div className={styles.timelineDot}></div>
                 <div className={styles.timelineContent}>
                   <div className={styles.timelineHeader}>
                     <span className={styles.timelineAction}>Adjustment: -12 Units</span>
                     <span className={styles.timelineTime}>5h ago</span>
                   </div>
                   <div className={styles.timelineDesc}>Damaged goods reported during manual warehouse audit.</div>
                 </div>
               </div>

               <div className={styles.timelineItem}>
                 <div className={styles.timelineDot}></div>
                 <div className={styles.timelineContent}>
                   <div className={styles.timelineHeader}>
                     <span className={styles.timelineAction}>Internal Transfer</span>
                     <span className={styles.timelineTime}>Yesterday</span>
                   </div>
                   <div className={styles.timelineDesc}>100 units moved from Main to East-Wing Hub.</div>
                 </div>
               </div>
             </div>
          </div>

          <div className={styles.optimizeCard}>
            <div className={styles.optimizeOverlay}></div>
            <div className={styles.optimizeContent}>
              <h3 className={styles.optimizeTitle}>Optimize Your Space</h3>
              <p className={styles.optimizeDesc}>Learn about our new AI-driven slotting optimization module.</p>
              <button className={styles.optimizeBtn}>View Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
