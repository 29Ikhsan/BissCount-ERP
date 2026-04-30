import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/access-server';

// POST: Create a new Cost Center
export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { code, name, budget } = body

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and Name are required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // @ts-ignore
    const newCC = await prisma.costCenter.create({
      data: {
        code,
        name,
        budget: parseFloat(budget) || 0,
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, costCenter: newCC }, { status: 201 })
  } catch (error) {
    console.error('[Create CostCenter Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET: Retrieve all Cost Centers with real-time aggregated P&L metrics
export async function GET() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // Fetch Cost Centers and their linked journal lines for real-time aggregation
    // @ts-ignore
    const costCentersRaw = await prisma.costCenter.findMany({
      where: { tenantId: tenant.id },
      include: {
        journalLines: {
          include: { account: true }
        }
      },
      orderBy: { code: 'asc' }
    })

    const costCenters = costCentersRaw.map((cc: any) => {
      let revenue = 0
      let expenses = 0

      cc.journalLines.forEach((line: any) => {
        const type = line.account.type
        if (type === 'REVENUE') {
          // Revenue: Increase with Credit, Decrease with Debit
          revenue += (line.credit - line.debit)
        } else if (type === 'EXPENSE' || type === 'COS') {
          // Expenses: Increase with Debit, Decrease with Credit
          expenses += (line.debit - line.credit)
        }
      })

      return {
        id: cc.id,
        code: cc.code,
        name: cc.name,
        budget: cc.budget,
        revenue,
        expenses,
        netProfit: revenue - expenses,
        manager: cc.manager || 'Finance Dept',
        marginTarget: cc.marginTarget || 20,
        closed: cc.closed || false
      }
    })

    return NextResponse.json({ costCenters }, { status: 200 })
  } catch (error) {
    console.error('[Get CostCenters Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch cost centers' }, { status: 500 })
  }
}
