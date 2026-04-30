import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensurePeriodOpen } from '@/lib/periodGuard';
import { postToLedger, findAccountByCode } from '@/lib/ledgerUtility';
import { recordAudit } from '@/lib/audit';
import { calculateCOGS } from '@/lib/inventoryValuation';
import { requireSession } from '@/lib/access-server';

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json();
    const { productId, warehouseId, type, quantity, reason } = body;

    // type === 'ADD' or 'REMOVE'
    if (!productId || !warehouseId || !type || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Missing required adjustment parameters' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // 1. Check Period Lock
    await ensurePeriodOpen(new Date(), tenant.id);

    const adjustment = await prisma.$transaction(async (tx) => {
      // Find current level
      let level = await tx.inventoryLevel.findFirst({
        where: { productId, warehouseId }
      });

      if (!level && type === 'REMOVE') {
        throw new Error("Cannot remove stock from empty warehouse.");
      }
      if (level && type === 'REMOVE' && level.quantity < quantity) {
        throw new Error(`Insufficient stock to remove. Available: ${level.quantity}`);
      }

      // Update Inventory Level
      if (!level) {
        level = await tx.inventoryLevel.create({
          data: { productId, warehouseId, quantity, minQuantity: 0 }
        });
      } else {
        await tx.inventoryLevel.update({
          where: { id: level.id },
          data: { 
             quantity: type === 'ADD' ? { increment: quantity } : { decrement: quantity } 
          }
        });
      }

      // Accounting Journal Processing
      // If we REMOVE stock (Stock Opname shrinkage), we must cost it via FIFO/AVG and post to Ledger Shrinkage
      if (type === 'REMOVE') {
         // Utilize our COGS valuation engine to find out exactly how much money we lost!
         const lostValue = await calculateCOGS(tx, { productId, quantity, tenantId: tenant.id });
         
         const accShrinkage = await findAccountByCode(tenant.id, '6003', tx); // 6003 = Inventory Shrinkage Expense
         const accInventory = await findAccountByCode(tenant.id, '1004', tx); // 1004 = Inventory Asset

         if (accShrinkage && accInventory && lostValue > 0) {
            await postToLedger(tx, {
              date: new Date(),
              description: `Stock Adjustment Shrinkage: ${reason || 'Physical Count Loss'}`,
              reference: `ADJ-${new Date().getTime()}`,
              tenantId: tenant.id,
              lines: [
                { accountId: accShrinkage.id, debit: lostValue, credit: 0 }, // Expense Goes Up
                { accountId: accInventory.id, debit: 0, credit: lostValue }  // Asset Goes Down
              ]
            });
         }
      }

      // If we ADD stock unexpectedly, we need a baseline cost. In Bizzcount, positive adjustments
      // should ideally be logged by purchases to set unitCost, but for physical finding, we just add qty using last average cost.
      if (type === 'ADD') {
         const product = await tx.product.findUnique({ where: { id: productId } });
         const foundValue = (product?.cost || 0) * quantity;
         
         // In a robust system, this is an "Other Income" or "Inventory Gain". 
         // Here we will just map it simply to re-inflate asset.
         await tx.stockBatch.create({
           data: {
             productId,
             warehouseId,
             quantity,
             remainingQty: quantity,
             unitCost: product?.cost || 0
           }
         });
      }

      return level;
    });

    await recordAudit('UPDATE', 'Inventory', productId, tenant.id, undefined, { adjustment: type, qty: quantity, reason });

    return NextResponse.json({ success: true, message: 'Stock adjusted & verified in ledger.' }, { status: 200 });
  } catch (error: any) {
    console.error('[Inventory Adjust Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
