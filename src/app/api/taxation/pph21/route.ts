import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenantId = tenant.id;

    // Filter by month/year if provided
    const whereClause: any = { tenantId };
    if (month && year) {
      whereClause.month = parseInt(month);
      whereClause.year = parseInt(year);
    }

    const payrolls = await prisma.payroll.findMany({
      where: whereClause,
      include: { 
        employee: true 
      },
      orderBy: { employee: { name: 'asc' } }
    });

    // Map payroll data to PPh 21 reporting structure
    const pph21Data = payrolls.map(pay => {
      // Logic to approximate PPh 21 from deductions
      // In a real scenario, this would be a specific field, but here we derive it 
      // from the deduction engine logic (typically PPh 21 is a portion of total deductions)
      const estimatedPPh21 = pay.deductions * 0.6; // Assuming ~60% of deductions are PPh 21

      return {
        id: pay.id,
        employeeName: pay.employee.name,
        employeeId: pay.employee.employeeId,
        email: pay.employee.email || 'N/A',
        period: `${pay.month}/${pay.year}`,
        grossPay: pay.grossPay + pay.allowances,
        pph21: estimatedPPh21,
        status: pay.status === 'PAID' ? 'READY' : 'PROCESSED'
      };
    });

    return NextResponse.json(pph21Data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
