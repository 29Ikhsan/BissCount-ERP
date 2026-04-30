import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPeriodLocked } from '@/lib/closing-utils';
import { findAccountByCode } from '@/lib/ledgerUtility';

export async function POST(req: Request) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await req.json();
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and Year parameters required' }, { status: 400 });
    }

    const mInt = parseInt(month, 10);
    const yInt = parseInt(year, 10);
    const lastDayOfMonth = new Date(yInt, mInt, 0); // Last day of the requested month

    // 1. Check Period Lock
    const locked = await isPeriodLocked(lastDayOfMonth);
    if (locked) {
      return NextResponse.json({ 
        error: `Periode ${mInt}/${yInt} sudah dikunci. Tidak dapat mengeksekusi penyusutan aset (depreciation) untuk periode ini.` 
      }, { status: 403 });
    }

    // 2. Prevent Double Run
    const existingRun = await prisma.depreciationRun.findUnique({
      where: {
        month_year_tenantId: {
          month: mInt,
          year: yInt,
          tenantId: tenant.id
        }
      }
    });

    if (existingRun) {
      return NextResponse.json({ error: `Penyusutan untuk bulan ${mInt}/${yInt} sudah pernah dieksekusi.` }, { status: 400 });
    }

    // 3. Get Active Assets
    const activeAssets = await prisma.fixedAsset.findMany({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE',
        purchaseDate: { lte: lastDayOfMonth } // Has been purchased on or before this month
      }
    });

    if (activeAssets.length === 0) {
      return NextResponse.json({ message: 'Tidak ada aset aktif yang membutuhkan penyusutan.' }, { status: 200 });
    }

    // 4. Calculate Depreciation (Straight-Line)
    let totalDepreciation = 0;
    const historyRecords = [];
    const dbUpdates = [];

    for (const asset of activeAssets) {
      // Prevent depreciating beyond Cost - Residual
      const destructibleValue = asset.cost - asset.residualValue;
      if (asset.accumulatedDepr >= destructibleValue) continue;

      let monthlyDepr = destructibleValue / asset.usefulLife;
      
      // Handle the last month edge case
      if (asset.accumulatedDepr + monthlyDepr > destructibleValue) {
        monthlyDepr = destructibleValue - asset.accumulatedDepr;
      }

      totalDepreciation += monthlyDepr;

      historyRecords.push({
        assetId: asset.id,
        amount: monthlyDepr,
        month: mInt,
        year: yInt,
        tenantId: tenant.id
      });

      // We queue the update to the asset's accumulated depreciation
      dbUpdates.push(
        prisma.fixedAsset.update({
          where: { id: asset.id },
          data: { accumulatedDepr: { increment: monthlyDepr } }
        })
      );
    }

    if (totalDepreciation === 0) {
      return NextResponse.json({ message: 'Semua aset sudah susut maksimal (fully depreciated).' }, { status: 200 });
    }

    // 5. Setup Accounting Accounts
    const accDeprExpense = await findAccountByCode(tenant.id, '6002');
    const accAccumDepr = await findAccountByCode(tenant.id, '1501');

    if (!accDeprExpense || !accAccumDepr) {
      return NextResponse.json({ error: 'Pengaturan akun penyusutan (Beban 6002, Akumulasi 1501) tidak ditemukan.' }, { status: 500 });
    }

    // 6. Execute Transaction
    await prisma.$transaction([
      ...dbUpdates,
      
      // Create Run Record
      prisma.depreciationRun.create({
        data: {
          month: mInt,
          year: yInt,
          tenantId: tenant.id,
          histories: {
            create: historyRecords
          }
        }
      }),

      // Create Ledger Entry
      prisma.journalEntry.create({
        data: {
          date: lastDayOfMonth,
          description: `Automatic Depreciation Run for ${mInt}/${yInt}`,
          reference: `DEPR-${yInt}${String(mInt).padStart(2, '0')}`,
          tenantId: tenant.id,
          lines: {
            create: [
              { accountId: accDeprExpense.id, debit: totalDepreciation, credit: 0 },
              { accountId: accAccumDepr.id, debit: 0, credit: totalDepreciation }
            ]
          }
        }
      })
    ]);

    return NextResponse.json({ success: true, totalDepreciation, assetsProcessed: historyRecords.length }, { status: 201 });

  } catch (error: any) {
    console.error('Depreciation Run Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
