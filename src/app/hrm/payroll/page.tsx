'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { 
  CreditCard, Search, Calendar, FileText, 
  CheckCircle2, Download, ChevronRight, 
  ShieldCheck, Zap, Edit2, Play
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

export default function PayrollCenter() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Data States
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, { allowances: number, thrBonus: number, deductions: number }>>({});
  
  const [payrollResult, setPayrollResult] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setPayrollResult(null);
    try {
      // 1. Fetch processed payrolls
      const res = await fetch(`/api/hrm/payroll?month=${month}&year=${year}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        setPayrolls(data);
        setIsDraftMode(false);
      } else {
        // 2. If no payrolls, fetch active employees for draft mode
        setPayrolls([]);
        const empRes = await fetch(`/api/hrm/employees`);
        const empData = await empRes.json();
        
        if (Array.isArray(empData)) {
          const active = empData.filter((e: any) => e.status === 'ACTIVE');
          setActiveEmployees(active);
          setIsDraftMode(true);
          
          // Initialize overrides
          const initialOverrides: any = {};
          active.forEach((emp: any) => {
            initialOverrides[emp.id] = { allowances: 0, thrBonus: 0, deductions: 0 };
          });
          setOverrides(initialOverrides);
        } else {
          setActiveEmployees([]);
          setIsDraftMode(true);
          showToast(empData.error || 'Gagal memuat data karyawan.', 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleOverrideChange = (empId: string, field: 'allowances' | 'thrBonus' | 'deductions', value: string) => {
    setOverrides(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: Number(value) || 0
      }
    }));
  };

  const handleRunPayroll = async () => {
    if (!confirm(`Eksekusi Payroll untuk Bulan ${month}/${year}? Ini akan memproses PPh 21 dan membuat Jurnal Akuntansi otomatis.`)) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/hrm/payroll/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, overrides })
      });
      const data = await res.json();
      
      if (res.ok) {
        setPayrollResult(data);
        showToast(`Sukses! ${data.count} data payroll berhasil diproses. ID Jurnal: ${data.journalId}`, 'success');
        fetchData(); // Reload to switch out of draft mode
      } else {
        showToast(`Gagal: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke engine payroll.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnpostPayroll = async () => {
    if (!confirm(`Yakin ingin menganulir (Unpost) payroll bulan ini? Ini akan MENGHAPUS jurnal akuntansi dan mengembalikan layar ke Mode Draft.`)) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/hrm/payroll/process?month=${month}&year=${year}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (res.ok) {
        showToast(`Payroll berhasil dianulir. ${data.payrollsDeleted} data dihapus.`, 'success');
        fetchData(); // Reload to switch back to draft mode
      } else {
        showToast(`Gagal anulir: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast('Koneksi ke server gagal.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotalBaseGross = () => {
    if (isDraftMode) {
      return activeEmployees.reduce((sum, emp) => sum + (emp.salary || 0) + (overrides[emp.id]?.allowances || 0) + (overrides[emp.id]?.thrBonus || 0), 0);
    }
    return payrolls.reduce((sum, pr) => sum + pr.grossPay + pr.allowances + pr.thrBonus, 0);
  };

  const currentCount = isDraftMode ? activeEmployees.length : payrolls.length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumb}>
            <Link href="/hrm">HCM</Link> <ChevronRight size={14} /> <span className={styles.activeBreadcrumb}>PAYROLL CENTER</span>
          </div>
          <h1 className={styles.title}>Payroll Processing</h1>
          <p className={styles.subtitle}>Kelola pembayaran gaji, input THR/Bonus, dan cetak slip PPh 21 DJP-compliant.</p>
        </div>
        <div className={styles.headerActions}>
           <div className={styles.periodBox}>
              <Calendar size={16} />
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                 <option value={1}>January</option>
                 <option value={2}>February</option>
                 <option value={3}>March</option>
                 <option value={4}>April</option>
                 <option value={5}>May</option>
                 <option value={6}>June</option>
                 <option value={7}>July</option>
                 <option value={8}>August</option>
                 <option value={9}>September</option>
                 <option value={10}>October</option>
                 <option value={11}>November</option>
                 <option value={12}>December</option>
              </select>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
           </div>
           {!isDraftMode && payrolls.length > 0 && (
             <>
               <button 
                 className={styles.btnSecondary} 
                 onClick={handleUnpostPayroll}
                 style={{ color: '#F59E0B', borderColor: '#F59E0B' }}
                 disabled={isProcessing}
               >
                 Anulir (Unpost)
               </button>
               <button className={styles.btnSecondary} onClick={() => window.print()}>
                  <Download size={16} /> Export Reports
               </button>
             </>
           )}
           {isDraftMode && activeEmployees.length > 0 && (
             <button 
               className={styles.btnPrimary} 
               onClick={handleRunPayroll}
               disabled={isProcessing}
             >
               <Zap size={16} className={isProcessing ? styles.spinIcon : ''} /> 
               {isProcessing ? 'Memproses...' : 'Proses Payroll'}
             </button>
           )}
        </div>
      </div>

      {/* Analytics Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Bruto (Estimasi)</div>
          <div className={styles.statValue}>Rp {calculateTotalBaseGross().toLocaleString()}</div>
          <div className={styles.statSub}>{currentCount} KARYAWAN AKTIF</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Status Siklus</div>
          <div className={styles.statValue} style={{ color: isDraftMode ? '#F59E0B' : '#10B981' }}>
            {isDraftMode ? 'DRAFT MODE' : 'COMPLETED'}
          </div>
          <div className={styles.statSub}>{isDraftMode ? 'MENUNGGU DIPROSES' : 'DATA SUDAH DIKUNCI'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>BPJS Contributions</div>
          <div className={styles.statValue}>Rp {(calculateTotalBaseGross() * 0.04).toLocaleString()}</div>
          <div className={styles.statSub}>KES & KET INTEGRATED</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Status Jurnal Akuntansi</div>
          <div className={styles.statValue} style={{ color: payrollResult ? '#10B981' : (isDraftMode ? '#94A3B8' : '#10B981') }}>
            {payrollResult || !isDraftMode ? 'POSTED' : 'WAITING'}
          </div>
          <div className={styles.statSub}>{payrollResult ? `JOURNAL ID: ${payrollResult.journalId.split('-')[0]}` : 'AUTO POSTING SAAT PROSES'}</div>
        </div>
      </div>

      {/* Main Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
           <h3 className={styles.tableTitle}>
             {isDraftMode ? 'Input Data Variabel (Bonus/Potongan)' : 'Payroll Registry Final'} — Periode {month}/{year}
           </h3>
           <div className={styles.searchBox}>
              <Search size={16} />
              <input type="text" placeholder="Cari karyawan..." />
           </div>
        </div>
        
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>Memuat data...</div>
        ) : (
          <table className={styles.table}>
            <thead>
               <tr>
                  <th>KARYAWAN</th>
                  <th>GAJI POKOK</th>
                  {isDraftMode ? (
                    <>
                      <th style={{ textAlign: 'right' }}>+ JKK/JKM (0.54%)</th>
                      <th style={{ textAlign: 'right' }}>- PENSIUN (1%)</th>
                      <th style={{ textAlign: 'right' }}>+ TUNJANGAN</th>
                      <th style={{ textAlign: 'right' }}>+ THR/BONUS</th>
                      <th style={{ textAlign: 'right' }}>- POTONGAN LAIN</th>
                    </>
                  ) : (
                    <>
                      <th style={{ textAlign: 'right' }}>TUNJ. & BONUS</th>
                      <th style={{ textAlign: 'right' }}>POTONGAN</th>
                      <th style={{ textAlign: 'right' }}>NET PAY</th>
                      <th style={{ textAlign: 'center' }}>AKSI</th>
                    </>
                  )}
               </tr>
            </thead>
            <tbody>
              
               {/* DRAFT MODE RENDERING */}
               {isDraftMode && activeEmployees.map(emp => (
                  <tr key={emp.id}>
                     <td>
                        <div className={styles.empInfo}>
                           <div className={styles.avatar}>{emp.name[0]}</div>
                           <div>
                              <div className={styles.empName}>{emp.name} <span className={styles.ptkpBadge} style={{marginLeft: '8px'}}>{emp.ptkpStatus}</span></div>
                              <div className={styles.empCode}>{emp.jobTitle}</div>
                           </div>
                        </div>
                     </td>
                     <td style={{ fontWeight: 600 }}>Rp {emp.salary?.toLocaleString() || 0}</td>
                     <td style={{ textAlign: 'right', color: '#10B981', fontSize: '13px' }}>
                       Rp {Math.round((emp.salary || 0) * 0.0054).toLocaleString()}
                     </td>
                     <td style={{ textAlign: 'right', color: '#EF4444', fontSize: '13px' }}>
                       Rp {Math.round((emp.salary || 0) * 0.01).toLocaleString()}
                     </td>
                     <td style={{ alignContent: 'right' }}>
                       <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                         <input 
                           type="number" 
                           className={styles.inputField} 
                           placeholder="0"
                           value={overrides[emp.id]?.allowances || ''}
                           onChange={(e) => handleOverrideChange(emp.id, 'allowances', e.target.value)}
                         />
                       </div>
                     </td>
                     <td style={{ alignContent: 'right' }}>
                       <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                         <input 
                           type="number" 
                           className={styles.inputField} 
                           placeholder="0"
                           value={overrides[emp.id]?.thrBonus || ''}
                           onChange={(e) => handleOverrideChange(emp.id, 'thrBonus', e.target.value)}
                         />
                       </div>
                     </td>
                     <td style={{ alignContent: 'right' }}>
                       <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                         <input 
                           type="number" 
                           className={styles.inputField} 
                           placeholder="0"
                           value={overrides[emp.id]?.deductions || ''}
                           onChange={(e) => handleOverrideChange(emp.id, 'deductions', e.target.value)}
                         />
                       </div>
                     </td>
                  </tr>
               ))}

               {isDraftMode && activeEmployees.length === 0 && (
                 <tr>
                   <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                     Tidak ada karyawan aktif yang ditemukan. Tambahkan karyawan di menu Data Pegawai terlebih dahulu.
                   </td>
                 </tr>
               )}

               {/* COMPLETED MODE RENDERING */}
               {!isDraftMode && payrolls.map(pr => (
                  <tr key={pr.id}>
                     <td>
                        <div className={styles.empInfo}>
                           <div className={styles.avatar}>{pr.employee?.name[0]}</div>
                           <div>
                              <div className={styles.empName}>{pr.employee?.name} <span className={styles.ptkpBadge} style={{marginLeft: '8px'}}>{pr.employee?.ptkpStatus}</span></div>
                              <div className={styles.empCode}>{pr.employee?.jobTitle}</div>
                           </div>
                        </div>
                     </td>
                     <td style={{ fontWeight: 600 }}>Rp {pr.grossPay?.toLocaleString() || 0}</td>
                     <td style={{ textAlign: 'right' }}>
                       Rp {(pr.allowances + pr.thrBonus)?.toLocaleString() || 0}
                     </td>
                     <td style={{ textAlign: 'right', color: '#EF4444' }}>
                       Rp {(pr.deductions + pr.pph21 + pr.iuranPensiun)?.toLocaleString() || 0}
                     </td>
                     <td style={{ textAlign: 'right', fontWeight: 800, color: '#10B981' }}>
                       Rp {pr.netPay?.toLocaleString() || 0}
                     </td>
                     <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Link 
                            href={`/hrm/payroll/${pr.id}/pdf`}
                            target="_blank"
                            className={styles.btnSecondary}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <FileText size={14} /> Unduh Slip PDF
                          </Link>
                          {month === 12 && (
                            <Link 
                              href={`/hrm/payroll/1721a1/${pr.id}`}
                              className={styles.btnPrimary}
                              style={{ padding: '6px 12px', fontSize: '12px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            >
                              <ShieldCheck size={14} /> 1721-A1
                            </Link>
                          )}
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Journal Preview Popup */}
      {payrollResult && (
        <div className={styles.journalPanel} style={{ marginTop: '32px' }}>
           <div className={styles.journalHeader}>
              <h3 className={styles.panelTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} /> Jurnal Akuntansi Berhasil Dibuat
              </h3>
              <div className={styles.complianceNote}><ShieldCheck size={14} /> AUTO-POSTED TO LEDGER</div>
           </div>
           <div className={styles.journalEntries}>
              <div className={styles.journalLine}>
                 <span>6003 - Beban Gaji & Upah</span>
                 <span className={styles.debit}>Rp {payrollResult.totalGross.toLocaleString()}</span>
              </div>
              <div className={styles.journalLine}>
                 <span>2003 - Hutang Gaji</span>
                 <span className={styles.credit}>Rp {(payrollResult.totalGross - payrollResult.totalPPh21).toLocaleString()}</span>
              </div>
              <div className={styles.journalLine}>
                 <span>2004 - Hutang PPh Pasal 21</span>
                 <span className={styles.credit}>Rp {payrollResult.totalPPh21.toLocaleString()}</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
