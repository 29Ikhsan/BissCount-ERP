'use client'

import { useState, useEffect } from 'react'
import { Package, TrendingUp, BarChart3, Info } from 'lucide-react'
import styles from './page.module.css'
import { useLanguage } from '@/context/LanguageContext'

export default function InventoryValuationPage() {
  const { formatCurrency } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchValuation() {
      try {
        const res = await fetch('/api/reports/inventory-valuation')
        const json = await res.json()
        setData(json)
      } catch (e) {
        console.error('Failed to fetch valuation')
      } finally {
        setLoading(false)
      }
    }
    fetchValuation()
  }, [])

  if (loading) return <div className={styles.loading}>Calculating Inventory Value...</div>
  if (!data || data.error || !data.summary) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h3>Valuation Report Error</h3>
          <p>{data?.error || 'Failed to generate summary data. Please ensure you have active inventory batches.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Asset Valuation Report</h1>
          <p className={styles.subtitle}>Valuation Method: <span className={styles.badge}>{data.summary.method}</span></p>
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Asset Value</div>
            <div className={styles.summaryValue}>{formatCurrency(data.summary.totalValue)}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Stock Qty</div>
            <div className={styles.summaryValue}>{data.summary.totalQuantity.toLocaleString()} Units</div>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.tablePanel}>
          <h2 className={styles.panelTitle}><BarChart3 size={18} /> Breakdown by Product</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Total Qty</th>
                <th style={{ textAlign: 'right' }}>Avg. Cost</th>
                <th style={{ textAlign: 'right' }}>Total Valuation</th>
              </tr>
            </thead>
            <tbody>
              {data.valuation.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.productName}>{item.name}</div>
                    {item.batchCount > 1 && <div className={styles.batchInfo}>{item.batchCount} Cost Batches</div>}
                  </td>
                  <td>{item.sku}</td>
                  <td>{item.category}</td>
                  <td style={{ textAlign: 'center' }}>{item.totalQuantity.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.averageCost)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.valuation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.infoPanel}>
          <h2 className={styles.panelTitle}><TrendingUp size={18} /> Insights</h2>
          <div className={styles.insightBox}>
            <div className={styles.insightIcon}><Package size={20} /></div>
            <div>
              <div className={styles.insightLabel}>Highest Value Asset</div>
              <div className={styles.insightText}>
                {data.valuation.length > 0 
                  ? [...data.valuation].sort((a,b) => b.valuation - a.valuation)[0].name
                  : 'N/A'}
              </div>
            </div>
          </div>
          <div className={styles.alertBox}>
            <Info size={16} />
            <p>This report calculates the cost value of assets based on your <strong>{data.summary.method}</strong> policy. Market value is not considered.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
