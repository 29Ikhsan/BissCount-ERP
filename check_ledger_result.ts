import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function main() {
  const latestEntry = await prisma.journalEntry.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { lines: { include: { account: true } } }
  });
  
  if (latestEntry) {
    console.log('--- Latest Journal Entry ---');
    console.log('ID:', latestEntry.id);
    console.log('Description:', latestEntry.description);
    console.log('Lines:');
    latestEntry.lines.forEach(l => {
      console.log(`  [${l.account.code}] ${l.account.name}: Debit=${l.debit}, Credit=${l.credit}`);
    });
    
    const totalDebit = latestEntry.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = latestEntry.lines.reduce((s, l) => s + l.credit, 0);
    console.log(`Total: Debit=${totalDebit}, Credit=${totalCredit}`);
  } else {
    console.log('No journal entries found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
