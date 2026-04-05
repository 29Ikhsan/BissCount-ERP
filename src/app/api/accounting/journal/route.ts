import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const entries = await prisma.journalEntry.findMany({
      where: { tenantId: tenant.id },
      include: {
        lines: {
          include: { account: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await request.json();
    const { date, description, reference, lines } = body;

    if (!lines || lines.length < 2) {
      return NextResponse.json({ error: 'Journal entry must have at least 2 lines' }, { status: 400 });
    }

    // Double-entry validation
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ 
        error: `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}` 
      }, { status: 400 });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        date: new Date(date),
        description,
        reference,
        tenantId: tenant.id,
        lines: {
          create: lines.map((line: any) => ({
            accountId: line.accountId,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            costCenterId: line.costCenterId || null
          }))
        }
      },
      include: { lines: true }
    });

    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
