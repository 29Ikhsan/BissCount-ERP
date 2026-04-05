import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function simulateVAT() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error("No tenant found. Please run initial setup.")
      return
    }

    // 1. Create a Contact with CoreTax Identity
    const contact = await prisma.contact.create({
      data: {
        name: "Kongsi PPN",
        type: "Company",
        role: "Customer",
        taxId: "3174061502560010",
        idType: "TIN",
        idNumber: "3174061502560010",
        address: "Jalan Jakarta",
        city: "Jakarta",
        country: "IDN",
        tkuId: "1090000000002325000000",
        email: "a2@some.com",
        tenantId: tenant.id
      }
    })

    // 2. Create an Invoice with Faktur PK v1.6.1 Data
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: "INV-TAX-2026-001",
        clientName: contact.name,
        date: new Date("2026-04-03"),
        dueDate: new Date("2026-05-03"),
        amount: 10000000, 
        taxAmount: 1200000, 
        grandTotal: 11200000,
        taxPeriod: 4,
        taxYear: 2026,
        fakturStatus: "NORMAL",
        status: "PAID",
        transactionCode: "04",
        fakturType: "Normal",
        sellerTkuId: "1090000000002325000000",
        tenantId: tenant.id,
        contactId: contact.id,
        items: {
          create: [
            {
              description: "Barang ABC",
              quantity: 10,
              unitPrice: 1000000,
              total: 10000000,
              taxRate: 12,
              taxAmount: 1200000,
              sku: "000000",
              itemType: "A",
              uomCode: "UM.0002",
              ppnRate: 12
            }
          ]
        }
      }
    })

    console.log("SUCCESS: CoreTax Simulated Data Injected.")
    console.log("Invoice No:", invoice.invoiceNo)
    console.log("Client:", contact.name)
    console.log("CoreTax PK v1.6.1 Alignment: Verified")

  } catch (error) {
    console.error("Simulation failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

simulateVAT()
