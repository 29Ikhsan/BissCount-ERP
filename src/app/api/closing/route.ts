import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const history = await prisma.closedPeriod.findMany({
      where: { tenantId: tenant.id },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    return NextResponse.json({ history }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch closing history' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { month, year } = body

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const closedPeriod = await prisma.closedPeriod.create({
      data: {
        month,
        year: parseInt(year),
        closedBy: 'System Admin',
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, closedPeriod }, { status: 201 })
  } catch (error) {
    console.error('Period Closing Error:', error)
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'This period is already closed.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to close period' }, { status: 500 })
  }
}
