import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      name, sku, category, salesPrice, costPrice, 
      trackInventory, initialStock, minStock, 
      isManufactured, bomItems 
    } = body

    // Validate request
    if (!name || !sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 })
    }

    // Workaround: Get default Tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      return NextResponse.json({ error: 'System Error: No Master Tenant Found' }, { status: 500 })
    }

    // Check if SKU already exists
    const existing = await prisma.product.findUnique({
      where: { sku_tenantId: { sku, tenantId: tenant.id } }
    })

    if (existing) {
      return NextResponse.json({ error: 'Product SKU already exists' }, { status: 400 })
    }

    // Handle Warehouse for Inventory Tracking
    let warehouse = await prisma.warehouse.findFirst({ where: { tenantId: tenant.id } })
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: { name: 'Main Distribution Center', location: 'HQ', tenantId: tenant.id }
      })
    }

    // Transaction logic
    const newProduct = await prisma.$transaction(async (tx) => {
      // 1. Create Product
      const product = await tx.product.create({
        data: {
          name,
          sku,
          category: category || 'Uncategorized',
          price: parseFloat(salesPrice) || 0,
          cost: parseFloat(costPrice) || 0,
          tenantId: tenant.id
        }
      })

      // 2. Track Initial Inventory (if enabled)
      if (trackInventory) {
        await tx.inventoryLevel.create({
          data: {
            productId: product.id,
            warehouseId: warehouse!.id,
            quantity: parseInt(initialStock) || 0,
            minQuantity: parseInt(minStock) || 0
          }
        })
      }

      // 3. Bill of Materials (if manufactured)
      if (isManufactured && bomItems && bomItems.length > 0) {
        for (const item of bomItems) {
          // Find matching raw product
          const rawProduct = await tx.product.findFirst({
            where: { sku: item.sku, tenantId: tenant.id }
          })
          
          if (rawProduct) {
            await tx.bOMItem.create({
              data: {
                finishedProductId: product.id,
                rawProductId: rawProduct.id,
                quantityRequired: parseFloat(item.quantity) || 1
              }
            })
          }
        }
      }

      return product
    })

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 })
  } catch (error) {
    console.error('[Create Inventory Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      include: { 
        inventoryLevels: true,
        bomItems: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ products }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
