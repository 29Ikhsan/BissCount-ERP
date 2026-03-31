'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, ArrowLeft, Filter, Upload, X, FileSpreadsheet, Download } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.accounts) setAccounts(data.accounts);
    } catch (e) {
      console.error('Failed to fetch accounts', e);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    acc.code.includes(searchQuery)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'ASSET': return styles.badgeSuccess;
      case 'REVENUE': return styles.badgePrimary;
      case 'EXPENSE': return styles.badgeWarning;
      case 'LIABILITY': return styles.badgeDanger;
      case 'EQUITY': return styles.badgePurple;
      default: return styles.badgeDefault;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        alert("Invalid CSV: Too few rows");
        setIsUploading(false);
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const codeIdx = headers.indexOf('code');
      const nameIdx = headers.indexOf('name');
      const typeIdx = headers.indexOf('type');
      
      if (codeIdx === -1 || nameIdx === -1 || typeIdx === -1) {
        alert("Invalid CSV format: Must contain 'Code', 'Name', and 'Type' exactly as headers.");
        setIsUploading(false);
        return;
      }

      const parsedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          code: values[codeIdx],
          name: values[nameIdx],
          type: values[typeIdx]
        };
      });

      try {
        const res = await fetch('/api/accounts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accounts: parsedData })
        });
        
        const responseData = await res.json();
        if (res.ok) {
           alert(responseData.message || "Import completed!");
           setIsImportModalOpen(false);
           fetchAccounts(); // Refresh the active list
        } else {
           alert(`Error: ${responseData.error}`);
        }
      } catch(err) {
        alert("Network error communicating with import server.");
      } finally {
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/settings" className={styles.backBtn}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className={styles.pageTitle}>Chart of Accounts (COA)</h1>
            <p className={styles.pageSubtitle}>Manage your organization's general ledger accounts and tracking categories.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.btnOutline} onClick={() => setIsImportModalOpen(true)}>
            <Upload size={16} /> Import
          </button>
          <button className={styles.btnPrimary}>
            <Plus size={16} /> New Account
          </button>
        </div>
      </div>

      <div className={styles.cardContainer}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by code or name..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.btnOutline}>
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Table */}
        <table className={styles.coaTable}>
          <thead>
            <tr>
              <th style={{ width: '10%' }}>CODE</th>
              <th style={{ width: '40%' }}>ACCOUNT NAME</th>
              <th style={{ width: '20%' }}>TYPE</th>
              <th style={{ width: '20%' }} className={styles.textRight}>CURRENT BALANCE</th>
              <th style={{ width: '10%' }} className={styles.textRight}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc) => (
              <tr key={acc.id}>
                <td className={styles.codeText}>{acc.code}</td>
                <td className={styles.nameText}>{acc.name}</td>
                <td>
                  <span className={`${styles.badge} ${getTypeStyle(acc.type)}`}>
                    {acc.type}
                  </span>
                </td>
                <td className={`${styles.textRight} ${styles.balanceText}`}>
                  {formatCurrency(acc.balance)}
                </td>
                <td className={styles.textRight}>
                  <div className={styles.actionGroup}>
                    <button className={styles.iconBtn}><Edit2 size={16} /></button>
                    <button className={`${styles.iconBtn} ${styles.dangerIcon}`}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  No accounts found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Import Chart of Accounts</h3>
              <button className={styles.iconBtn} onClick={() => setIsImportModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.helpText} style={{ marginBottom: '16px', color: '#6B7280', fontSize: '14px' }}>
                Upload a CSV or Excel file containing your account hierarchy. The file must include 'Code', 'Name', and 'Type' columns.
              </p>
              
              <div 
                className={styles.dropZone} 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  border: '2px dashed #CBD5E1', 
                  borderRadius: '8px', 
                  padding: '40px 20px', 
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.6 : 1
                }}>
                <input 
                  type="file" 
                  accept=".csv"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <FileSpreadsheet size={32} style={{ color: '#94A3B8', marginBottom: '12px' }} />
                <div style={{ fontWeight: 600, color: '#0F3B8C', marginBottom: '4px' }}>
                   {isUploading ? 'Parsing Document...' : 'Click to browse CSV file here'}
                </div>
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>Supported formats: .csv only (Row 1 must be Headers)</div>
              </div>
              
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a href="data:text/csv;charset=utf-8,Code,Name,Type%0A10100,Petty Cash,ASSET%0A20100,Trade Payables,LIABILITY%0A40100,Sales Revenue,REVENUE" download="template_coa.csv" style={{ color: '#00B4D8', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Download size={14} /> Download CSV Template
                </a>
              </div>
            </div>
            <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
               <button className={styles.btnOutline} onClick={() => setIsImportModalOpen(false)} disabled={isUploading}>Cancel</button>
               {/* Upload btn relies on input click instead now */}
               <button className={styles.btnPrimary} style={{ opacity: 0.5, cursor: 'not-allowed' }}>{isUploading ? 'Uploading...' : 'Ready for Upload'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
