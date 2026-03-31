import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, merchant, category, amount, employeeName, notes } = body

    if (!merchant || !amount || !date || !category) {
      return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 })
    }

    // Workaround: Get default Tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      return NextResponse.json({ error: 'System Error: No Master Tenant Found' }, { status: 500 })
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        merchant,
        category,
        amount: parseFloat(amount) || 0,
        status: 'PENDING',
        employeeName: employeeName || 'System Demo',
        receiptUrl: notes, // Temp override to save notes for demo display
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, expense }, { status: 201 })
  } catch (error) {
    console.error('[Create Expense Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const expenses = await prisma.expense.findMany({
      where: { tenantId: tenant.id },
      orderBy: { date: 'desc' },
      take: 50
    })

    return NextResponse.json({ expenses }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}
