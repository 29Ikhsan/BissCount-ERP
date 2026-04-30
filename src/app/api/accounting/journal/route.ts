import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPeriodLocked } from '@/lib/closing-utils';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

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
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await request.json();
    const { date, description, reference, lines } = body;

    // --- FINANCIAL CONTROL: PERIOD LOCKING CHECK ---
    const locked = await isPeriodLocked(new Date(date));
    if (locked) {
      return NextResponse.json({ 
        error: 'Periode ini sudah dikunci (Closed). Tidak dapat menambah atau mengubah transaksi jurnal pada periode yang telah difinalisasi.' 
      }, { status: 403 });
    }

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

    // Create Audit Log Entry
    try {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE_MANUAL_JOURNAL',
          entity: 'JournalEntry',
          entityId: entry.id,
          tenantId: tenant.id,
          details: {
            description: entry.description,
            reference: entry.reference,
            totalAmount: totalDebit
          }
        }
      });
    } catch (auditErr) {
      console.error('Audit Log failed:', auditErr);
    }

    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
