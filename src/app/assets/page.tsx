'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Monitor, Building, Tractor, Cpu, CalendarClock, History, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';
import { exportToCSV } from '@/lib/utils';
import { Check } from 'lucide-react';

// --- Dummy Data ---
const initialAssets = [
  { id: 'AST-001', name: 'MacBook Pro M3 Max 16"', category: 'IT Equipment', icon: Cpu, purchaseDate: '2023-01-15', cost: 4200, accDepreciation: 1400, bookValue: 2800, status: 'Active' },
  { id: 'AST-002', name: 'MacBook Air M2', category: 'IT Equipment', icon: Cpu, purchaseDate: '2023-03-22', cost: 1400, accDepreciation: 350, bookValue: 1050, status: 'Active' },
  { id: 'AST-003', name: 'HQ Office Furniture', category: 'Furniture', icon: Building, purchaseDate: '2022-11-10', cost: 15500, accDepreciation: 4650, bookValue: 10850, status: 'Active' },
  { id: 'AST-004', name: 'Dell PowerEdge Server', category: 'IT Equipment', icon: Monitor, purchaseDate: '2021-06-05', cost: 8500, accDepreciation: 8500, bookValue: 0, status: 'Disposed' },
  { id: 'AST-005', name: 'Delivery Van (Ford Transit)', category: 'Vehicles', icon: Tractor, purchaseDate: '2023-08-14', cost: 45000, accDepreciation: 7500, bookValue: 37500, status: 'Active' },
];

export default function FixedAssets() {
  const router = useRouter();
  const { t, formatCurrency } = useLanguage();
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [toast, setToast] = useState<{ visible: boolean, message: string } | null>(null);
  
  // History Modal State
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      if (data.assets) setAssets(data.assets);
    } catch (e) {
      console.error('Failed to fetch assets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchHistory = async (assetId: string) => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/assets/history?assetId=${assetId}`);
      const data = await res.json();
      setAssetHistory(data.history || []);
    } catch (e) {
      console.error('Failed to fetch asset history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const triggerToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  const getIconForCategory = (cat: string) => {
    switch(cat) {
      case 'IT Equipment': return Cpu;
      case 'Furniture': return Building;
      case 'Vehicles': return Tractor;
      default: return Monitor;
    }
  };

  const filteredAssets = assets.filter(asset => 
    (asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     asset.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterCategory === 'All Categories' || asset.category === filterCategory)
  );


  const handleRunDepreciation = async () => {
    try {
      const res = await fetch('/api/assets', { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        triggerToast(data.message || "Monthly depreciation run completed and posted to Ledger.");
        fetchAssets();
      } else {
        alert("Failed to run depreciation: " + data.error);
      }
    } catch (e) {
      alert("Network error running depreciation.");
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Category', 'Cost', 'AccDepr', 'BookValue'];
    const data = filteredAssets.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      cost: a.cost,
      accdepr: a.accumulatedDepr,
      bookvalue: a.cost - a.accumulatedDepr
    }));
    exportToCSV('AKSIA_Asset_Register.csv', headers, data);
  };

  const totalCost = assets.reduce((sum, item) => sum + item.cost, 0);
  const totalAccDepr = assets.reduce((sum, item) => sum + item.accumulatedDepr, 0);
  const totalBookValue = totalCost - totalAccDepr;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>{t('FixedAssets')}</h1>
          <p className={styles.pageSubtitle}>Manage capital equipment, calculate depreciation, and track physical assets.</p>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.btnOutline} onClick={handleRunDepreciation}>
            <CalendarClock size={16} /> Run Depreciation
           </button>
           <button className={styles.btnPrimary} onClick={() => router.push('/assets/new')}>
            <Plus size={16} /> Register Asset
           </button>
        </div>
      </div>

      {toast?.visible && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#10B981', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> {toast.message}
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>{t('TotalAssetValue')}</div>
          <div className={styles.kpiValue}>{formatCurrency(totalCost)}</div>
          <div className={styles.kpiDesc}>Historical cost basis</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>{t('Depreciation')}</div>
          <div className={styles.kpiValue}>{formatCurrency(totalAccDepr)}</div>
          <div className={styles.kpiDesc}>Life-to-date schedule</div>
        </div>
        <div className={styles.kpiCardActive}>
          <div className={styles.kpiLabelActive}>{t('NetBookValue')}</div>
          <div className={styles.kpiValueActive}>{formatCurrency(totalBookValue)}</div>
          <div className={styles.kpiDescActive}>Current balance sheet impact</div>
        </div>
      </div>

      <div className={styles.listContainer}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search assets by ID or Name..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.toolbarActions}>
            <select 
              className={styles.btnFilter} 
              style={{ appearance: 'none', paddingRight: '24px' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option>All Categories</option>
              <option>IT Equipment</option>
              <option>Furniture</option>
              <option>Vehicles</option>
            </select>
            <button className={styles.btnFilter} style={{ marginLeft: '8px' }} onClick={handleExport}>
              Generate CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.assetTable}>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>ASSET DETAILS</th>
                <th style={{ width: '15%' }}>CATEGORY</th>
                <th style={{ width: '15%' }}>PURCHASE DATE</th>
                <th style={{ width: '15%', textAlign: 'right' }}>ORIGINAL COST</th>
                <th style={{ width: '10%', textAlign: 'right' }}>ACC. DEPR.</th>
                <th style={{ width: '15%', textAlign: 'right' }}>BOOK VALUE</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const CategoryIcon = getIconForCategory(asset.category);
                const bookValue = asset.cost - asset.accumulatedDepr;
                return (
                  <tr key={asset.id} className={asset.status === 'DISPOSED' ? styles.rowDisabled : ''}>
                    <td>
                      <div className={styles.assetInfoRow}>
                        <div className={styles.assetIconBox}>
                          <CategoryIcon size={18} />
                        </div>
                        <div className={styles.assetDetails}>
                          <span className={styles.assetName}>{asset.name}</span>
                          <span className={styles.assetId}>{asset.id.slice(0,8).toUpperCase()} • {asset.status}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.badgeLabel}>{asset.category}</span>
                    </td>
                    <td className={styles.dateText}>{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                    <td className={`${styles.textRight} ${styles.moneyText}`}>
                      {formatCurrency(asset.cost)}
                    </td>
                    <td className={`${styles.textRight} ${styles.moneyTextSecondary}`}>
                      {formatCurrency(asset.accumulatedDepr)}
                    </td>
                    <td className={`${styles.textRight} ${styles.moneyTextPrimary}`}>
                      {formatCurrency(bookValue)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                       <button 
                        className={styles.iconBtn} 
                        onClick={() => {
                          setSelectedAsset(asset);
                          fetchHistory(asset.id);
                        }}
                        title="View History"
                       >
                         <History size={16} />
                       </button>
                    </td>
                  </tr>
                );
              })}
              
              {filteredAssets.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    No fixed assets found matching "{searchQuery}"
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Loading assets...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {selectedAsset && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Depreciation History</h3>
                <p className={styles.modalSubtitle}>{selectedAsset.name}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedAsset(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {isHistoryLoading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading history...</div>
              ) : assetHistory.length === 0 ? (
                <div className={styles.emptyHistory}>No depreciation runs found for this asset.</div>
              ) : (
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th style={{ textAlign: 'right' }}>Amount Charged</th>
                      <th style={{ textAlign: 'right' }}>Date Processed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetHistory.map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{new Date(h.year, h.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                        <td style={{ textAlign: 'right', color: '#EF4444' }}>-{formatCurrency(h.amount)}</td>
                        <td style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
