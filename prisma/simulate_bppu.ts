import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function simulateBPPU() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error("No tenant found. Please run initial setup.")
      return
    }

    // 1. Create a Merchant (Vendor) for Professional Services
    const merchant = await prisma.contact.create({
      data: {
        name: "Lydia Consulting Firm",
        type: "Company",
        role: "Vendor",
        taxId: "01.234.567.8-012.000",
        idType: "NPWP",
        idNumber: "012345678012000",
        address: "Sudirman Tower, Jakarta",
        city: "Jakarta",
        country: "Indonesia",
        tkuId: "3172022407981234000000",
        tenantId: tenant.id
      }
    })

    // 2. Create a Service Expense with PPh 23 (2%)
    const expense = await prisma.expense.create({
      data: {
        date: new Date("2026-04-05"),
        merchant: merchant.name,
        category: "Professional Services",
        amount: 20000000, // 20 Million Gross
        taxAmount: 0,
        grandTotal: 19600000, // 20M - 2% (400k)
        status: "PAID",
        employeeName: "Finance Admin",
        tenantId: tenant.id,
        contactId: merchant.id,
        taxPeriod: 4,
        taxYear: 2026,
        items: {
          create: [
            {
              description: "IT Security Audit Q2",
              amount: 20000000,
              whtRate: 2,
              whtAmount: 400000,
              total: 19600000,
              taxObjectCode: "24-104-19", // Services Code for PPh 23
              tkuId: "3172022407981234000000",
              workerStatus: "Resident",
              position: "Consultant",
              ptkpStatus: "TK/0",
              facilityCap: "N/A"
            }
          ]
        }
      }
    })

    console.log("SUCCESS: CoreTax BPPU Simulated Data Injected.")
    console.log("Merchant:", merchant.name)
    console.log("Expense ID:", expense.id)
    console.log("WHT (2%): Rp 400,000 (PPh 23)")

  } catch (error) {
    console.error("Simulation failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

simulateBPPU()
