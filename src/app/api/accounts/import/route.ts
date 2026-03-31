import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accounts } = body;

    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json({ error: 'Invalid payload format. Expected { accounts: [...] }' }, { status: 400 });
    }

    // Workaround: Get default Tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'System Error: No Master Tenant Found' }, { status: 500 });
    }

    // Map rows into Prisma Schema array
    const dataToInsert = accounts.map((row: any) => ({
      code: String(row.Code || row.code).trim(),
      name: String(row.Name || row.name).trim(),
      type: String(row.Type || row.type).toUpperCase().trim(),
      balance: parseFloat(row.Balance || row.balance) || 0,
      tenantId: tenant.id
    })).filter(acc => acc.code && acc.name && acc.type); // Filter out invalid/empty rows

    if (dataToInsert.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in CSV data.' }, { status: 400 });
    }

    let successCount = 0;
    for (const data of dataToInsert) {
      try {
        await prisma.account.upsert({
          where: {
            code_tenantId: {
              code: data.code,
              tenantId: tenant.id
            }
          },
          update: {
            name: data.name,
            type: data.type,
            balance: data.balance
          },
          create: data
        });
        successCount++;
      } catch (e) {
        console.error('Row import failed:', e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${successCount} accounts from the CSV file.`
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Bulk Import Error]:', error);
    return NextResponse.json({ error: error.message || 'Server Failed to process import' }, { status: 500 });
  }
}
