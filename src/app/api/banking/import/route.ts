import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Handle CSV Bank Statement Imports
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accountId, csvLines, bankName } = body;

    if (!accountId || !csvLines || !Array.isArray(csvLines)) {
      return NextResponse.json({ error: 'Missing accountId or data' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 });

    // 1. Create the Bank Statement Header
    const statement = await prisma.bankStatement.create({
      data: {
        accountId,
        tenantId: tenant.id,
        importDate: new Date()
      }
    });

    // 2. Map and Create Lines
    // Basic CSV Parsing (Expected: Date, Description, Amount)
    const createdLines = await prisma.bankStatementLine.createMany({
      data: csvLines.map((l: any) => ({
        statementId: statement.id,
        date: new Date(l.date),
        description: l.description || 'Imported Transaction',
        amount: Number(l.amount),
        isReconciled: false
      }))
    });

    return NextResponse.json({ 
      success: true, 
      count: createdLines.count,
      statementId: statement.id
    });
  } catch (error: any) {
    console.error('[Banking Import Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
