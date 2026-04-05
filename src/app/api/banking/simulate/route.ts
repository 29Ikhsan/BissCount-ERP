import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 });
    
    const body = await req.json();
    const { accountId } = body;

    // Get the specified bank account or a default one
    const bankAccount = await prisma.account.findFirst({
        where: accountId ? { id: accountId } : { tenantId: tenant.id, code: { startsWith: '1' } }
    });

    if (!bankAccount) {
      return NextResponse.json({ error: 'No cash/bank account found to sync.' }, { status: 400 });
    }

    // 1. Create a Bank Statement Record
    const statement = await prisma.bankStatement.create({
        data: {
            accountId: bankAccount.id,
            tenantId: tenant.id,
        }
    });

    const now = new Date();
    
    // Create random dates clustered around recent days
    const d1 = new Date(now); d1.setDate(d1.getDate() - 1);
    const d2 = new Date(now); d2.setDate(d2.getDate() - 2);
    const d3 = new Date(now); d3.setDate(d3.getDate() - 5);
    const d4 = new Date(now); d4.setDate(d4.getDate() - 7);

    // 2. Generate Institutional-grade mock statement lines
    const mockLines = [
        { statementId: statement.id, date: d1, description: 'STRIPE TRANSFER - C1892', amount: 45000000, isReconciled: false },
        { statementId: statement.id, date: d2, description: 'AWS EMEA SARL - CLOUD HOSTING', amount: -2450000, isReconciled: false },
        { statementId: statement.id, date: d3, description: 'INBOUND TRF PT MAJU BERSAMA', amount: 125550000, isReconciled: false },
        { statementId: statement.id, date: d4, description: 'ACH PAYROLL BATCH 02A', amount: -65000000, isReconciled: false },
        { statementId: statement.id, date: now, description: 'ATM BNI SUDIRMAN JKT', amount: -1500000, isReconciled: false },
    ];

    await prisma.bankStatementLine.createMany({
        data: mockLines
    });

    return NextResponse.json({ 
        success: true, 
        message: 'Bank feed securely synced.', 
        linesSynced: mockLines.length 
    });

  } catch (error: any) {
    console.error('Bank Simulation Error:', error);
    return NextResponse.json({ error: 'Failed to simulate bank feed' }, { status: 500 });
  }
}
