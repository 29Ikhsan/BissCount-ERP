'use client'

import { useState, useEffect } from 'react'
import { Shield, Search, ClipboardList, Clock, User as UserIcon, Tag } from 'lucide-react'
import styles from './page.module.css'
import { useLanguage } from '@/context/LanguageContext'

export default function AuditLogPage() {
  const { formatCurrency } = useLanguage()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/settings/audit') // I need to create this API
        const json = await res.json()
        setLogs(json.logs || [])
      } catch (e) {
        console.error('Failed to fetch audit logs')
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => 
    log.entity.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entityId.toLowerCase().includes(search.toLowerCase())
  )

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CREATE': return '#10B981';
      case 'UPDATE': return '#3B82F6';
      case 'DELETE': return '#EF4444';
      case 'POST': return '#8B5CF6';
      case 'DEPRECIATE': return '#F59E0B';
      default: return '#64748b';
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}><Shield size={24} style={{ marginRight: '10px', verticalAlign: 'bottom' }} /> System Audit Trail</h1>
          <p className={styles.subtitle}>Track every creation, modification, and financial posting across the organization.</p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Action, Entity, or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.logList}>
        {loading ? (
          <div className={styles.loading}>Loading audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.empty}>No audit records found.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={styles.logItem}>
              <div className={styles.logBadge} style={{ backgroundColor: getActionColor(log.action) }}>
                {log.action}
              </div>
              <div className={styles.logMain}>
                <div className={styles.logHeader}>
                  <span className={styles.entityName}><Tag size={14} /> {log.entity}</span>
                  <span className={styles.logTime}><Clock size={12} /> {new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <div className={styles.logDetails}>
                  <strong>ID:</strong> {log.entityId.slice(0, 12)}...
                  {log.details && (
                    <div className={styles.detailsJson}>
                      {Object.entries(log.details).map(([k, v]: [string, any]) => (
                        <span key={k} className={styles.detailTag}>{k}: {typeof v === 'number' ? formatCurrency(v) : String(v)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.logUser}>
                <UserIcon size={14} /> {log.user?.name || 'System Bot'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
