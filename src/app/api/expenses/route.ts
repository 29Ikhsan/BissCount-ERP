import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensurePeriodOpen } from '@/lib/periodGuard'
import { postToLedger, findAccountByCode } from '@/lib/ledgerUtility'
import { recordAudit } from '@/lib/audit'
import { requireSession } from '@/lib/access-server';

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { 
      date, merchant, items, employeeName, notes, costCenterId, 
      contactId, taxPeriod, taxYear, paymentMethod = 'CASH'
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

      // --- BUDGET GUARD (Corporate Budgets) ---
      if (costCenterId) {
        const costCenter = await tx.costCenter.findUnique({ where: { id: costCenterId } })
        if (costCenter && costCenter.budget > 0) {
          const expenseYear = new Date(date).getFullYear()
          
          // Calculate existing utilized budget for the year
          const existingExpenses = await tx.expense.aggregate({
            _sum: { grandTotal: true },
            where: {
              costCenterId: costCenter.id,
              status: { not: 'REJECTED' },
              date: {
                gte: new Date(`${expenseYear}-01-01`),
                lte: new Date(`${expenseYear}-12-31T23:59:59.999Z`)
              }
            }
          })
          
          const utilizedBudget = existingExpenses._sum.grandTotal || 0
          
          if (utilizedBudget + grandTotal > costCenter.budget) {
            throw new Error(`BUDGET_EXCEEDED: This expense of IDR ${grandTotal.toLocaleString()} will exceed the annual budget ceiling for Cost Center [${costCenter.code}]! Remaining Budget: IDR ${(costCenter.budget - utilizedBudget).toLocaleString()}`)
          }
        }
      }
      // ----------------------------------------

      const refCode = `EXP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

      const expense = await tx.expense.create({
        data: {
          date: new Date(date),
          merchant,
          category: items[0]?.categoryName || 'General Expense',
          amount: subtotal,
          taxAmount: totalTax,
          grandTotal: grandTotal,
          status: paymentMethod === 'BANK_TRANSFER' ? 'APPROVED' : 'PAID',
          paymentMethod,
          referenceCode: refCode,
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
      const isAccrual = paymentMethod === 'BANK_TRANSFER'
      const creditAccCode = isAccrual ? '2100' : '1001' // 2100 for AP, 1001 for Cash
      const accCredit = await findAccountByCode(tenant.id, creditAccCode, tx)
      const accTax = await findAccountByCode(tenant.id, '2002', tx)
      const accWHT = await findAccountByCode(tenant.id, '2003', tx) // PPh Payable

      if (accCredit) {
        const journalLines = [
          { accountId: accCredit.id, debit: 0, credit: grandTotal },
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
          description: isAccrual 
            ? `Expense Accrual: ${merchant} (Ref: ${refCode})`
            : `Automatic Journal: Expense for ${merchant} (incl. WHT Unifikasi)`,
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
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

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
