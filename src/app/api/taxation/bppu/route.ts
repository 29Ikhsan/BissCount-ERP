import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 });

    const expenses = await prisma.expense.findMany({
      where: { 
        tenantId: tenant.id, 
        taxPeriod: month,
        taxYear: year,
        items: {
          some: {
            whtAmount: { gt: 0 }
          }
        }
      },
      include: { 
        contact: true,
        items: {
          where: { whtAmount: { gt: 0 } }
        }
      },
      orderBy: { date: 'desc' }
    });

    const reportData = expenses.map(exp => {
      const whtTotal = exp.items.reduce((sum, item) => sum + item.whtAmount, 0);
      const grossTotal = exp.items.reduce((sum, item) => sum + item.amount, 0);
      
      const hasIdentity = !!(exp.contact?.taxId || exp.contact?.idNumber);
      const hasTku = !!(exp.contact as any)?.tkuId;

      return {
        id: exp.id,
        date: exp.date,
        merchant: exp.merchant,
        identity: exp.contact?.taxId || exp.contact?.idNumber || 'MISSING NPWP/NIK',
        gross: grossTotal,
        wht: whtTotal,
        status: (hasIdentity && hasTku) ? 'READY' : 'INCOMPLETE',
        items: exp.items.map(i => ({
          description: i.description,
          code: i.taxObjectCode,
          amount: i.amount,
          wht: i.whtAmount
        }))
      };
    });

    return NextResponse.json(reportData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
