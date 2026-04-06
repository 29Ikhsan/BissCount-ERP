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

    // Date Filtering Logic
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      dateFilter = {
        expense: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      };
    }

    const whtLines = await prisma.expenseItem.findMany({
      where: { 
        expense: { tenantId }, 
        ...dateFilter,
        whtAmount: { gt: 0 } 
      },
      include: { 
        expense: true,
        account: true
      },
      orderBy: { expense: { date: 'asc' } }
    });

    const pphData = whtLines.map(line => {
      // Logic to determine PPh Article based on account name or description
      let article = '23'; // Default to PPh 23
      const descLower = line.description.toLowerCase();
      const accNameLower = (line.account?.name || '').toLowerCase();

      if (descLower.includes('sewa') || descLower.includes('rental') || accNameLower.includes('sewa') || accNameLower.includes('rental')) article = '4(2)';
      if (descLower.includes('gaji') || descLower.includes('salary') || accNameLower.includes('gaji') || accNameLower.includes('salary')) article = '21';

      return {
        id: line.id,
        date: line.expense.date,
        merchant: line.expense.merchant,
        description: line.description,
        article,
        dpp: line.amount,
        rate: line.whtRate,
        pph: line.whtAmount,
        status: 'READY'
      };
    });

    return NextResponse.json(pphData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
