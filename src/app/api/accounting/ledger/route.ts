import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const accounts = await prisma.account.findMany({
      where: { tenantId: tenant.id },
      include: {
        journalLines: true
      },
      orderBy: { code: 'asc' }
    });

    const ledger = accounts.map(acc => {
      const totalDebit = acc.journalLines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = acc.journalLines.reduce((sum, line) => sum + line.credit, 0);
      
      let balance = 0;
      // Normal balance calculation
      if (['ASSET', 'EXPENSE'].includes(acc.type)) {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        totalDebit,
        totalCredit,
        balance,
        transactionCount: acc.journalLines.length
      };
    });

    return NextResponse.json(ledger);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
