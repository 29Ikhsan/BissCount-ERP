import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return;
  
  const whtAcc = await prisma.account.findUnique({
    where: { code_tenantId: { code: '2003', tenantId: tenant.id } }
  });
  
  if (!whtAcc) {
    await prisma.account.create({
      data: {
        code: '2003',
        name: 'Hutang PPh 23 (WHT)',
        type: 'LIABILITY',
        balance: 0,
        tenantId: tenant.id
      }
    });
    console.log('Created account 2003');
  } else {
    console.log('Account 2003 already exists');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
