import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensurePeriodOpen } from '@/lib/periodGuard'
import { postToLedger, findAccountByCode } from '@/lib/ledgerUtility'
import { recordAudit } from '@/lib/audit'
import { requireSession } from '@/lib/access-server';

export async function GET() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const assets = await prisma.fixedAsset.findMany({
      where: { tenantId: tenant.id },
      orderBy: { purchaseDate: 'desc' }
    })

    return NextResponse.json({ assets }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { name, category, purchaseDate, cost, residualValue, usefulLife } = body

    if (!name || !cost || !usefulLife) {
      return NextResponse.json({ error: 'Name, cost, and useful life are required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const asset = await prisma.fixedAsset.create({
      data: {
        name,
        category: category || 'General',
        purchaseDate: new Date(purchaseDate),
        cost: parseFloat(cost),
        residualValue: parseFloat(residualValue) || 0,
        usefulLife: parseInt(usefulLife),
        tenantId: tenant.id
      }
    })

    await recordAudit('CREATE', 'FixedAsset', asset.id, tenant.id, undefined, { name: asset.name, cost: asset.cost })

    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    console.error('Asset Registration Error:', error)
    return NextResponse.json({ error: 'Failed to register asset' }, { status: 500 })
  }
}

// Custom handler for Running Depreciation
export async function PATCH() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // 1. Period Protection
    await ensurePeriodOpen(now, tenant.id)

    // 2. Check if depreciation has already been run for this month
    const existingRun = await prisma.depreciationRun.findUnique({
      where: {
        month_year_tenantId: {
          month: currentMonth,
          year: currentYear,
          tenantId: tenant.id
        }
      }
    })

    if (existingRun) {
      return NextResponse.json({ 
        error: `Depreciation has already been processed for ${now.toLocaleString('default', { month: 'long' })} ${currentYear}.` 
      }, { status: 400 })
    }

    const assets = await prisma.fixedAsset.findMany({
      where: { tenantId: tenant.id, status: 'ACTIVE' }
    })

    if (assets.length === 0) {
      return NextResponse.json({ message: 'No active assets found to depreciate.' }, { status: 200 })
    }

    let totalDepreciationPosted = 0

    await prisma.$transaction(async (tx) => {
      // Find Accounting accounts
      const accDeprExp = await findAccountByCode(tenant.id, '6002')
      const accAccDepr = await findAccountByCode(tenant.id, '1501')

      for (const asset of assets) {
        // Simple Straight Line Depreciation: (Cost - Residual) / Useful Life
        const monthlyDepr = (asset.cost - asset.residualValue) / asset.usefulLife
        const newAccDepr = Math.min(asset.cost - asset.residualValue, asset.accumulatedDepr + monthlyDepr)
        
        await tx.fixedAsset.update({
          where: { id: asset.id },
          data: { 
            accumulatedDepr: newAccDepr,
            status: newAccDepr >= (asset.cost - asset.residualValue) ? 'FULLY_DEPRECIATED' : 'ACTIVE'
          }
        })
        
        // Log individual asset depreciation history
        await tx.depreciationHistory.create({
          data: {
            assetId: asset.id,
            amount: monthlyDepr,
            month: currentMonth,
            year: currentYear,
            tenantId: tenant.id
          }
        })

        totalDepreciationPosted += monthlyDepr
      }

      // 3. Automated Ledger Posting for total depreciation
      if (accDeprExp && accAccDepr && totalDepreciationPosted > 0) {
        await postToLedger(tx, {
          date: now,
          description: `Automatic Journal: Monthly Depreciation Run for ${now.toLocaleString('default', { month: 'long' })} ${currentYear}`,
          reference: `DEPR-${currentMonth}-${currentYear}`,
          tenantId: tenant.id,
          lines: [
            { accountId: accDeprExp.id, debit: totalDepreciationPosted, credit: 0 },
            { accountId: accAccDepr.id, debit: 0, credit: totalDepreciationPosted }
          ]
        })
      }

      // 4. Create History Record for the Run
      await tx.depreciationRun.create({
        data: {
          month: currentMonth,
          year: currentYear,
          tenantId: tenant.id
        }
      })
    })

    // 5. Record Audit Log for the Run (Outside transaction or inside, depending on preference)
    await recordAudit('POST', 'FixedAsset', `RUN-${currentMonth}-${currentYear}`, tenant.id, undefined, { 
      action: 'MONTHLY_DEPRECIATION',
      month: currentMonth,
      year: currentYear,
      assetCount: assets.length,
      totalAmount: totalDepreciationPosted 
    })

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed depreciation for ${assets.length} assets for ${now.toLocaleString('default', { month: 'long' })} ${currentYear}.`,
      totalPosted: totalDepreciationPosted
    })
  } catch (error: any) {
    console.error('Depreciation Error:', error)
    return NextResponse.json({ error: error.message || 'Depreciation run failed' }, { status: 500 })
  }
}
