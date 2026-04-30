import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordAudit } from '@/lib/audit'

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const schedules = await prisma.amortizationSchedule.findMany({
      where: { tenantId: tenant.id },
      include: {
        prepaidAccount: true,
        expenseAccount: true,
        costCenter: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ schedules }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, totalAmount, startDate, endDate, usefulLife, prepaidAccountId, expenseAccountId, costCenterId } = body

    if (!name || !totalAmount || !usefulLife || !prepaidAccountId || !expenseAccountId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const schedule = await prisma.amortizationSchedule.create({
      data: {
        name,
        totalAmount: parseFloat(totalAmount),
        remainingAmount: parseFloat(totalAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usefulLife: parseInt(usefulLife),
        prepaidAccountId,
        expenseAccountId,
        costCenterId: costCenterId || null,
        tenantId: tenant.id
      }
    })

    await recordAudit('CREATE', 'AmortizationSchedule', schedule.id, tenant.id, undefined, { name, totalAmount })

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error('Amortization Creation Error:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
