import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return;
  
  const suspenseAcc = await prisma.account.findUnique({
    where: { code_tenantId: { code: '999', tenantId: tenant.id } }
  });
  
  if (!suspenseAcc) {
    await prisma.account.create({
      data: {
        code: '999',
        name: 'Suspense/Uncategorized',
        type: 'EQUITY',
        balance: 0,
        tenantId: tenant.id
      }
    });
    console.log('Created account 999');
  } else {
    console.log('Account 999 already exists');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
