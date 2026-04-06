'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import { 
  Users, Plus, Search, 
  UploadCloud, Download, 
  Trash2, Edit, Save, FileSpreadsheet,
  Mail, Phone, Building2, UserCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const { t, formatCurrency } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEmployees = () => {
    setLoading(true);
    fetch('/api/hrm/employees')
      .then(res => res.json())
      .then(d => {
        setEmployees(Array.isArray(d) ? d : []);
        setLoading(false)
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const parsedData = data.map((row: any) => ({
        employeeId: row.ID_Pegawai || row.EmployeeID,
        name: row.Nama || row.Name,
        email: row.Email,
        department: row.Departemen || row.Department,
        jobTitle: row.Jabatan || row.JobTitle,
        salary: Number(row.Gaji || row.Salary) || 0,
        ptkpStatus: row.Status_PTKP || row.PTKP || 'TK/0',
        npwp: row.NPWP || '',
        nik: row.NIK || '',
        address: row.Alamat || row.Address || '',
        bankName: row.Bank_Name || row.Bank || '',
        bankNumber: row.Rekening || row.AccountNumber || '',
        bankHolder: row.Pemilik_Rekening || row.AccountHolder || '',
        bpjsKes: row.BPJS_Kesehatan || '',
        bpjsKet: row.BPJS_Ketenagakerjaan || ''
      }));

      try {
        const res = await fetch('/api/hrm/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedData)
        });
        if (res.ok) {
          showToast(`Success imported employees!`, 'success');
          fetchEmployees();
        } else {
          showToast('Import failed.', 'error');
        }
      } catch (err) {
        showToast('Network error during import.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(employees.map(e => ({
      ID_Pegawai: e.employeeId,
      Nama: e.name,
      Departemen: e.department,
      Jabatan: e.jobTitle,
      Gaji: e.salary,
      Status_PTKP: e.ptkpStatus,
      NPWP: e.npwp,
      NIK: e.nik,
      Alamat: e.address,
      Bank: e.bankName,
      Rekening: e.bankNumber,
      Pemilik_Rekening: e.bankHolder,
      BPJS_Kesehatan: e.bpjsKes,
      BPJS_Ketenagakerjaan: e.bpjsKet
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Data_Pegawai.xlsx");
  };

  const handleAddNewEmployee = () => {
    setSelectedEmployee({
      employeeId: `EMP-${Date.now()}`,
      name: '',
      email: '',
      department: 'General',
      jobTitle: 'Staff',
      salary: 0,
      ptkpStatus: 'TK/0',
      npwp: '',
      nik: '',
      address: '',
      bankName: '',
      bankNumber: '',
      bankHolder: '',
      bpjsKes: '',
      bpjsKet: ''
    });
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      const res = await fetch('/api/hrm/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedEmployee)
      });
      if (res.ok) {
        showToast(selectedEmployee.id ? 'Employee updated!' : 'New employee added!', 'success');
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error}`, 'error');
      }
    } catch (err) {
      showToast('Failed to save employee.', 'error');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleImport} 
        accept=".xlsx, .xls" 
      />

      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.title}>{t('DataEmployee')}</h1>
          <p className={styles.subtitle}>Manage your organization's workforce, salaries, and PTKP tax configurations.</p>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.btnSecondary} onClick={() => fileInputRef.current?.click()}>
             <UploadCloud size={16}/> Import (XLSX)
           </button>
           <button className={styles.btnSecondary} onClick={handleExport}>
             <Download size={16}/> Export List
           </button>
           <button className={styles.btnPrimary} onClick={handleAddNewEmployee}>
             <Plus size={16}/> Tambah Pegawai
           </button>
        </div>
      </header>

      {/* Table Section */}
      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
           <div className={styles.searchBox}>
             <Search size={16} color="#64748B" />
             <input 
               type="text" 
               placeholder="Search name or ID..." 
               value={search} 
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
        </div>

        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: '#64748B' }}>
            <Building2 size={48} color="#CBD5E1" style={{ margin: '0 auto 16px', display: 'block' }}/>
            Loading your organization data...
          </div>
        ) : (
          <table className={styles.table}>
             <thead>
                <tr>
                   <th style={{ width: '140px' }}>ID PEGAWAI</th>
                   <th>NAMA & KONTAK</th>
                   <th>POSISI & DEP</th>
                   <th>STATUS PTKP</th>
                   <th>NPWP / NIK</th>
                   <th className={styles.numeric}>GAJI POKOK</th>
                   <th className={styles.actions}>AKSI</th>
                </tr>
             </thead>
             <tbody>
                {filteredEmployees.map(emp => (
                   <tr key={emp.id}>
                      <td><span className={styles.empId}>{emp.employeeId}</span></td>
                      <td>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                           <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                             <UserCircle size={20}/>
                           </div>
                           <div>
                             <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9375rem' }}>{emp.name}</div>
                             <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                               <Mail size={10}/> {emp.email || 'N/A'}
                             </div>
                           </div>
                         </div>
                      </td>
                      <td>
                         <div style={{ fontWeight: 600, color: '#334155' }}>{emp.jobTitle}</div>
                         <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.025em', marginTop: '2px' }}>{emp.department}</div>
                      </td>
                      <td>
                        <span className={styles.ptkpBadge}>{emp.ptkpStatus || 'TK/0'}</span>
                      </td>
                      <td>
                         <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>{emp.npwp || '-'}</div>
                         <div style={{ fontSize: '11px', color: '#94A3B8' }}>NIK: {emp.nik || '-'}</div>
                      </td>
                      <td className={styles.numeric}>{formatCurrency(emp.salary)}</td>
                      <td className={styles.actions}>
                         <button 
                           className={styles.iconBtn} 
                           title="Edit Configuration" 
                           onClick={() => setSelectedEmployee(emp)}
                         >
                           <Edit size={16}/>
                         </button>
                      </td>
                   </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                      <FileSpreadsheet size={32} color="#E2E8F0" style={{ margin: '0 auto 12px' }}/>
                      No employees matched your search criteria.
                    </td>
                  </tr>
                )}
             </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {selectedEmployee && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <header className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Employee Configuration</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedEmployee(null)}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }}/>
              </button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nama Lengkap (Sesuai KTP)</label>
                  <input 
                    type="text" 
                    value={selectedEmployee.name} 
                    onChange={e => setSelectedEmployee({...selectedEmployee, name: e.target.value})} 
                    className={styles.inputText} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Status PTKP (Kategori TER)</label>
                  <select 
                    value={selectedEmployee.ptkpStatus} 
                    onChange={e => setSelectedEmployee({...selectedEmployee, ptkpStatus: e.target.value})} 
                    className={styles.inputSelect}
                  >
                    <option value="TK/0">TK/0 (Maks Rp 5,4jt Bruto 0%)</option>
                    <option value="TK/1">TK/1</option>
                    <option value="TK/2">TK/2</option>
                    <option value="TK/3">TK/3</option>
                    <option value="K/0">K/0</option>
                    <option value="K/1">K/1</option>
                    <option value="K/2">K/2</option>
                    <option value="K/3">K/3</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Gaji Pokok (Gross Salary)</label>
                  <input 
                    type="number" 
                    value={selectedEmployee.salary} 
                    onChange={e => setSelectedEmployee({...selectedEmployee, salary: Number(e.target.value)})} 
                    className={styles.inputText} 
                  />
                </div>
                <div className={styles.formGroup}>
                   <label>Identitas Perpajakan (NPWP/NIK)</label>
                   <input 
                     type="text" 
                     value={selectedEmployee.npwp || ''} 
                     placeholder="NPWP (15 Digit)" 
                     onChange={e => setSelectedEmployee({...selectedEmployee, npwp: e.target.value})} 
                     className={styles.inputText} 
                   />
                   <input 
                     type="text" 
                     value={selectedEmployee.nik || ''} 
                     placeholder="NIK (16 Digit)" 
                     onChange={e => setSelectedEmployee({...selectedEmployee, nik: e.target.value})} 
                     className={styles.inputText} 
                     style={{ marginTop: '10px' }} 
                   />
                </div>
                <div className={styles.formGroup}>
                  <label>Alamat Lengkap</label>
                  <textarea 
                    value={selectedEmployee.address || ''} 
                    onChange={e => setSelectedEmployee({...selectedEmployee, address: e.target.value})} 
                    className={styles.inputText} 
                    rows={2}
                    style={{ resize: 'none' }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Informasi Rekening Bank (Payout)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Bank (BCA/Mandiri...)" 
                      value={selectedEmployee.bankName || ''} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, bankName: e.target.value})} 
                      className={styles.inputText} 
                    />
                    <input 
                      type="text" 
                      placeholder="Nomer Rekening" 
                      value={selectedEmployee.bankNumber || ''} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, bankNumber: e.target.value})} 
                      className={styles.inputText} 
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Nama Pemilik Rekening" 
                    value={selectedEmployee.bankHolder || ''} 
                    onChange={e => setSelectedEmployee({...selectedEmployee, bankHolder: e.target.value})} 
                    className={styles.inputText} 
                    style={{ marginTop: '8px' }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Jaminan Sosial (BPJS)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="BPJS Kesehatan" 
                      value={selectedEmployee.bpjsKes || ''} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, bpjsKes: e.target.value})} 
                      className={styles.inputText} 
                    />
                    <input 
                      type="text" 
                      placeholder="BPJS Ketenagakerjaan" 
                      value={selectedEmployee.bpjsKet || ''} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, bpjsKet: e.target.value})} 
                      className={styles.inputText} 
                    />
                  </div>
                </div>
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setSelectedEmployee(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSaveEmployee}>
                <Save size={16}/> Simpan Perubahan
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
