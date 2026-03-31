import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with Master Records...')

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Bizzcount Global Corp',
    },
  })
  console.log(`[+] Created Tenant: ${tenant.name} (${tenant.id})`)

  // 2. Create SuperAdmin User
  const hashedPassword = await bcrypt.hash('bizzcount2026', 10)

  const user = await prisma.user.create({
    data: {
      email: 'admin@bizzcount.com',
      name: 'Ikhsan Administrator',
      password: hashedPassword,
      role: 'SUPERADMIN',
      tenantId: tenant.id
    },
  })
  console.log(`[+] Created SuperAdmin: ${user.email}`)

  // 3. Create Basic Chart of Accounts (COA)
  const coaData = [
    { code: '1001', name: 'Cash in Bank', type: 'ASSET', balance: 500000000 },
    { code: '1002', name: 'Accounts Receivable', type: 'ASSET', balance: 120000000 },
    { code: '2001', name: 'Accounts Payable', type: 'LIABILITY', balance: 45000000 },
    { code: '3001', name: 'Owner Equity', type: 'EQUITY', balance: 575000000 },
    { code: '4001', name: 'Product Sales', type: 'REVENUE', balance: 0 },
    { code: '5001', name: 'Cost of Goods Sold', type: 'EXPENSE', balance: 0 },
    { code: '6001', name: 'Operational Expense', type: 'EXPENSE', balance: 0 },
  ]

  for (const account of coaData) {
    await prisma.account.create({
      data: {
        ...account,
        tenantId: tenant.id
      }
    })
  }
  console.log(`[+] Seeded ${coaData.length} Chart of Accounts.`)
  
  // 4. Create an Example Product
  await prisma.product.create({
    data: {
      sku: 'SKU-AWS-EC2',
      name: 'AWS Cloud Hosting Subscriptions',
      category: 'Services',
      price: 150000,
      cost: 50000,
      tenantId: tenant.id
    }
  })
  console.log(`[+] Seeded 1 Example Product.`)

  console.log('✅ Database Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
