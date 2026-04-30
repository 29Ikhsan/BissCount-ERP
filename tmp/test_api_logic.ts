import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.log('No tenant found')
      return
    }

    const invoices = await prisma.invoice.findMany({ where: { tenantId: tenant.id } })
    const totalPPNOut = invoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0)
    
    const expenses = await prisma.expense.findMany({ where: { tenantId: tenant.id } })
    const totalPPNIn = expenses.reduce((sum, exp) => sum + (exp.taxAmount || 0), 0)
    
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      include: { inventoryLevels: true }
    })

    let totalInventoryValue = 0
    products.forEach(p => {
      const qty = p.inventoryLevels.reduce((sum, l) => sum + l.quantity, 0)
      totalInventoryValue += (qty * (p.cost || 0))
    })

    console.log({
      totalPPNOut,
      totalPPNIn,
      totalInventoryValue,
      productCount: products.length
    })
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
