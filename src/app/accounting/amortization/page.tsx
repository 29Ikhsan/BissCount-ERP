'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Plus, 
  Play, 
  Calendar, 
  PieChart, 
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

export default function AmortizationPage() {
  const { t, formatCurrency } = useLanguage();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalAmount: '',
    usefulLife: '',
    startDate: '',
    endDate: '',
    prepaidAccountId: '',
    expenseAccountId: '',
    costCenterId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, cRes] = await Promise.all([
        fetch('/api/accounting/amortization'),
        fetch('/api/accounting/accounts'),
        fetch('/api/accounting/cost-centers')
      ]);
      
      if (sRes.ok) {
        const data = await sRes.json();
        setSchedules(data.schedules);
      }
      if (aRes.ok) {
        const data = await aRes.json();
        setAccounts(data.accounts);
      }
      if (cRes.ok) {
        const data = await cRes.json();
        setCostCenters(data.costCenters);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunAmortization = async () => {
    if (!confirm('Run monthly amortization for all active schedules?')) return;
    setRunning(true);
    try {
      const res = await fetch('/api/accounting/amortization/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Internal Server Error');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting/amortization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (e) {
      alert('Error creating schedule');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Beban Dibayar Dimuka & Amortisasi</h1>
          <p className={styles.subtitle}>Otomasi perata-rataan beban (Accrual-based accounting) perusahaan.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={handleRunAmortization} disabled={running}>
            {running ? <RefreshCw className={styles.spin} /> : <Play size={16} />}
            <span>Jalankan Amortisasi Bulanan</span>
          </button>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>Tambah Jadwal Baru</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}><Clock size={20} /></div>
            <span className={styles.kpiLabel}>Schedules Active</span>
          </div>
          <div className={styles.kpiValue}>{schedules.filter(s => s.status === 'ACTIVE').length}</div>
          <div className={styles.kpiTrend}>Monitoring monthly recognition</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIconBox}><PieChart size={20} /></div>
            <span className={styles.kpiLabel}>Total Prepaid Asset</span>
          </div>
          <div className={styles.kpiValue}>
            {formatCurrency(schedules.reduce((sum, s) => sum + s.remainingAmount, 0))}
          </div>
          <div className={styles.kpiTrend}>Current balance in asset accounts</div>
        </div>
      </div>

      {/* Table Section */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama Aset/Biaya</th>
              <th>Total Biaya</th>
              <th>Saldo Sisa</th>
              <th>Masa Manfaat</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading schedules...</td></tr>
            ) : schedules.length > 0 ? (
              schedules.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className={styles.assetName}>{s.name}</div>
                    <div className={styles.assetAccounts}>
                      {s.prepaidAccount?.code} &rarr; {s.expenseAccount?.code}
                    </div>
                  </td>
                  <td>{formatCurrency(s.totalAmount)}</td>
                  <td className={styles.remainingVal}>{formatCurrency(s.remainingAmount)}</td>
                  <td>{s.usefulLife} Bulan</td>
                  <td>
                    <span className={s.status === 'ACTIVE' ? styles.statusActive : styles.statusDone}>
                      {s.status}
                    </span>
                  </td>
                  <td><button className={styles.btnIcon}><ChevronRight size={18} /></button></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Tidak ada jadwal ditemukan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Placeholder */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Buat Jadwal Amortisasi Baru</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Nama Amortisasi (Misal: Sewa Gedung 2026)</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Total Nominal</label>
                  <input required type="number" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Masa Manfaat (Bulan)</label>
                  <input required type="number" value={formData.usefulLife} onChange={e => setFormData({...formData, usefulLife: e.target.value})} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Akun Aset (Prepaid)</label>
                  <select required value={formData.prepaidAccountId} onChange={e => setFormData({...formData, prepaidAccountId: e.target.value})}>
                    <option value="">Pilih Akun...</option>
                    {accounts.filter(a => a.type === 'ASSET').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Akun Biaya (Expense)</label>
                  <select required value={formData.expenseAccountId} onChange={e => setFormData({...formData, expenseAccountId: e.target.value})}>
                    <option value="">Pilih Akun...</option>
                    {accounts.filter(a => a.type === 'EXPENSE').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.btnGhost}>Batal</button>
                <button type="submit" className={styles.btnPrimary}>Simpan Jadwal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
