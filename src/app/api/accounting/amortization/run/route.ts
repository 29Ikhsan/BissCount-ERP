import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensurePeriodOpen } from '@/lib/periodGuard'
import { postToLedger } from '@/lib/ledgerUtility'
import { recordAudit } from '@/lib/audit'
import { requireSession } from '@/lib/access-server';

export async function POST(req: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return NextResponse.json({ error: 'No Tenant' }, { status: 500 })

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // 1. Period Protection
    await ensurePeriodOpen(now, tenant.id)

    // 2. Fetch all ACTIVE amortization schedules
    const schedules = await prisma.amortizationSchedule.findMany({
      where: { tenantId: tenant.id, status: 'ACTIVE' }
    })

    if (schedules.length === 0) {
      return NextResponse.json({ message: 'No active amortization schedules found.' }, { status: 200 })
    }

    let totalAmortized = 0

    await prisma.$transaction(async (tx) => {
      for (const schedule of schedules) {
        // Monthly Amortization
        const monthlyAmount = schedule.totalAmount / schedule.usefulLife
        const currentAmortizationAmount = Math.min(monthlyAmount, schedule.remainingAmount)
        const newRemaining = Math.max(0, schedule.remainingAmount - currentAmortizationAmount)

        if (currentAmortizationAmount > 0) {
          // a. Post to Ledger
          await postToLedger(tx, {
            date: now,
            description: `Automatic Journal: Amortization for ${schedule.name} - ${now.toLocaleString('default', { month: 'long' })} ${currentYear}`,
            reference: `AMORT-${schedule.id.slice(0,5)}`,
            tenantId: tenant.id,
            lines: [
              { accountId: schedule.expenseAccountId, debit: currentAmortizationAmount, credit: 0, costCenterId: schedule.costCenterId },
              { accountId: schedule.prepaidAccountId, debit: 0, credit: currentAmortizationAmount, costCenterId: schedule.costCenterId }
            ]
          })

          // b. Update Schedule
          await tx.amortizationSchedule.update({
            where: { id: schedule.id },
            data: {
              remainingAmount: newRemaining,
              status: newRemaining <= 0.01 ? 'COMPLETED' : 'ACTIVE'
            }
          })

          totalAmortized += currentAmortizationAmount
        }
      }

      // c. Formalize the run
      await tx.amortizationRun.create({
        data: {
          month: currentMonth,
          year: currentYear,
          tenantId: tenant.id
        }
      })
    })

    await recordAudit('POST', 'AmortizationRun', `RUN-${currentMonth}-${currentYear}`, tenant.id, undefined, { 
      month: currentMonth,
      year: currentYear,
      totalAmount: totalAmortized,
      scheduleCount: schedules.length
    })

    return NextResponse.json({ 
      success: true, 
      message: `Processed amortization for ${schedules.length} schedules.`,
      totalAmortized
    })
  } catch (error: any) {
    console.error('Amortization Run Error:', error)
    return NextResponse.json({ error: error.message || 'Amortization run failed' }, { status: 500 })
  }
}
