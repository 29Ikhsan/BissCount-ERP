'use client';

import { 
  Key, 
  Code2, 
  Terminal, 
  Copy, 
  Plus, 
  Trash2, 
  ChevronDown, 
  Globe
} from 'lucide-react';
import { useState } from 'react';
import styles from './page.module.css';
import { Check } from 'lucide-react';

export default function DeveloperPlatform() {
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'POS Integration', key: 'sk_live_51Pq...j8x9', created: '2024-03-24', status: 'Active' },
    { id: '2', name: 'Marketplace Sync', key: 'sk_live_12x...k3a2', created: '2024-03-20', status: 'Active' },
  ]);
  const [toast, setToast] = useState<{ visible: boolean, message: string } | null>(null);

  const triggerToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateKey = () => {
    const name = window.prompt("Enter a name for the new API Key:");
    if (!name) return;
    const newKey = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      key: `sk_live_${Math.random().toString(36).substr(2, 12)}...${Math.random().toString(36).substr(2, 4)}`,
      created: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    setApiKeys([...apiKeys, newKey]);
    triggerToast("New API secret key generated successfully.");
  };

  const handleRevokeKey = (id: string) => {
    if (window.confirm("Are you sure you want to revoke this key? All applications using this key will immediately lose access.")) {
      setApiKeys(apiKeys.filter(k => k.id !== id));
      triggerToast("API Key has been revoked and disabled.");
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    triggerToast("Secret key copied to clipboard.");
  };

  const endpoints = [
    { method: 'POST', path: '/api/v1/invoices', desc: 'Create a new sales invoice directly in the system.', methodClass: styles.methodPost },
    { method: 'GET', path: '/api/v1/inventory', desc: 'Retrieve real-time stock levels for all warehouses.', methodClass: styles.methodGet },
    { method: 'POST', path: '/api/v1/expenses', desc: 'Record operational spending for automated bookkeeping.', methodClass: styles.methodPost },
    { method: 'GET', path: '/api/v1/ledger', desc: 'Fetch the complete General Ledger for custom auditing and external reporting.', methodClass: styles.methodGet },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}><Terminal style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Developer Platform</h1>
          <p className={styles.pageSubtitle}>Connect your POS, Marketplace, or custom internal systems directly to BizzCount ERP.</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleCreateKey}>
          <Plus size={16} /> Create New Secret Key
        </button>
      </div>

      {toast?.visible && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#10B981', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> {toast.message}
        </div>
      )}

      {/* API Keys Section */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}><Key size={18} /> API Secret Keys</h2>
        <p className={styles.helpText} style={{ marginBottom: '20px' }}>
          Use these keys to authenticate requests from your external applications. 
          <span style={{ color: '#DC2626', fontWeight: 'bold' }}> Never share your secret keys</span> or expose them in client-side code.
        </p>

        <div className={styles.apiKeyList}>
          {apiKeys.map((key) => (
            <div key={key.id} className={styles.apiKeyItem}>
              <div className={styles.keyInfo}>
                <span className={styles.keyName}>{key.name}</span>
                <span className={styles.keyMeta}>Created on {key.created} • Status: {key.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <code className={styles.keyCode}>{key.key}</code>
                <button title="Copy to clipboard" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }} onClick={() => handleCopy(key.key)}>
                  <Copy size={16} />
                </button>
                <button title="Revoke Key" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }} onClick={() => handleRevokeKey(key.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Documentation Preview */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}><Globe size={18} /> API Reference (OpenAPI Spec)</h2>
        <p className={styles.helpText} style={{ marginBottom: '20px' }}>
          Explore our RESTful API endpoints. We support JSON payloads and standard HTTP methods.
        </p>

        {endpoints.map((ep) => (
          <div key={ep.path} className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={`${styles.method} ${ep.methodClass}`}>{ep.method}</span>
              <span className={styles.path}>{ep.path}</span>
              <span style={{ marginLeft: 'auto', color: '#94A3B8' }}><ChevronDown size={14} /></span>
            </div>
            <div className={styles.docBody}>
              <p className={styles.helpText}>{ep.desc}</p>
              <div className={styles.codeBlock}>
{`curl -X ${ep.method} https://api.bizzcount.com${ep.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"${ep.method === 'POST' ? ` \\
  -d '{
    "data": "...",
    "reference": "REQ-123"
  }'` : ''}`}
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <button className={styles.btnPrimary} style={{ backgroundColor: '#F8FAFC', color: '#1E293B', borderColor: '#E2E8F0' }}>
            <Code2 size={16} /> View Full OpenAPI Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
