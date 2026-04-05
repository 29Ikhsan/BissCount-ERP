const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const accs = await prisma.account.findMany();
  console.log(JSON.stringify(accs.map(a => ({ code: a.code, name: a.name })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
