'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ArrowLeft, 
  Settings, 
  Box, 
  Save, 
  AlertCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

export default function BOMPage() {
  const { t, formatCurrency } = useLanguage();
  const [boms, setBoms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [bomItems, setBomItems] = useState<{ rawProductId: string, quantityRequired: number }[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bomRes, prodRes] = await Promise.all([
        fetch('/api/production/bom'),
        fetch('/api/inventory')
      ]);
      const bomData = await bomRes.json();
      const prodData = await prodRes.json();
      
      setBoms(Array.isArray(bomData) ? bomData : []);
      setProducts(prodData.products || []);
    } catch (e) {
      console.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRow = () => {
    setBomItems([...bomItems, { rawProductId: '', quantityRequired: 1 }]);
  };

  const handleRemoveRow = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...bomItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBomItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedProductId || bomItems.length === 0) {
      alert("Please select a product and add at least one material.");
      return;
    }

    try {
      const res = await fetch('/api/production/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finishedProductId: selectedProductId, items: bomItems })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        setSelectedProductId('');
        setBomItems([]);
      } else {
        const err = await res.json();
        alert("Error: " + err.error);
      }
    } catch (e) {
      alert("Network Error");
    }
  };

  const filteredBoms = boms.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}><Settings size={22} color="#0EA5E9"/></div>
          <div>
            <h1 className={styles.title}>BOM Recipes</h1>
            <p className={styles.subtitle}>Define your production blueprints and material requirements.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon}/>
            <input 
              type="text" 
              placeholder="Search recipes..." 
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
            <Plus size={16}/> Create Recipe
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Accessing manufacturing blueprints...</div>
      ) : (
        <div className={styles.bomGrid}>
          {filteredBoms.map(bom => (
            <div key={bom.id} className={styles.bomCard}>
              <div className={styles.cardHeader}>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{bom.name}</h3>
                  <span className={styles.sku}>{bom.sku}</span>
                </div>
                <button className={styles.editBtn} onClick={() => {
                  setSelectedProductId(bom.id);
                  setBomItems(bom.finishedBOMItems.map((item: any) => ({
                    rawProductId: item.rawProductId,
                    quantityRequired: item.quantityRequired
                  })));
                  setIsModalOpen(true);
                }}>Edit</button>
              </div>
              <div className={styles.materialList}>
                {bom.finishedBOMItems.map((item: any) => (
                  <div key={item.id} className={styles.materialItem}>
                    <span className={styles.matName}>{item.rawProduct.name}</span>
                    <span className={styles.matQty}>{item.quantityRequired} units</span>
                  </div>
                ))}
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.costStats}>
                  <span className={styles.totalCost}>
                    Est. Cost: {formatCurrency(
                      bom.finishedBOMItems.reduce((acc: number, item: any) => acc + (item.quantityRequired * (item.rawProduct.cost || 0)), 0)
                    )}
                  </span>
                  {bom.price > 0 && (
                    <div className={styles.marginBadge}>
                      <TrendingUp size={12}/>
                      {Math.round(((bom.price - bom.finishedBOMItems.reduce((acc: number, item: any) => acc + (item.quantityRequired * (item.rawProduct.cost || 0)), 0)) / bom.price) * 100)}% Margin
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredBoms.length === 0 && (
            <div className={styles.emptyState}>No BOM recipes defined. Click 'Create Recipe' to start.</div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedProductId ? 'Edit BOM Recipe' : 'New BOM Recipe'}</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Finished Good (Final Product)</label>
                <select 
                  className={styles.select} 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  disabled={!!selectedProductId && boms.some(b => b.id === selectedProductId)}
                >
                  <option value="">Select Product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className={styles.bomBuilder}>
                <div className={styles.builderHeader}>
                  <span>Raw Materials & Components</span>
                  <button className={styles.btnAddRow} onClick={handleAddRow}>+ Add Material</button>
                </div>
                {bomItems.map((item, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <select 
                      className={styles.itemSelect}
                      value={item.rawProductId}
                      onChange={(e) => handleItemChange(idx, 'rawProductId', e.target.value)}
                    >
                      <option value="">Select Material...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.cost || 0)})</option>
                      ))}
                    </select>
                    <div className={styles.qtyBox}>
                      <input 
                        type="number" 
                        className={styles.qtyInput} 
                        value={item.quantityRequired}
                        onChange={(e) => handleItemChange(idx, 'quantityRequired', e.target.value)}
                        placeholder="Qty"
                      />
                      <span className={styles.unitLabel}>Units</span>
                    </div>
                    <button className={styles.removeBtn} onClick={() => handleRemoveRow(idx)}>
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalSummary}>
                <div className={styles.summaryRow}>
                  <span>Total Content Cost:</span>
                  <span className={styles.summaryPrice}>
                    {formatCurrency(
                      bomItems.reduce((acc, item) => {
                        const p = products.find(prod => prod.id === item.rawProductId);
                        return acc + (item.quantityRequired * (p?.cost || 0));
                      }, 0)
                    )}
                  </span>
                </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSubmit}>
                <Save size={16}/> Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
