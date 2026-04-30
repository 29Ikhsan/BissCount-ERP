import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePPh21 } from '@/lib/taxation/pph21-engine';
import { findAccountByCode } from '@/lib/ledgerUtility';
import { isPeriodLocked } from '@/lib/closing-utils';
import { requireSession } from '@/lib/access-server';

/**
 * Institutional Payroll Processing API
 * 
 * 1. Calculates PPh 21 TER (Tax Engine)
 * 2. Persists Payroll Records
 * 3. Records Ledger Entries (Journalization)
 */
export async function POST(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const { month, year, overrides = {} } = await request.json();
    if (!month || !year) return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 });

    // --- FINANCIAL CONTROL: PERIOD LOCKING CHECK ---
    const locked = await isPeriodLocked(new Date(parseInt(year), parseInt(month) - 1, 28));
    if (locked) {
      return NextResponse.json({ 
        error: 'Periode ini sudah dikunci (Closed). Tidak dapat men-generate payroll dan jurnal untuk bulan yang telah difinalisasi.' 
      }, { status: 403 });
    }

    const isDecember = month === 12;

    // 1. Transactional Payroll Execution
    const result = await prisma.$transaction(async (tx) => {
      // 1.1 Check duplicate run
      const existing = await tx.payroll.findFirst({
        where: { tenantId: tenant.id, month, year }
      });
      if (existing) throw new Error(`Payroll for ${month}/${year} has already been processed.`);

      // 1.2 Fetch active employees
      const employees = await tx.employee.findMany({
        where: { tenantId: tenant.id, status: 'ACTIVE' }
      });
      if (employees.length === 0) throw new Error(`No active employees found in Database under Tenant: ${tenant.name}.`);

      // 1.3 Calculate & Prepare Payroll Records
      let totalGross = 0;
      let totalPPh21 = 0;
      let totalNet = 0;

      const payrollRecords = [];

      for (const emp of employees) {
        const overrideData = overrides[emp.id] || {};
        const baseSalary = emp.salary || 0;
        const allowances = Number(overrideData.allowances) || 0;
        const jkkJkm = Math.round(baseSalary * 0.0054);
        const thrBonus = Number(overrideData.thrBonus) || (isDecember ? baseSalary : 0);
        const manualDeductions = Number(overrideData.deductions) || 0;
        const iuranPensiun = Math.round(baseSalary * 0.01);
        const totalDeductions = iuranPensiun + manualDeductions;
        
        const monthlyBruto = baseSalary + allowances;

        let taxInput: any = {
           isDecember,
           ptkpStatus: emp.ptkpStatus || 'TK/0',
           monthlyBruto: monthlyBruto,
           monthlyJkkJkm: jkkJkm,
           monthlyThrBonus: thrBonus,
           monthlyIuranPensiun: iuranPensiun,
           hasNpwp: !!emp.npwp
        };

        if (isDecember) {
          const prevPayrolls = await tx.payroll.findMany({
            where: {
              employeeId: emp.id,
              year: parseInt(year as any),
              month: { lt: 12 },
              status: 'COMPLETED'
            }
          });

          taxInput.yearlyBrutoToDate = prevPayrolls.reduce((sum, p) => sum + p.grossPay + p.allowances, monthlyBruto);
          taxInput.yearlyJkkJkmToDate = prevPayrolls.reduce((sum, p) => sum + p.jkkJkm, jkkJkm);
          taxInput.yearlyThrBonusToDate = prevPayrolls.reduce((sum, p) => sum + p.thrBonus, thrBonus);
          taxInput.yearlyIuranPensiunToDate = prevPayrolls.reduce((sum, p) => sum + p.iuranPensiun, iuranPensiun);
          taxInput.pph21PaidJanNov = prevPayrolls.reduce((sum, p) => sum + p.pph21, 0);
        }

        const taxResult = calculatePPh21(taxInput);
        const net = monthlyBruto + thrBonus - totalDeductions - taxResult.taxAmount;

        totalGross += (monthlyBruto + thrBonus);
        totalPPh21 += taxResult.taxAmount;
        totalNet += net;

        payrollRecords.push({
          employeeId: emp.id,
          month,
          year,
          grossPay: baseSalary,
          allowances: allowances,
          thrBonus: thrBonus,
          jkkJkm: jkkJkm,
          deductions: manualDeductions,
          iuranPensiun: iuranPensiun,
          biayaJabatan: taxResult.biayaJabatan,
          pkp: taxResult.pkp,
          pph21: taxResult.taxAmount,
          terCategory: taxResult.terCategory,
          terRate: taxResult.terRate,
          netPay: net,
          status: 'COMPLETED',
          tenantId: tenant.id
        });
      }

      // 1.4 Batch Create Payrolls
      await tx.payroll.createMany({ data: payrollRecords });

      // 1.5 Ledger Posting (Standard Salary Journal)
      // Account IDs (Dynamically resolved by code)
      const accSalaryExpense = await findAccountByCode(tenant.id, '6003', tx);
      const accSalaryPayable = await findAccountByCode(tenant.id, '2003', tx);
      const accTaxPayable = await findAccountByCode(tenant.id, '2004', tx);

      if (!accSalaryExpense || !accSalaryPayable || !accTaxPayable) {
        throw new Error(`Incomplete Chart of Accounts for Payroll. Please ensure codes 6003, 2003, 2004 exist.`);
      }

      const journal = await tx.journalEntry.create({
        data: {
          date: new Date(year, month - 1, 28), // Auto-post to end of month
          description: `Automatic Payroll Journal for Period ${month}/${year}`,
          reference: `PAY-${year}${month}`,
          tenantId: tenant.id,
          lines: {
            create: [
              { accountId: accSalaryExpense.id, debit: totalGross, credit: 0 },
              { accountId: accSalaryPayable.id, debit: 0, credit: totalNet },
              { accountId: accTaxPayable.id, debit: 0, credit: totalPPh21 }
            ]
          }
        }
      });

      return { count: employees.length, totalGross, totalPPh21, journalId: journal.id };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handle Unpost Payroll (Rollback)
 */
export async function DELETE(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get('month') || '0');
    const year = parseInt(url.searchParams.get('year') || '0');

    if (!month || !year) return NextResponse.json({ error: 'Month and Year parameters required' }, { status: 400 });

    // --- FINANCIAL CONTROL: PERIOD LOCKING CHECK ---
    const locked = await isPeriodLocked(new Date(year, month - 1, 28));
    if (locked) {
      return NextResponse.json({ 
        error: 'Periode ini sudah dikunci (Closed). Tidak dapat menganulir (unpost) payroll untuk periode yang telah difinalisasi.' 
      }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete associated auto-generated Journal Entry
      const journalRef = `PAY-${year}${month}`;
      const journal = await tx.journalEntry.findFirst({
        where: { tenantId: tenant.id, reference: journalRef }
      });
      
      if (journal) {
        // Technically we should reverse the GL balances if `postToLedger` was used to increment them.
        // However, the POST method currently does *not* auto-increment the `Account` table balances, 
        // it just inserts JournalLines. If that changes, we need to add reversal logic here.
        await tx.journalEntry.delete({ where: { id: journal.id } });
      }

      // 2. Delete Payroll Records
      const deleteCount = await tx.payroll.deleteMany({
        where: { tenantId: tenant.id, month, year }
      });

      return { journalDeleted: !!journal, payrollsDeleted: deleteCount.count };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

