import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCOGS } from '@/lib/inventoryValuation';
import { requireSession } from '@/lib/access-server';

export async function GET(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 404 });

    const orders = await prisma.productionOrder.findMany({
      where: { tenantId: tenant.id },
      include: { product: true, warehouse: true },
      orderBy: { orderNo: 'desc' }
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json();
    const { productId, quantity, warehouseId } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 404 });

    const count = await prisma.productionOrder.count({ where: { tenantId: tenant.id } });
    const orderNo = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const order = await prisma.productionOrder.create({
      data: {
        orderNo,
        productId,
        quantity: Number(quantity),
        warehouseId,
        tenantId: tenant.id
      },
      include: { product: true }
    });

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { id, action } = await req.json();
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: { 
        product: { 
          include: { finishedBOMItems: true } 
        } 
      }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (action === 'START' && order.status === 'PLANNED') {
      if (!order.warehouseId) return NextResponse.json({ error: 'Warehouse required to start' }, { status: 400 });

      // --- FINANCIAL CONTROL: PRE-FLIGHT INVENTORY VALIDATION ---
      for (const bomItem of order.product.finishedBOMItems) {
        const consumptionQty = bomItem.quantityRequired * order.quantity;
        const level = await prisma.inventoryLevel.findFirst({
           where: { productId: bomItem.rawProductId, warehouseId: order.warehouseId }
        });
        const currentStock = level ? level.quantity : 0;
        
        if (consumptionQty > currentStock) {
           return NextResponse.json({ 
              error: `Production Blocked: Insufficient Raw Materials. Need ${consumptionQty} units, but only ${currentStock} units exist.` 
           }, { status: 400 });
        }
      }

      // BOM Consumption Transaction
      await prisma.$transaction(async (tx) => {
        for (const bomItem of order.product.finishedBOMItems) {
          const consumptionQty = bomItem.quantityRequired * order.quantity;
          
          await tx.inventoryLevel.update({
            where: {
              productId_warehouseId: {
                productId: bomItem.rawProductId,
                warehouseId: order.warehouseId!
              }
            },
            data: {
              quantity: { decrement: consumptionQty }
            }
          });
        }

        await tx.productionOrder.update({
          where: { id },
          data: { status: 'IN_PROGRESS', startDate: new Date() }
        });
      });

      return NextResponse.json({ message: 'Production started and inventory consumed' });
    }

    if (action === 'COMPLETE' && order.status === 'IN_PROGRESS') {
      await prisma.$transaction(async (tx) => {
        // --- CALCULATION OF ACTUAL COGS (Depleting FIFO Batches) ---
        const bomItems = await tx.bOMItem.findMany({
          where: { finishedProductId: order.productId }
        });

        let totalCost = 0;
        for (const item of bomItems) {
           const requiredQty = item.quantityRequired * order.quantity;
           totalCost += await calculateCOGS(tx, {
              productId: item.rawProductId,
              quantity: requiredQty,
              tenantId: order.tenantId
           });
        }

        // Add Finished Good to Warehouse
        await tx.inventoryLevel.upsert({
          where: {
            productId_warehouseId: {
              productId: order.productId,
              warehouseId: order.warehouseId!
            }
          },
          update: { quantity: { increment: order.quantity } },
          create: {
            productId: order.productId,
            warehouseId: order.warehouseId!,
            quantity: order.quantity,
            tenantId: order.tenantId
          }
        });

        // 10. Automated Asset Conversion Journaling
        // Debit: Inventory (Finished Goods) - 1004
        // Credit: Raw Materials (Asset) - 1002
        const finishedAcc = await tx.account.findFirst({
          where: { tenantId: order.tenantId, code: '1004' }
        });
        const rawAcc = await tx.account.findFirst({
          where: { tenantId: order.tenantId, code: '1002' }
        });

        if (finishedAcc && rawAcc && totalCost > 0) {
          await tx.journalEntry.create({
            data: {
              date: new Date(),
              description: `Automatic Journal: Production Asset Conversion ${order.orderNo}`,
              reference: order.orderNo,
              tenantId: order.tenantId,
              lines: {
                create: [
                  { accountId: finishedAcc.id, debit: totalCost, credit: 0 },
                  { accountId: rawAcc.id, debit: 0, credit: totalCost }
                ]
              }
            }
          });

          // Explicitly update balances
          await tx.account.update({ where: { id: finishedAcc.id }, data: { balance: { increment: totalCost } } });
          await tx.account.update({ where: { id: rawAcc.id }, data: { balance: { decrement: totalCost } } });
        }

        await tx.productionOrder.update({
          where: { id },
          data: { status: 'COMPLETED', endDate: new Date() }
        });
      });
      return NextResponse.json({ message: 'Production completed and HPP journaled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
