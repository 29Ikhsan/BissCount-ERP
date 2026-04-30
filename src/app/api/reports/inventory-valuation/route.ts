import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/access-server';

export async function GET() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst({
      include: { 
        products: {
          include: {
            stockBatches: {
              where: { remainingQty: { gt: 0 } }
            }
          }
        }
      }
    })

    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 404 })

    const reportData = (tenant.products || []).map(product => {
      const batches = product.stockBatches || []
      const totalQty = batches.reduce((sum, b) => sum + b.remainingQty, 0)
      const totalValue = batches.reduce((sum, b) => sum + (b.remainingQty * b.unitCost), 0)
      const avgCost = totalQty > 0 ? totalValue / totalQty : 0

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        totalQuantity: totalQty,
        valuation: totalValue,
        averageCost: avgCost,
        batchCount: batches.length
      }
    })

    const totalInventoryValue = reportData.reduce((sum, item) => sum + item.valuation, 0)

    return NextResponse.json({ 
      valuation: reportData,
      summary: {
        totalItems: reportData.length,
        totalQuantity: reportData.reduce((sum, item) => sum + item.totalQuantity, 0),
        totalValue: totalInventoryValue,
        method: tenant.inventoryMethod || 'AVERAGE'
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('Inventory Valuation API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to calculate inventory valuation',
      details: error.message
    }, { status: 500 })
  }
}
