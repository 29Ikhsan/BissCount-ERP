import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensurePeriodOpen } from '@/lib/periodGuard'
import { postToLedger, findAccountByCode } from '@/lib/ledgerUtility'
import { recordStockIn } from '@/lib/inventoryValuation'
import { recordAudit } from '@/lib/audit'
import { requireSession } from '@/lib/access-server';

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { supplier, contactId, costCenterId, date, expectedDate, items, discountAmount = 0, type = 'PURCHASE_ORDER' } = body

    if (!supplier || !date || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required PO configuration fields.' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // 1. Check Period Lock
    await ensurePeriodOpen(new Date(date), tenant.id)

    const count = await prisma.purchaseOrder.count({ where: { tenantId: tenant.id } })
    const poNumber = `PO-${new Date().toISOString().slice(0, 4)}-${String(count + 1).padStart(3, '0')}`

    const newPO = await prisma.$transaction(async (tx) => {
      let subtotal = 0
      let totalTax = 0

      const poItems = items.map((item: any) => {
        const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        const itemTax = itemSubtotal * ((Number(item.taxRate) || 0) / 100)
        
        subtotal += itemSubtotal
        totalTax += itemTax

        return {
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          taxId: item.taxId || null,
          taxRate: Number(item.taxRate) || 0,
          taxAmount: itemTax,
          total: itemSubtotal,
          productId: item.productId || null
        }
      })

      const grandTotal = subtotal + totalTax - (Number(discountAmount) || 0)

      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplier,
          date: new Date(date),
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          amount: subtotal,
          taxAmount: totalTax,
          discountAmount: Number(discountAmount) || 0,
          grandTotal: grandTotal,
          status: 'PENDING',
          type,
          tenantId: tenant.id,
          contactId: contactId || null,
          costCenterId: costCenterId || null,
          items: { create: poItems }
        },
        include: { items: true }
      })

      // 2. Automated Ledger Posting & Stock-In (Only for Goods Receipt/Bill)
      if (type === 'GOODS_RECEIPT' || type === 'VENDOR_BILL') {
        const accAP = await findAccountByCode(tenant.id, '2001', tx)
        const accInv = await findAccountByCode(tenant.id, '1004', tx)
        const accTax = await findAccountByCode(tenant.id, '2002', tx)

        if (accAP && accInv) {
          // --- FINANCIAL CONTROL: PURCHASE DISCOUNT ACCOUNTING SEAL ---
          // Ensure the discount is prorated across the inventory value so that AP matches the actual grandTotal
          const discount = Number(discountAmount) || 0;
          const discountedSubtotal = Math.max(0, subtotal - discount);

          const taxDebit = (totalTax > 0 && accTax) ? totalTax : 0
          const apCredit = discountedSubtotal + taxDebit // AP exactly mirrors what we actually owe (grandTotal)

          await postToLedger(tx, {
            date: new Date(date),
            description: `Automatic Journal: ${type} ${poNumber} from ${supplier}`,
            reference: poNumber,
            tenantId: tenant.id,
            lines: [
              { accountId: accInv.id, debit: discountedSubtotal, credit: 0 },
              { accountId: accAP.id, debit: 0, credit: apCredit },
              ...(taxDebit > 0 && accTax ? [{ accountId: accTax.id, debit: taxDebit, credit: 0 }] : [])
            ]
          })
        }

        // 3. Update Inventory Stock (Receipt) & Valuation
        const warehouse = await tx.warehouse.findFirst({ where: { tenantId: tenant.id } });
        if (warehouse) {
          const discount = Number(discountAmount) || 0;
          const discountFactor = subtotal > 0 ? Math.max(0, (subtotal - discount)) / subtotal : 1;

          for (const item of items) {
            if (item.productId) {
              const discountedUnitCost = (Number(item.unitPrice) || 0) * discountFactor;

              await recordStockIn(tx, {
                productId: item.productId,
                warehouseId: warehouse.id,
                quantity: Number(item.quantity) || 0,
                unitCost: discountedUnitCost,
                tenantId: tenant.id
              });
            }
          }
        }
      }

      return purchaseOrder
    })

    // 4. Record Audit Log
    await recordAudit('CREATE', 'Purchase', newPO.id, tenant.id, undefined, { poNumber: newPO.poNumber, amount: newPO.grandTotal, supplier: newPO.supplier })

    return NextResponse.json({ success: true, purchaseOrder: newPO }, { status: 201 })
  } catch (error: any) {
    console.error('[Create PO Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { tenantId: tenant.id },
      include: { 
        items: { include: { product: true, tax: true } },
        contact: true,
        costCenter: true
      },
      orderBy: { date: 'desc' },
      take: 100
    })

    return NextResponse.json({ purchaseOrders }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}
