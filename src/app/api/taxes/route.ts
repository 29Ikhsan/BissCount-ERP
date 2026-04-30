import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/access-server';

export async function GET() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const taxes = await prisma.tax.findMany({
      where: { tenantId: tenant.id },
      include: { account: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ taxes }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch taxes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { name, description, rate, type, accountId } = body

    if (!name || rate === undefined) {
      return NextResponse.json({ error: 'Name and Rate are required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const tax = await prisma.tax.create({
      data: {
        name,
        description,
        rate: parseFloat(rate) || 0,
        type,
        accountId: accountId || null,
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, tax }, { status: 201 })
  } catch (error) {
    console.error('[Tax Create Error]:', error)
    return NextResponse.json({ error: 'Failed to create tax configuration' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { id, name, description, rate, type, accountId } = body

    if (!id) return NextResponse.json({ error: 'Tax ID is required' }, { status: 400 })

    const tax = await prisma.tax.update({
      where: { id },
      data: {
        name,
        description,
        rate: parseFloat(rate) || 0,
        type,
        accountId: accountId || null
      }
    })

    return NextResponse.json({ success: true, tax }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tax' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Tax ID is required' }, { status: 400 })

    await prisma.tax.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Tax configuration removed' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tax configuration' }, { status: 500 })
  }
}
