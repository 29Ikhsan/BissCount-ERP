import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({
    where: {
      code: { in: ['1001', '2002', '2003', '6001'] }
    }
  });
  console.log(JSON.stringify(accounts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
