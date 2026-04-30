import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const productId = params.id;
    if (!productId) {
       return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Fetch active batches for this product ordered chronologically (FIFO Style)
    const batches = await prisma.stockBatch.findMany({
      where: { 
        productId: productId,
        remainingQty: { gt: 0 } // Only fetch layers that are not yet depleted
      },
      orderBy: { createdAt: 'asc' },
      include: {
         warehouse: true
      }
    });

    const product = await prisma.product.findUnique({
       where: { id: productId }
    });

    return NextResponse.json({ 
       productName: product?.name,
       sku: product?.sku,
       method: tenant.inventoryMethod,
       batches 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
