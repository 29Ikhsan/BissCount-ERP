'use client';

import React, { useEffect, useState } from 'react';
import styles from './AuditPage.module.css';
import { Shield, Search, RefreshCw, Clock } from 'lucide-react';
import RoleGuard from '@/components/common/RoleGuard';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: any;
  createdAt: string;
  user: {
    name: string;
    email: string;
  } | null;
}

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    log.entityId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RoleGuard moduleKey="Settings">
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleInfo}>
            <div className={styles.pageBadge}><Shield size={14} /> SYSTEM SECURITY</div>
            <h1>Audit & Security Logs</h1>
            <p>Immutable record of critical administrative actions and governance changes.</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.refreshBtn} onClick={fetchLogs} disabled={loading}>
               <RefreshCw size={16} className={loading ? styles.spin : ''}/>
               Refresh Logs
            </button>
          </div>
        </header>

        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
             <div className={styles.searchBox}>
                <Search size={16} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="Search by action, admin, or ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>
          
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action Taken</th>
                <th>Target Entity</th>
                <th>Payload Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>Loading security records...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>No audit logs found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className={styles.logTime}>
                        <Clock size={14} />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div className={styles.adminInfo}>
                        {log.user ? (
                          <>
                            <span className={styles.adminName}>{log.user.name}</span>
                            <span className={styles.adminEmail}>{log.user.email}</span>
                          </>
                        ) : (
                          <span className={styles.adminName}>System Service</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.actionBadge} ${styles[log.action] || ''}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className={styles.entityInfo}>
                         {log.entity}
                         <div className={styles.entityId}>{log.entityId}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.detailsBox}>
                        {log.details ? JSON.stringify(log.details, null, 2) : 'No payload details'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RoleGuard>
  );
}
