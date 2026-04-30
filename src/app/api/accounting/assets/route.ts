import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const assets = await prisma.fixedAsset.findMany({
      where: { tenantId: tenant.id },
      include: {
        depreciationHistories: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { purchaseDate: 'desc' }
    });

    const enhancedAssets = assets.map(asset => {
      const netBookValue = asset.cost - asset.accumulatedDepr;
      return {
        ...asset,
        netBookValue,
        monthlyDepr: (asset.cost - asset.residualValue) / asset.usefulLife
      };
    });

    return NextResponse.json(enhancedAssets);
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
    const { name, category, purchaseDate, cost, residualValue, usefulLife } = body;

    if (!name || !cost || !usefulLife) {
      return NextResponse.json({ error: 'Name, Cost, and Useful Life are required' }, { status: 400 });
    }

    const asset = await prisma.fixedAsset.create({
      data: {
        name,
        category: category || 'EQUIPMENT',
        purchaseDate: new Date(purchaseDate),
        cost: Number(cost),
        residualValue: Number(residualValue) || 0,
        usefulLife: Number(usefulLife),
        accumulatedDepr: 0,
        tenantId: tenant.id,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json(asset);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
