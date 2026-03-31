'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Monitor, Building, Tractor, Cpu, CalendarClock } from 'lucide-react';
import styles from './page.module.css';

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = initialAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    asset.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const totalCost = initialAssets.reduce((sum, item) => sum + item.cost, 0);
  const totalBookValue = initialAssets.reduce((sum, item) => sum + item.bookValue, 0);
  const totalAccDepr = initialAssets.reduce((sum, item) => sum + item.accDepreciation, 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Fixed Assets Register</h1>
          <p className={styles.pageSubtitle}>Manage capital equipment, calculate depreciation, and track physical assets.</p>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.btnOutline}>
            <CalendarClock size={16} /> Run Depreciation
           </button>
           <button className={styles.btnPrimary} onClick={() => router.push('/assets/new')}>
            <Plus size={16} /> Register Asset
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>TOTAL ASSET COST</div>
          <div className={styles.kpiValue}>{formatCurrency(totalCost)}</div>
          <div className={styles.kpiDesc}>Historical cost basis</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>ACCUMULATED DEPRECIATION</div>
          <div className={styles.kpiValue}>{formatCurrency(totalAccDepr)}</div>
          <div className={styles.kpiDesc}>Life-to-date schedule</div>
        </div>
        <div className={styles.kpiCardActive}>
          <div className={styles.kpiLabelActive}>NET BOOK VALUE</div>
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
            <button className={styles.btnFilter}>
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <table className={styles.assetTable}>
          <thead>
            <tr>
              <th style={{ width: '30%' }}>ASSET DETAILS</th>
              <th style={{ width: '15%' }}>CATEGORY</th>
              <th style={{ width: '15%' }}>PURCHASE DATE</th>
              <th style={{ width: '15%', textAlign: 'right' }}>ORIGINAL COST</th>
              <th style={{ width: '10%', textAlign: 'right' }}>ACC. DEPR.</th>
              <th style={{ width: '15%', textAlign: 'right' }}>BOOK VALUE</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className={asset.status === 'Disposed' ? styles.rowDisabled : ''}>
                <td>
                  <div className={styles.assetInfoRow}>
                    <div className={styles.assetIconBox}>
                      <asset.icon size={18} />
                    </div>
                    <div className={styles.assetDetails}>
                      <span className={styles.assetName}>{asset.name}</span>
                      <span className={styles.assetId}>{asset.id} • {asset.status}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={styles.badgeLabel}>{asset.category}</span>
                </td>
                <td className={styles.dateText}>{asset.purchaseDate}</td>
                <td className={`${styles.textRight} ${styles.moneyText}`}>
                  {formatCurrency(asset.cost)}
                </td>
                <td className={`${styles.textRight} ${styles.moneyTextSecondary}`}>
                  {formatCurrency(asset.accDepreciation)}
                </td>
                <td className={`${styles.textRight} ${styles.moneyTextPrimary}`}>
                  {formatCurrency(asset.bookValue)}
                </td>
              </tr>
            ))}
            
            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No fixed assets found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
