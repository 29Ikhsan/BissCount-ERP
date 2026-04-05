import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/client';
const prisma = new PrismaClient();
import { ensurePeriodOpen } from '@/lib/periodGuard'
import { postToLedger, findAccountByCode } from '@/lib/ledgerUtility'
import { recordAudit } from '@/lib/audit'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      date, merchant, items, employeeName, notes, costCenterId, 
      contactId, taxPeriod, taxYear 
    } = body

    if (!merchant || !date || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // 1. Check Period Lock
    await ensurePeriodOpen(new Date(date), tenant.id)

    const newExpense = await prisma.$transaction(async (tx) => {
      let subtotal = 0
      let totalTax = 0
      let totalWHT = 0

      const expenseItems = items.map((item: any) => {
        const itemSubtotal = (Number(item.quantity) || 1) * (Number(item.amount) || 0)
        const itemTax = itemSubtotal * ((Number(item.taxRate) || 0) / 100)
        const itemWHT = itemSubtotal * ((Number(item.whtRate) || 0) / 100)
        
        subtotal += itemSubtotal
        totalTax += itemTax
        totalWHT += itemWHT

        return {
          description: item.description || 'Expense Line',
          quantity: Number(item.quantity) || 1,
          amount: Number(item.amount) || 0,
          accountId: item.accountId || null,
          taxId: item.taxId || null,
          taxRate: Number(item.taxRate) || 0,
          taxAmount: itemTax,
          whtRate: Number(item.whtRate) || 0,
          whtAmount: itemWHT,
          total: itemSubtotal + itemTax - itemWHT,
          taxObjectCode: item.taxObjectCode || null,
          tkuId: item.tkuId || "0000000000000000000000",
          workerStatus: item.workerStatus || "Resident",
          position: item.position || null,
          ptkpStatus: item.ptkpStatus || "TK/0",
          passportNo: item.passportNo || null,
          facilityCap: item.facilityCap || "N/A"
        }
      })

      const grandTotal = subtotal + totalTax - totalWHT

      const expense = await tx.expense.create({
        data: {
          date: new Date(date),
          merchant,
          category: items[0]?.categoryName || 'General Expense',
          amount: subtotal,
          taxAmount: totalTax,
          grandTotal: grandTotal,
          status: 'PAID',
          employeeName: employeeName || 'System User',
          receiptUrl: notes || '',
          tenantId: tenant.id,
          costCenterId: costCenterId || null,
          contactId: contactId || null,
          taxPeriod: taxPeriod || new Date(date).getMonth() + 1,
          taxYear: taxYear || new Date(date).getFullYear(),
          items: { create: expenseItems }
        },
        include: { items: true, contact: true }
      })

      // 2. Automated Ledger Posting
      const accCash = await findAccountByCode(tenant.id, '1001', tx)
      const accTax = await findAccountByCode(tenant.id, '2002', tx)
      const accWHT = await findAccountByCode(tenant.id, '2003', tx) // PPh Payable

      if (accCash) {
        const journalLines = [
          { accountId: accCash.id, debit: 0, credit: grandTotal },
          ...(totalTax > 0 && accTax ? [{ accountId: accTax.id, debit: totalTax, credit: 0 }] : []),
          ...(totalWHT > 0 && accWHT ? [{ accountId: accWHT.id, debit: 0, credit: totalWHT }] : [])
        ]

        for (const item of items) {
          const itemTotal = (Number(item.quantity) || 1) * (Number(item.amount) || 0)
          if (itemTotal > 0) {
            const accId = item.accountId || (await findAccountByCode(tenant.id, '6001', tx))?.id
            if (accId) {
              journalLines.push({ accountId: accId, debit: itemTotal, credit: 0, costCenterId: costCenterId || null } as any)
            }
          }
        }

        await postToLedger(tx, {
          date: new Date(date),
          description: `Automatic Journal: Expense for ${merchant} (incl. WHT Unifikasi)`,
          reference: `EXP-${expense.id}`,
          tenantId: tenant.id,
          lines: journalLines
        })
      }

      return expense
    })

    // 3. Record Audit Log
    await recordAudit('CREATE', 'Expense', newExpense.id, tenant.id, undefined, { merchant: newExpense.merchant, amount: newExpense.grandTotal })

    return NextResponse.json({ success: true, expense: newExpense }, { status: 201 })
  } catch (error: any) {
    console.error('[Create Expense Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const expenses = await prisma.expense.findMany({
      where: { tenantId: tenant.id },
      include: { 
        items: { include: { account: true, tax: true } },
        costCenter: true
      },
      orderBy: { date: 'desc' },
      take: 100
    })

    return NextResponse.json({ expenses }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}
