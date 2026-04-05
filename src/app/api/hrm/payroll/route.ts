import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePPh21 } from '@/lib/taxation/pph21-engine';
import { postToLedger, findAccountByCode } from '@/lib/ledgerUtility';

export async function POST(request: NextRequest) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await request.json();
    const { month, year } = body;

    if (!month || !year) return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 });

    const isDecember = parseInt(month) === 12;

    const employees = await prisma.employee.findMany({
      where: { tenantId: tenant.id, status: 'ACTIVE' }
    });

    // Bulk Calculation
    const payrollsToCreate = [];
    let totalGrossPay = 0;
    let totalPph21 = 0;
    let totalNetPay = 0;

    for (const emp of employees) {
      // Base Salary / Allowances / Deductions
      const baseSalary = emp.salary;
      const allowances = 0; // Default or configured per employee
      const iuranPensiun = 200000; // Simulated flat pension deduction for demo 
      const monthlyBruto = baseSalary + allowances;

      let taxInput: any = {
        isDecember,
        ptkpStatus: emp.ptkpStatus || 'TK/0',
        monthlyBruto,
        monthlyIuranPensiun: iuranPensiun,
      };

      if (isDecember) {
        // Fetch Jan-Nov accumulated data
        const prevPayrolls = await prisma.payroll.findMany({
          where: {
            employeeId: emp.id,
            year: parseInt(year),
            month: { lt: 12 },
            status: 'CONFIRMED'
          }
        });
        
        const yearlyBrutoToDate = prevPayrolls.reduce((sum, p) => sum + p.grossPay + p.allowances, monthlyBruto);
        const yearlyIuranPensiunToDate = prevPayrolls.reduce((sum, p) => sum + p.iuranPensiun, iuranPensiun);
        const pph21PaidJanNov = prevPayrolls.reduce((sum, p) => sum + p.pph21, 0);

        taxInput = {
          ...taxInput,
          yearlyBrutoToDate,
          yearlyIuranPensiunToDate,
          pph21PaidJanNov
        };
      }

      const taxResult = calculatePPh21(taxInput);
      
      const netPay = monthlyBruto - iuranPensiun - taxResult.taxAmount;

      payrollsToCreate.push({
        employeeId: emp.id,
        month: parseInt(month),
        year: parseInt(year),
        grossPay: baseSalary,
        allowances,
        deductions: iuranPensiun,
        iuranPensiun,
        biayaJabatan: taxResult.biayaJabatan,
        pkp: taxResult.pkp,
        pph21: taxResult.taxAmount,
        terCategory: taxResult.terCategory,
        terRate: taxResult.terRate,
        netPay,
        status: 'CONFIRMED',
        notes: `Generate Payroll ${month}/${year}`,
        tenantId: tenant.id
      });

      totalGrossPay += monthlyBruto;
      totalPph21 += taxResult.taxAmount;
      totalNetPay += netPay;
    }

    // Insert ALL payrolls
    await prisma.payroll.createMany({
      data: payrollsToCreate
    });

    // Determine target accounts for Auto-Journal using robust fallback via code
    // Assuming '6001' or similar is Salary Expense, '2003' is typical Tax Payable, '1001' is Cash
    const accSalaryExpense = await findAccountByCode(tenant.id, '6301'); // Assume 6301 is Salary/Wage Expense
    const accTaxPayable = await findAccountByCode(tenant.id, '2003'); // PPh Payable
    const accCash = await findAccountByCode(tenant.id, '1001'); // Operating Cash

    if (accSalaryExpense && accCash) {
       const journalLines = [
         { accountId: accSalaryExpense.id, debit: totalGrossPay, credit: 0 },
         ...(totalPph21 > 0 && accTaxPayable ? [{ accountId: accTaxPayable.id, debit: 0, credit: totalPph21 }] : []),
         // The remaining liability goes to the employee, which here is instantly paid from Cash.
         { accountId: accCash.id, debit: 0, credit: totalNetPay } 
       ];

       await postToLedger(prisma, {
         date: new Date(year, month - 1, 28),
         description: `Payroll Auto-Journal ${month}/${year} for ${payrollsToCreate.length} Employees (Inc. PPh 21)`,
         reference: `PAY-${year}-${month}`,
         tenantId: tenant.id,
         lines: journalLines
       });
    }

    return NextResponse.json({ success: true, count: payrollsToCreate.length });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const filter: any = { tenantId: tenant.id };
    if (!isNaN(month)) filter.month = month;
    if (!isNaN(year)) filter.year = year;

    const payrolls = await prisma.payroll.findMany({
      where: filter,
      include: { employee: true },
      orderBy: { employee: { name: 'asc' } }
    });

    return NextResponse.json(payrolls);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
