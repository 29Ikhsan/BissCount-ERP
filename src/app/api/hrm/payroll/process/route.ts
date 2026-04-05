import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTERCategory, calculatePPh21TER } from '@/lib/taxEngine';

/**
 * Institutional Payroll Processing API
 * 
 * 1. Calculates PPh 21 TER (Tax Engine)
 * 2. Persists Payroll Records
 * 3. Records Ledger Entries (Journalization)
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const { month, year } = await request.json();
    if (!month || !year) return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 });

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
      if (employees.length === 0) throw new Error(`No active employees found to process.`);

      // 1.3 Calculate & Prepare Payroll Records
      let totalGross = 0;
      let totalPPh21 = 0;
      let totalNet = 0;

      const payrollRecords = employees.map((emp) => {
        const gross = emp.salary || 0;
        const category = getTERCategory(emp.ptkpStatus || 'TK/0');
        const { rate, pph21 } = calculatePPh21TER(gross, category);
        const net = gross - pph21;

        totalGross += gross;
        totalPPh21 += pph21;
        totalNet += net;

        return {
          employeeId: emp.id,
          month,
          year,
          grossPay: gross,
          pph21: pph21,
          terCategory: category,
          terRate: rate,
          netPay: net,
          status: 'COMPLETED',
          tenantId: tenant.id
        };
      });

      // 1.4 Batch Create Payrolls
      await tx.payroll.createMany({ data: payrollRecords });

      // 1.5 Ledger Posting (Standard Salary Journal)
      // Account IDs (Static mappings from your COA Seed)
      const SALARY_EXPENSE_ID = "d2baf1c2-cabc-4cca-a324-ad83bc7b16b5"; // 6003
      const SALARY_PAYABLE_ID = "97541910-c31b-4e69-9ca3-715c97e171d3"; // 2003
      const TAX_PAYABLE_ID = "ee3132f1-93bf-4c8e-9262-d48ba835d119";   // 2004

      const journal = await tx.journalEntry.create({
        data: {
          date: new Date(year, month - 1, 28), // Auto-post to end of month
          description: `Automatic Payroll Journal for Period ${month}/${year}`,
          reference: `PAY-${year}${month}`,
          tenantId: tenant.id,
          lines: {
            create: [
              { accountId: SALARY_EXPENSE_ID, debit: totalGross, credit: 0 },
              { accountId: SALARY_PAYABLE_ID, debit: 0, credit: totalNet },
              { accountId: TAX_PAYABLE_ID, debit: 0, credit: totalPPh21 }
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
