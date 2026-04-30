import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      include: {
        inventoryLevels: {
          include: { warehouse: true }
        }
      }
    });

    // Calculate integrated metrics
    const totalInventoryValue = products.reduce((sum, p) => {
      const totalQty = p.inventoryLevels.reduce((q, l) => q + l.quantity, 0);
      return sum + (totalQty * p.cost);
    }, 0);

    const lowStockAlerts = products.filter(p => {
      const totalQty = p.inventoryLevels.reduce((q, l) => q + l.quantity, 0);
      const minQty = p.inventoryLevels.reduce((q, l) => q + l.minQuantity, 0);
      return totalQty <= minQty && totalQty > 0;
    }).length;

    const outOfStock = products.filter(p => {
       const totalQty = p.inventoryLevels.reduce((q, l) => q + l.quantity, 0);
       return totalQty === 0;
    }).length;

    return NextResponse.json({
      products: products.map(p => ({
        ...p,
        totalQuantity: p.inventoryLevels.reduce((q, l) => q + l.quantity, 0),
        status: p.inventoryLevels.reduce((q, l) => q + l.quantity, 0) === 0 ? 'OUT_OF_STOCK' : 
                p.inventoryLevels.reduce((q, l) => q + l.quantity, 0) <= p.inventoryLevels.reduce((q, l) => q + l.minQuantity, 0) ? 'CRITICAL' : 'HEALTHY'
      })),
      stats: {
        totalValue: totalInventoryValue,
        lowStockAlerts,
        outOfStock,
        totalSKUs: products.length
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await request.json();
    const { sku, name, category, price, cost } = body;

    if (!sku || !name) return NextResponse.json({ error: 'SKU and Name are required' }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        category: category || 'Default',
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        tenantId: tenant.id
      }
    });

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
