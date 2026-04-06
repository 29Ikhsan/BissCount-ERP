'use client';

import React from 'react';
import { X, Download, Printer, ShieldCheck, User, Calendar, CreditCard } from 'lucide-react';

interface PayslipModalProps {
  payroll: any;
  onClose: () => void;
}

export default function PayslipModal({ payroll, onClose }: PayslipModalProps) {
  if (!payroll) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShieldCheck className="text-emerald-500" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Official Payslip</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
              <Printer size={18} className="text-slate-500" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 print:p-0">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">AKSIA Global Corp</h1>
              <p className="text-slate-500 text-sm">Equity Tower, 32nd Floor, Jakarta SCBD</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                payroll.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {payroll.status}
              </div>
              <p className="text-slate-400 text-xs mt-2">Ref: SLIP/{payroll.year}/{payroll.month}/{payroll.employee?.employeeId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 border-y border-slate-100 dark:border-slate-800 py-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Employee</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{payroll.employee?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Period</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {new Date(0, payroll.month - 1).toLocaleString('id-ID', { month: 'long' })} {payroll.year}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Department</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{payroll.employee?.department || 'Operations'}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Job Title</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{payroll.employee?.jobTitle || 'Staff'}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Earnings</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Rp {payroll.employee?.salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-600 dark:text-slate-400">Allowances</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Rp {payroll.allowances.toLocaleString()}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Deductions</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1 text-red-500">
                  <span className="dark:text-red-400/80">Estimated Deductions (Tax & BPJS)</span>
                  <span className="font-medium">-Rp {payroll.deductions.toLocaleString()}</span>
                </div>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t-2 border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">NET DISBURSEMENT</p>
                <p className="text-[10px] text-slate-400 italic">Paid via Bank Transfer</p>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Rp {payroll.netPay.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-slate-400">This is a computer generated document and does not require a physical signature.</p>
            <p className="text-[10px] text-slate-400 mt-1">© 2026 AKSIA ERP - Financial Integrity System</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 print:hidden">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
