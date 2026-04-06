import { PrismaClient } from '../src/generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with Master Records...')

  // 1. Get or Create Tenant
  let tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'AKSIA Global Corp',
      },
    })
    console.log(`[+] Created Tenant: ${tenant.name} (${tenant.id})`)
  } else {
    console.log(`[+] Using existing Tenant: ${tenant.name} (${tenant.id})`)
  }

  // 2. Create SuperAdmin User
  const hashedPassword = await bcrypt.hash('aksia2026', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@aksia.com' },
    update: {
      password: hashedPassword,
      name: 'Ikhsan Administrator',
      role: 'SUPERADMIN',
      tenantId: tenant.id
    },
    create: {
      email: 'admin@aksia.com',
      name: 'Ikhsan Administrator',
      password: hashedPassword,
      role: 'SUPERADMIN',
      tenantId: tenant.id
    },
  })
  console.log(`[+] Seeded SuperAdmin: ${user.email}`)

  // 3. Create Basic Chart of Accounts (COA)
  const coaData = [
    { code: '1001', name: 'Kas/Bank BCA', type: 'ASSET', balance: 500000000 },
    { code: '1002', name: 'Piutang Usaha', type: 'ASSET', balance: 125550000 }, // +5.55M from Invoice
    { code: '1004', name: 'Persediaan Barang', type: 'ASSET', balance: 2000000 }, // +2.0M from PO
    { code: '2001', name: 'Hutang Usaha', type: 'LIABILITY', balance: 47220000 }, // +2.22M from PO
    { code: '2002', name: 'Hutang Pajak (PPN)', type: 'LIABILITY', balance: 330000 }, // 550k (In) - 220k (Out)
    { code: '3001', name: 'Modal Pemilik', type: 'EQUITY', balance: 575000000 },
    { code: '1501', name: 'Akumulasi Penyusutan', type: 'ASSET', balance: 0 },
    { code: '4001', name: 'Pendapatan Penjualan', type: 'REVENUE', balance: 5000000 }, // +5.0M from Invoice
    { code: '5001', name: 'Beban Pokok Penjualan (HPP)', type: 'EXPENSE', balance: 0 },
    { code: '6001', name: 'Beban Operasional', type: 'EXPENSE', balance: 0 },
    { code: '6002', name: 'Beban Penyusutan', type: 'EXPENSE', balance: 0 },
    { code: '6003', name: 'Beban Gaji & Upah', type: 'EXPENSE', balance: 0 },
    { code: '2003', name: 'Hutang Gaji', type: 'LIABILITY', balance: 0 },
    { code: '2004', name: 'Hutang PPh Pasal 21', type: 'LIABILITY', balance: 0 },
  ]

  const accounts: Record<string, string> = {}
  for (const account of coaData) {
    const acc = await prisma.account.upsert({
      where: { 
        code_tenantId: {
          code: account.code,
          tenantId: tenant.id
        }
      },
      update: {
        name: account.name,
        type: account.type,
        balance: account.balance
      },
      create: {
        ...account,
        tenantId: tenant.id
      }
    })
    accounts[account.code] = acc.id
  }
  console.log(`[+] Seeded ${coaData.length} Chart of Accounts.`)

  // 4. Create Warehouses
  const whJakarta = await prisma.warehouse.upsert({
    where: { id: 'factory-wh-jakarta' },
    update: { name: 'Gudang Utama Jakarta', location: 'Jakarta Selatan' },
    create: { id: 'factory-wh-jakarta', name: 'Gudang Utama Jakarta', location: 'Jakarta Selatan', tenantId: tenant.id }
  })
  const whSurabaya = await prisma.warehouse.upsert({
    where: { id: 'factory-wh-surabaya' },
    update: { name: 'Pusat Distribusi Surabaya', location: 'Surabaya East' },
    create: { id: 'factory-wh-surabaya', name: 'Pusat Distribusi Surabaya', location: 'Surabaya East', tenantId: tenant.id }
  })
  console.log(`[+] Seeded 2 Warehouses: Jakarta & Surabaya`)

  // 5. Create Default Tax
  const tax = await prisma.tax.upsert({
    where: { id: 'tax-vat-11' },
    update: {
        name: 'PPN 11%',
        rate: 11,
    },
    create: { 
      id: 'tax-vat-11',
      name: 'PPN 11%', 
      rate: 11, 
      type: 'VAT', 
      tenantId: tenant.id 
    }
  })
  console.log(`[+] Seeded Tax: ${tax.name}`)

  // 6. Create Cost Center
  const cc = await prisma.costCenter.upsert({
    where: { 
      code_tenantId: {
        code: 'CC-OPS',
        tenantId: tenant.id
      }
    },
    update: {
        name: 'Operasional',
    },
    create: { 
      code: 'CC-OPS', 
      name: 'Operasional', 
      tenantId: tenant.id 
    }
  })
  console.log(`[+] Seeded Cost Center: ${cc.name}`)

  // 7. Sample Contacts
  const customer = await prisma.contact.upsert({
    where: { id: 'cust-demo-1' },
    update: {
        name: 'PT Maju Bersama',
        role: 'Customer',
    },
    create: {
      id: 'cust-demo-1',
      type: 'COMPANY', role: 'Customer', name: 'PT Maju Bersama', email: 'finance@majubersama.co.id',
      phone: '021-5551234', currency: 'IDR', paymentTerms: 'Net 30', tenantId: tenant.id
    }
  })
  const vendor = await prisma.contact.upsert({
    where: { id: 'vend-demo-1' },
    update: {
        name: 'CV Sumber Teknologi',
        role: 'Vendor',
    },
    create: {
      id: 'vend-demo-1',
      type: 'COMPANY', role: 'Vendor', name: 'CV Sumber Teknologi', email: 'procurement@sumbertek.com',
      phone: '021-5559876', currency: 'IDR', paymentTerms: 'Net 14', tenantId: tenant.id
    }
  })
  console.log(`[+] Seeded 2 Sample Contacts`)

  // 8. Sample Invoice & Ledger
  let inv = await prisma.invoice.findFirst({ where: { invoiceNo: `INV-${new Date().getFullYear()}-001` } });
  if (!inv) {
    inv = await prisma.invoice.create({
      data: {
        invoiceNo: `INV-${new Date().getFullYear()}-001`,
        clientName: customer.name,
        date: new Date('2026-04-12'),
        dueDate: new Date('2026-05-12'),
        amount: 5000000,
        taxAmount: 600000, // PPN 12%
        grandTotal: 5600000,
        discountAmount: 0,
        paidAmount: 0,
        status: 'PENDING',
        taxPeriod: 4,
        taxYear: 2026,
        tenantId: tenant.id,
        contactId: customer.id,
        costCenterId: cc.id,
        items: {
          create: [{
            description: 'Strategic ERP Implementation - Phase 1 (AKSIA Platform)',
            quantity: 1,
            unitPrice: 5000000,
            taxRate: 12,
            taxAmount: 600000,
            total: 5000000,
            ppnRate: 12,
            itemType: 'A'
          }]
        }
      }
    })
    
    // Ledger Posting for Invoice
    await prisma.journalEntry.create({
      data: {
        date: inv.date,
        description: `Automatic Journal: Sales Invoice ${inv.invoiceNo} for ${inv.clientName}`,
        reference: inv.invoiceNo,
        tenantId: tenant.id,
        lines: {
          create: [
            { accountId: accounts['1002'], debit: 5600000, credit: 0 },
            { accountId: accounts['4001'], debit: 0, credit: 5000000 },
            { accountId: accounts['2002'], debit: 0, credit: 600000 }
          ]
        }
      }
    })
    console.log('[+] Created Sample Invoice & Ledger Entries')
  }

  // 9. Sample Withholding Expenses (PPh Unifikasi)
  const expenseData = [
    {
      merchant: 'Velocity Agency',
      date: new Date('2026-04-15'),
      category: 'OPERATING',
      amount: 10000000,
      description: 'Monthly Maintenance Service Fee',
      whtRate: 2,
      whtAmount: 200000,
      article: '23'
    },
    {
      merchant: 'Ruko Office Space',
      date: new Date('2026-04-20'),
      category: 'RENT',
      amount: 25000000,
      description: 'Office Rental Q2',
      whtRate: 10,
      whtAmount: 2500000,
      article: '4(2)'
    }
  ]

  for (const exp of expenseData) {
    const existing = await prisma.expense.findFirst({
        where: { merchant: exp.merchant, date: exp.date, tenantId: tenant.id }
    })
    if (!existing) {
        await prisma.expense.create({
            data: {
                merchant: exp.merchant,
                date: exp.date,
                category: exp.category,
                amount: exp.amount,
                taxPeriod: 4,
                taxYear: 2026,
                tenantId: tenant.id,
                items: {
                    create: [{
                        description: exp.description,
                        amount: exp.amount,
                        whtRate: exp.whtRate,
                        whtAmount: exp.whtAmount,
                        total: exp.amount - exp.whtAmount
                    }]
                }
            }
        })
        console.log(`[+] Seeded Withholding Expense: ${exp.merchant} (PPh ${exp.article})`)
    }
  }

  // 10. Sample Inventory Assets (Institutional Grade)
  const productData = [
    { sku: 'RAW-STL-001', name: 'Premium Steel Plate', category: 'RAW_MATERIAL', price: 0, cost: 450000 },
    { sku: 'RAW-ALU-002', name: 'Aviation Grade Aluminum', category: 'RAW_MATERIAL', price: 0, cost: 850000 },
    { sku: 'FG-WID-101', name: 'Aksia Smart Widget V2', category: 'FINISHED_GOOD', price: 2500000, cost: 1200000 },
    { sku: 'FG-MCH-505', name: 'Industrial Drill Press', category: 'FINISHED_GOOD', price: 15000000, cost: 8500000 },
    { sku: 'PKG-BOX-SK-01', name: 'Security Packaging Box', category: 'PACKAGING', price: 5000, cost: 2100 },
  ]

  for (const p of productData) {
    const prod = await prisma.product.upsert({
      where: { sku_tenantId: { sku: p.sku, tenantId: tenant.id } },
      update: { ...p },
      create: { ...p, tenantId: tenant.id }
    })

    // Seed Inventory Levels across warehouses
    const qtyJakarta = p.sku.includes('RAW') ? 150 : 25;
    const qtySurabaya = p.sku.includes('RAW') ? 0 : 10; // Low stock trigger for Raw in Surabaya

    await prisma.inventoryLevel.upsert({
      where: { productId_warehouseId: { productId: prod.id, warehouseId: whJakarta.id } },
      update: { quantity: qtyJakarta },
      create: { productId: prod.id, warehouseId: whJakarta.id, quantity: qtyJakarta, minQuantity: 20, tenantId: tenant.id }
    })

    await prisma.inventoryLevel.upsert({
      where: { productId_warehouseId: { productId: prod.id, warehouseId: whSurabaya.id } },
      update: { quantity: qtySurabaya },
      create: { productId: prod.id, warehouseId: whSurabaya.id, quantity: qtySurabaya, minQuantity: 5, tenantId: tenant.id }
    })
  }

  console.log(`[+] Seeded 5 Strategic Products & Multi-Warehouse Stock Levels`)

  // 11. Sample CRM Data (Institutional Grade)
  const leadData = [
    { name: 'Director of Procurement', company: 'IndoFood Corp', email: 'procurement@indofood.co.id', value: 250000000, status: 'QUALIFIED', source: 'TIKTOK_ADS' },
    { name: 'Operations Lead', company: 'Grab Indonesia', email: 'ops@grab.com', value: 1200000000, status: 'NEW', source: 'REFERRAL' },
    { name: 'Supply Chain Manager', company: 'Unilever ID', email: 'scm@unilever.id', value: 450000000, status: 'QUALIFIED', source: 'GOOGLE_SEARCH' },
  ]

  for (const l of leadData) {
    let lead = await prisma.lead.findFirst({
        where: { email: l.email, tenantId: tenant.id }
    });

    if (!lead) {
        lead = await prisma.lead.create({
            data: { ...l, tenantId: tenant.id }
        });
    }

    if (l.status === 'QUALIFIED') {
      // Create Opportunity for Qualified Leads
      await prisma.opportunity.upsert({
        where: { id: `opp-${lead.id}` },
        update: { value: l.value },
        create: {
          id: `opp-${lead.id}`,
          title: `ERP Integration - ${l.company}`,
          value: l.value,
          probability: 65,
          stage: 'PROPOSAL',
          tenantId: tenant.id,
          leadId: lead.id
        }
      })
    }
  }
  console.log(`[+] Seeded 3 High-Value Leads & 2 Active Opportunities`)

  // 12. Marketing Campaigns
  await prisma.marketingCampaign.upsert({
    where: { id: 'camp-q2-2026' },
    update: { status: 'ACTIVE' },
    create: {
      id: 'camp-q2-2026',
      name: 'Q2 Industrial ERP Push',
      type: 'DIGITAL_MARKETING',
      status: 'ACTIVE',
      tenantId: tenant.id
    }
  })
  console.log(`[+] Seeded Active Marketing Campaign: Q2 Push`)

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
