import { prisma } from './prisma';

/**
 * Records incoming stock and updates the inventory valuation.
 */
export async function recordStockIn(tx: any, {
  productId,
  warehouseId,
  quantity,
  unitCost,
  tenantId
}: {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  tenantId: string;
}) {
  const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  // 1. Create a new Stock Batch
  await tx.stockBatch.create({
    data: {
      productId,
      warehouseId,
      quantity,
      remainingQty: quantity,
      unitCost
    }
  });

  // 2. If Method is AVERAGE, update the Product Cost
  if (tenant.inventoryMethod === 'AVERAGE') {
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: { inventoryLevels: true }
    });

    if (product) {
      const currentQty = product.inventoryLevels.reduce((sum: number, lvl: any) => sum + lvl.quantity, 0);
      const oldCost = product.cost || 0;
      
      // Moving Average Formula: ((Old Qty * Old Cost) + (New Qty * New Cost)) / (Old Qty + New Qty)
      const newTotalQty = currentQty + quantity;
      const newAverageCost = newTotalQty > 0 
        ? ((currentQty * oldCost) + (quantity * unitCost)) / newTotalQty
        : unitCost;

      await tx.product.update({
        where: { id: productId },
        data: { cost: newAverageCost }
      });
    }
  }

  // 3. Update Inventory Level
  await tx.inventoryLevel.upsert({
    where: { productId_warehouseId: { productId, warehouseId } },
    update: { quantity: { increment: quantity } },
    create: { productId, warehouseId, quantity }
  });
}

/**
 * Calculates COGS and depletes stock batches according to the valuation method.
 */
export async function calculateCOGS(tx: any, {
  productId,
  quantity,
  tenantId
}: {
  productId: string;
  quantity: number;
  tenantId: string;
}) {
  const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  if (tenant.inventoryMethod === 'FIFO') {
    // FIFO Logic: Deplete earliest batches first
    const batches = await tx.stockBatch.findMany({
      where: { productId, remainingQty: { gt: 0 } },
      orderBy: { createdAt: 'asc' }
    });

    let remainingToSell = quantity;
    let totalCOGS = 0;

    for (const batch of batches) {
      if (remainingToSell <= 0) break;

      const toDeplete = Math.min(batch.remainingQty, remainingToSell);
      totalCOGS += toDeplete * batch.unitCost;
      remainingToSell -= toDeplete;

      await tx.stockBatch.update({
        where: { id: batch.id },
        data: { remainingQty: { decrement: toDeplete } }
      });
    }

    // If remainingToSell > 0, we are overselling (negative inventory)
    // For simplicity, we'll use the last known cost for the remainder
    if (remainingToSell > 0) {
      const lastProduct = await tx.product.findUnique({ where: { id: productId } });
      totalCOGS += remainingToSell * (lastProduct?.cost || 0);
    }

    return totalCOGS;
  } else {
    // AVERAGE Logic: Simple product.cost * quantity
    const product = await tx.product.findUnique({ where: { id: productId } });
    return quantity * (product?.cost || 0);
  }
}
