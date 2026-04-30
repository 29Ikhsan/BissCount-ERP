import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/access-server';

export async function GET(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { searchParams } = new URL(req.url)
    const assetId = searchParams.get('assetId')

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const history = await prisma.depreciationHistory.findMany({
      where: { 
        tenantId: tenant.id,
        ...(assetId ? { assetId } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: { asset: true }
    })

    return NextResponse.json({ history }, { status: 200 })
  } catch (error: any) {
    console.error('Fetch Asset History Error:', error)
    return NextResponse.json({ error: 'Failed to fetch depreciation history' }, { status: 500 })
  }
}
