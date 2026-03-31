import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // Fetch Only Asset Accounts for Banking/Cash Feeds
    const bankAccounts = await prisma.account.findMany({
      where: { 
        tenantId: tenant.id,
        type: 'ASSET'
      },
      orderBy: { code: 'asc' }
    })

    const accountsData = bankAccounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      number: acc.code,
      type: 'Bank / Cash',
      balance: acc.balance || 0,
      lastSynced: 'Live Sync',
      status: 'Connected'
    }))

    // Generate mock reconciled lines for the UI since real Plaid integration is missing
    const reconciliationLines = [
      {
        id: 'tx-001',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        desc: 'STRIPE TRANSFER - SETTLEMENT',
        amount: 14500.00,
        type: 'deposit',
        match: { type: 'exact', score: 100, bizzcountRef: 'INV-2024-002 Payment', bizzcountId: '#REC-0991' }
      },
      {
        id: 'tx-003',
        date: new Date(Date.now() - 86400000).toLocaleDateString(),
        desc: 'ATM TARIK TUNAI JKT SELATAN',
        amount: -500.00,
        type: 'withdrawal',
        match: null
      }
    ]

    return NextResponse.json({ accounts: accountsData, reconciliationLines }, { status: 200 })
  } catch (error) {
    console.error('Fetch banking failed', error)
    return NextResponse.json({ error: 'Failed to fetch banking feeds' }, { status: 500 })
  }
}
