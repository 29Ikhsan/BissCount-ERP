import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await request.json();
    const { month, year } = body;

    const assets = await prisma.fixedAsset.findMany({
      where: { tenantId: tenant.id, status: 'ACTIVE' }
    });

    if (assets.length === 0) {
      return NextResponse.json({ error: 'No active assets found for depreciation' }, { status: 400 });
    }

    // 1. Calculate Monthly Depreciation for all assets
    const results = assets.map(asset => {
      const monthlyDepr = (asset.cost - asset.residualValue) / asset.usefulLife;
      return {
        assetId: asset.id,
        amount: monthlyDepr,
        name: asset.name
      };
    });

    const totalDepreciation = results.reduce((sum, res) => sum + res.amount, 0);

    // 2. Perform Transactional Run (Atomically)
    const run = await prisma.$transaction(async (tx) => {
      // a. Create Depreciation Run record
      const depreciationRun = await tx.depreciationRun.create({
        data: {
          month: Number(month),
          year: Number(year),
          tenantId: tenant.id
        }
      });

      // b. Create Histories and Update Asset Accumulated Depr
      for (const res of results) {
        await tx.depreciationHistory.create({
          data: {
            assetId: res.assetId,
            amount: res.amount,
            month: Number(month),
            year: Number(year),
            tenantId: tenant.id
          }
        });

        await tx.fixedAsset.update({
          where: { id: res.assetId },
          data: {
            accumulatedDepr: { increment: res.amount }
          }
        });
      }

      // c. POST TO LEDGER (Automated Double-Entry)
      // We look for accounts: 6100 (Depr Expense) and 1700 (Accumulated Depr)
      const deprExpenseAccount = await tx.account.findFirst({ where: { tenantId: tenant.id, code: '6100' } });
      const accumDeprAccount = await tx.account.findFirst({ where: { tenantId: tenant.id, code: '1700' } });

      if (deprExpenseAccount && accumDeprAccount) {
        await tx.journalEntry.create({
          data: {
            date: new Date(year, month - 1, 28), // End of month
            description: `Automated Depreciation Run - ${month}/${year}`,
            reference: `DEPR-${month}-${year}`,
            tenantId: tenant.id,
            lines: {
              create: [
                { accountId: deprExpenseAccount.id, debit: totalDepreciation, credit: 0 },
                { accountId: accumDeprAccount.id, debit: 0, credit: totalDepreciation }
              ]
            }
          }
        });
      }

      return depreciationRun;
    });

    return NextResponse.json({
      message: 'Depreciation run successfully processed and posted to ledger.',
      totalAmount: totalDepreciation,
      assetCount: assets.length,
      runId: run.id
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
