import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 404 });

    // Fetch all products that have BOM items
    const products = await prisma.product.findMany({
      where: { 
        tenantId: tenant.id,
        finishedBOMItems: { some: {} } // Products that ARE finished goods
      },
      include: {
        finishedBOMItems: {
          include: { rawProduct: true }
        }
      }
    });

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json();
    const { finishedProductId, items } = body; // items: [{ rawProductId, quantityRequired }]

    if (!finishedProductId || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Finished Product and Items array required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 404 });

    // Use transaction to update BOM
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing BOM items for this product
      await tx.bOMItem.deleteMany({
        where: { finishedProductId }
      });

      // 2. Create new items
      const newItems = await Promise.all(items.map(item => 
        tx.bOMItem.create({
          data: {
            finishedProductId,
            rawProductId: item.rawProductId,
            quantityRequired: Number(item.quantityRequired)
          }
        })
      ));

      return newItems;
    });

    return NextResponse.json({ message: 'BOM updated successfully', items: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
