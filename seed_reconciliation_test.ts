import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return;

  const bankAcc = await prisma.account.findFirst({
    where: { tenantId: tenant.id, code: '1001' }
  });
  const expenseAcc = await prisma.account.findFirst({
    where: { tenantId: tenant.id, code: '6001' }
  });

  if (!bankAcc || !expenseAcc) {
    console.log('Missing accounts 1001 or 6001');
    return;
  }

  // 1. Create a Journal Entry (Simulating a Phase 17 approved expense)
  const testAmount = 777777;
  const journalDescription = 'Recon Test: Office Supplies';
  
  const journal = await prisma.journalEntry.create({
    data: {
      date: new Date(),
      description: journalDescription,
      tenantId: tenant.id,
      reference: 'TEST-RECON-01',
      lines: {
        create: [
          { accountId: expenseAcc.id, debit: testAmount, credit: 0 },
          { accountId: bankAcc.id, debit: 0, credit: testAmount }
        ]
      }
    }
  });

  // 2. Create a Bank Statement Line that matches
  const statement = await prisma.bankStatement.create({
    data: {
      accountId: bankAcc.id,
      tenantId: tenant.id,
      importDate: new Date()
    }
  });

  const line = await prisma.bankStatementLine.create({
    data: {
      statementId: statement.id,
      date: new Date(),
      description: 'OUTBOUND: OFFICE SUPPLIES JKT',
      amount: -testAmount, // Withdrawal
      isReconciled: false
    }
  });

  console.log('Seed successful:');
  console.log('Journal ID:', journal.id);
  console.log('Statement Line ID:', line.id);
  console.log('Amount:', testAmount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
