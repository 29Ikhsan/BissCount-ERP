import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const accounts = await prisma.account.findMany({
      where: { tenantId: tenant.id },
      orderBy: { code: 'asc' }
    })

    return NextResponse.json({ accounts }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, name, type, balance } = body

    if (!code || !name || !type) {
      return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const account = await prisma.account.create({
      data: {
        code,
        name,
        type,
        balance: parseFloat(balance) || 0,
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, account }, { status: 201 })
  } catch (error) {
    console.error('[Create Account Error]:', error)
    return NextResponse.json({ error: 'Failed to create account. Check code uniqueness.' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, name, type, balance } = body

    if (!id) return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })

    const account = await prisma.account.update({
      where: { id },
      data: {
        name,
        type,
        balance: parseFloat(balance) || 0
      }
    })

    return NextResponse.json({ success: true, account }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })

    // Check for linked transactions
    const linkedLines = await prisma.journalLine.count({
      where: { accountId: id }
    })

    if (linkedLines > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete account with existing transactions. Deactivate it instead.' 
      }, { status: 403 })
    }

    await prisma.account.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Account deleted successfully' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
