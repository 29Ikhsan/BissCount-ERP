'use client';

import React, { useState, useEffect } from 'react';
import styles from './AuditPage.module.css';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: any;
  createdAt: string;
  user?: { name: string };
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/audit')
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch audit logs:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>Forensic Audit Trail</h1>
          <p>Complete immutable record of all system mutations for compliance and accountability.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportBtn}>Export CSV</button>
        </div>
      </header>

      {loading ? (
        <div className={styles.loader}>Loading forensic logs...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity</th>
                <th>ID</th>
                <th>Details</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[log.action.toLowerCase()] || ''}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entity}</td>
                  <td className={styles.mono}>{log.entityId.slice(0, 8)}...</td>
                  <td>
                    <pre className={styles.details}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                  <td>{log.user?.name || 'System Auto'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
