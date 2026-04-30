import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensurePeriodOpen } from '@/lib/periodGuard';
import { recordAudit } from '@/lib/audit';
import { requireSession } from '@/lib/access-server';

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json();
    const { productId, fromWarehouseId, toWarehouseId, quantity } = body;

    // Validate inputs
    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Missing or invalid transfer parameters.' }, { status: 400 });
    }

    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json({ error: 'Source and destination warehouses cannot be the same.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // 1. Period Lock Check
    await ensurePeriodOpen(new Date(), tenant.id);

    // 2. Transact Transfer
    await prisma.$transaction(async (tx) => {
      // Find source level
      const sourceLevel = await tx.inventoryLevel.findFirst({
        where: { productId, warehouseId: fromWarehouseId }
      });

      if (!sourceLevel || sourceLevel.quantity < quantity) {
        throw new Error(`Insufficient stock in origin warehouse. Available: ${sourceLevel?.quantity || 0}`);
      }

      // Deduct from Source
      await tx.inventoryLevel.update({
        where: { id: sourceLevel.id },
        data: { quantity: { decrement: quantity } }
      });

      // Add to Destination
      const destLevel = await tx.inventoryLevel.findFirst({
        where: { productId, warehouseId: toWarehouseId }
      });

      if (!destLevel) {
         // Create if doesn't exist
         await tx.inventoryLevel.create({
            data: { productId, warehouseId: toWarehouseId, quantity, minQuantity: 0 }
         });
      } else {
         await tx.inventoryLevel.update({
            where: { id: destLevel.id },
            data: { quantity: { increment: quantity } }
         });
      }

      // Important: We do NOT calculate COGS or post to Ledger here. 
      // A warehouse transfer does not alter total company assets, thus no P&L or BS impact.
      // We just update the StockBatch locations to track physically where the FIFO layers live.
      
      const batchesToMove = await tx.stockBatch.findMany({
         where: { productId, warehouseId: fromWarehouseId, remainingQty: { gt: 0 } },
         orderBy: { createdAt: 'asc' }
      });

      let remainingToTransfer = quantity;
      for (const batch of batchesToMove) {
         if (remainingToTransfer <= 0) break;

         const toMove = Math.min(batch.remainingQty, remainingToTransfer);
         remainingToTransfer -= toMove;

         if (toMove === batch.remainingQty) {
           // Move entire batch
           await tx.stockBatch.update({
              where: { id: batch.id },
              data: { warehouseId: toWarehouseId }
           });
         } else {
           // Split batch
           await tx.stockBatch.update({
              where: { id: batch.id },
              data: { remainingQty: { decrement: toMove } }
           });
           
           await tx.stockBatch.create({
              data: {
                 productId: batch.productId,
                 warehouseId: toWarehouseId,
                 unitCost: batch.unitCost,
                 quantity: toMove,
                 remainingQty: toMove,
                 createdAt: batch.createdAt // keep original chronographic date for FIFO
              }
           });
         }
      }
    });

    await recordAudit('UPDATE', 'Inventory', productId, tenant.id, undefined, { 
       action: 'WAREHOUSE_TRANSFER', qty: quantity, from: fromWarehouseId, to: toWarehouseId 
    });

    return NextResponse.json({ success: true, message: 'Stock successfully transferred between warehouses.' }, { status: 200 });
  } catch (error: any) {
    console.error('[Warehouse Transfer Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
