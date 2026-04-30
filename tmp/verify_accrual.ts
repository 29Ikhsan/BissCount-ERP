import { PrismaClient } from '../src/generated/client';
const prisma = new PrismaClient();

async function verify() {
  console.log('--- Starting Accrual Flow Verification ---');
  
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return console.error('No tenant found');

  // 1. Create Accrual Expense
  console.log('1. Creating Accrual Expense...');
  const res = await fetch('http://localhost:3000/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant: 'VERIFY VENDOR',
      date: new Date().toISOString(),
      items: [{ 
        description: 'Test ATK', 
        amount: 500000, 
        quantity: 1, 
        accountId: '', // Will fallback to 6001
        categoryName: 'Office Supplies'
      }],
      paymentMethod: 'BANK_TRANSFER'
    })
  });
  
  const expData = await res.json();
  if (!expData.success) return console.error('Expense creation failed:', expData.error);
  const expense = expData.expense;
  console.log('   Expense created:', expense.id, 'Ref:', expense.referenceCode, 'Status:', expense.status);

  // 2. Mock Bank Statement Line
  console.log('2. Mocking Bank Statement Line...');
  const statement = await prisma.bankStatement.create({
    data: {
      accountId: (await prisma.account.findFirst({ where: { tenantId: tenant.id, code: { startsWith: '1' } } }))!.id,
      tenantId: tenant.id
    }
  });

  const line = await prisma.bankStatementLine.create({
    data: {
      statementId: statement.id,
      date: new Date(),
      description: `TRF TO ${expense.referenceCode}`,
      amount: -500000,
      isReconciled: false
    }
  });
  console.log('   Statement line created:', line.id);

  // 3. Reconcile
  console.log('3. Reconciling...');
  const reconRes = await fetch('http://localhost:3000/api/banking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lineId: line.id,
      targetId: `EXP:${expense.id}`,
      action: 'reconcile'
    })
  });
  
  const reconData = await reconRes.json();
  if (!reconData.success) return console.error('Reconciliation failed:', reconData.error);
  console.log('   Reconciliation logic executed.');

  // 4. Final Verifications
  console.log('4. Final Verifications...');
  const updatedExpense = await prisma.expense.findUnique({ where: { id: expense.id } });
  console.log('   Updated Expense Status:', updatedExpense?.status);
  
  const updatedLine = await prisma.bankStatementLine.findUnique({ where: { id: line.id } });
  console.log('   Line Reconciled:', updatedLine?.isReconciled, 'Journal Link:', updatedLine?.journalEntryId);

  if (updatedExpense?.status === 'PAID' && updatedLine?.isReconciled) {
    console.log('\n✅ VERIFICATION SUCCESSFUL!');
  } else {
    console.log('\n❌ VERIFICATION FAILED!');
  }

  // Cleanup
  await prisma.bankStatementLine.delete({ where: { id: line.id } });
  await prisma.bankStatement.delete({ where: { id: statement.id } });
  // await prisma.expense.delete({ where: { id: expense.id } });
}

verify().catch(console.error).finally(() => prisma.$disconnect());
