import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensurePeriodOpen } from '@/lib/periodGuard'
import { postToLedger, findAccountByCode } from '@/lib/ledgerUtility'
import { calculateCOGS } from '@/lib/inventoryValuation'
import { recordAudit } from '@/lib/audit'
import { validateCreditLimit } from '@/lib/creditUtility'
import { sendEmail, generateInvoiceTemplate } from '@/lib/mail'
import { requireSession } from '@/lib/access-server';

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const body = await req.json()
    const { 
      clientName, contactId, costCenterId, date, dueDate, items, 
      discountAmount = 0, fakturType = "Normal", transactionCode = "01",
      additionalInfo, supportDoc, supportDocPeriod, facilityCap, sellerTkuId,
      whtAmount = 0, whtRate = 0, autoEmail = false
    } = body

    if (!clientName || !date || !dueDate || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    // 1. Check Period Lock
    await ensurePeriodOpen(new Date(date), tenant.id)

    const count = await prisma.invoice.count({ where: { tenantId: tenant.id } })
    const invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`

    // --- FINANCIAL CONTROL: PRE-FLIGHT INVENTORY VALIDATION ---
    // Prevent "Phantom Sales / Negative Inventory" Which Could Destroy COGS Valuation
    for (const item of items) {
      if (item.productId) {
         const reqQty = Number(item.quantity) || 0;
         const level = await prisma.inventoryLevel.findFirst({
           where: { productId: item.productId }
         });
         
         const availableQty = level ? level.quantity : 0;
         if (reqQty > availableQty) {
           return NextResponse.json({ 
             error: `Overselling Prevented: Sisa stok tidak mencukupi. Anda mencoba menjual ${reqQty} unit, tapi stok tersisa hanya ${availableQty} unit.` 
           }, { status: 400 });
         }
      }
    }

    const newInvoice = await prisma.$transaction(async (tx) => {
      let subtotal = 0
      let totalTax = 0

      const invoiceItems = items.map((item: any) => {
        const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        
        // 12% PPN Compliance Core Logic
        const explicitTaxRate = item.taxRate !== undefined ? Number(item.taxRate) : 12;
        const itemTax = itemSubtotal * (explicitTaxRate / 100)
        
        subtotal += itemSubtotal
        totalTax += itemTax

        return {
          sku: item.sku || "000000",
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          taxId: item.taxId || null,
          taxRate: explicitTaxRate,
          taxAmount: itemTax,
          total: itemSubtotal,
          productId: item.productId || null,
          itemType: item.itemType || "A",
          uomCode: item.uomCode || "UM.0002",
          baseValueOther: Number(item.baseValueOther) || 0,
          ppnRate: Number(item.ppnRate) || 12,
          ppnbmRate: Number(item.ppnbmRate) || 0,
          ppnbmAmount: Number(item.ppnbmAmount) || 0
        }
      })

      const grandTotal = subtotal + totalTax - (Number(discountAmount) || 0)

      // --- FINANCIAL CONTROL: CUSTOMER CREDIT GUARD ---
      if (contactId) {
        const credit = await validateCreditLimit(contactId, grandTotal);
        if (!credit.allowed) {
          throw new Error(`Credit Limit Exceeded: Hutang klien saat ini Rp ${credit.currentExposure.toLocaleString()} dan limit Rp ${credit.limit.toLocaleString()}. Sisa limit Rp ${credit.available.toLocaleString()} tidak mencukupi untuk invoice sebesar Rp ${grandTotal.toLocaleString()}.`);
        }
      }

      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          clientName,
          date: new Date(date),
          dueDate: new Date(dueDate),
          amount: subtotal,
          taxAmount: totalTax,
          discountAmount: Number(discountAmount) || 0,
          grandTotal: grandTotal,
          status: 'PENDING',
          tenantId: tenant.id,
          contactId: contactId || null,
          costCenterId: costCenterId || null,
          taxPeriod: new Date(date).getMonth() + 1,
          taxYear: new Date(date).getFullYear(),
          fakturStatus: 'NORMAL',
          fakturType,
          transactionCode,
          additionalInfo,
          supportDoc,
          supportDocPeriod,
          facilityCap,
          sellerTkuId: sellerTkuId || "0000000000000000000000",
          whtAmount: Number(whtAmount) || 0,
          whtRate: Number(whtRate) || 0,
          autoEmail,
          items: { create: invoiceItems }
        },
        include: { items: true, contact: true }
      })

      // 2. Automated Ledger Posting
      const accAR = await findAccountByCode(tenant.id, '1002')
      const accSales = await findAccountByCode(tenant.id, '4001')
      const accTax = await findAccountByCode(tenant.id, '2002')
      const accCOGS = await findAccountByCode(tenant.id, '5001')
      const accInv = await findAccountByCode(tenant.id, '1004')

      // 2a. Calculate COGS using the new Valuation Logic (FIFO/Average)
      let totalCOGS = 0;
      for (const item of items) {
        if (item.productId) {
          totalCOGS += await calculateCOGS(tx, {
            productId: item.productId,
            quantity: Number(item.quantity) || 0,
            tenantId: tenant.id
          });
        }
      }

      if (accAR && accSales) {
        const journalLines = [
          { accountId: accAR.id, debit: grandTotal, credit: 0 },
          { accountId: accSales.id, debit: 0, credit: subtotal },
          ...(totalTax > 0 && accTax ? [{ accountId: accTax.id, debit: 0, credit: totalTax }] : []),
          // COGS Integration
          ...(totalCOGS > 0 && accCOGS && accInv ? [
            { accountId: accCOGS.id, debit: totalCOGS, credit: 0 },
            { accountId: accInv.id, debit: 0, credit: totalCOGS }
          ] : [])
        ]

        await postToLedger(tx, {
          date: new Date(date),
          description: `Automatic Journal: Sales Invoice ${invoiceNo} (Valuation: ${(tenant as any).inventoryMethod}) for ${clientName}`,
          reference: invoiceNo,
          tenantId: tenant.id,
          lines: journalLines
        })
      }

      // Update Inventory Stock (Simple quantity reduction)
      for (const item of items) {
        if (item.productId) {
          const level = await tx.inventoryLevel.findFirst({
            where: { productId: item.productId }
          })
          if (level) {
            await tx.inventoryLevel.update({
              where: { id: level.id },
              data: { quantity: { decrement: Number(item.quantity) || 0 } }
            })
          }
        }
      }

      return invoice
    })

    // 3. Record Audit Log
    await recordAudit('CREATE', 'Invoice', newInvoice.id, tenant.id, undefined, { invoiceNo: newInvoice.invoiceNo, amount: newInvoice.grandTotal })

    // --- AUTOMATED EMAIL DISPATCH ---
    if (autoEmail && newInvoice.contact?.email) {
      const emailHtml = generateInvoiceTemplate(newInvoice, tenant);
      const mailResult = await sendEmail({
        to: newInvoice.contact.email,
        subject: `Invoice Baru dari ${tenant.name}: ${newInvoice.invoiceNo}`,
        html: emailHtml
      });

      if (mailResult.success) {
        await prisma.invoice.update({
          where: { id: newInvoice.id },
          data: { emailStatus: 'SENT' }
        });
      } else {
        await prisma.invoice.update({
          where: { id: newInvoice.id },
          data: { emailStatus: 'FAILED' }
        });
      }
    }

    return NextResponse.json({ success: true, invoice: newInvoice }, { status: 201 })
  } catch (error: any) {
    console.error('[Create Invoice Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const invoices = await prisma.invoice.findMany({
      where: { tenantId: tenant.id },
      include: { 
        items: { include: { product: true, tax: true } },
        contact: true,
        costCenter: true
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ invoices }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
