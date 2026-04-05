import { prisma } from './prisma';

/**
 * Ensures that the given date is NOT within a closed accounting period.
 * Throws an error if the period is closed.
 */
export async function ensurePeriodOpen(date: Date, tenantId: string) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const d = new Date(date);
  const monthName = monthNames[d.getMonth()];
  const year = d.getFullYear();

  const closed = await prisma.closedPeriod.findFirst({
    where: {
      tenantId,
      month: monthName,
      year: year
    }
  });

  if (closed) {
    throw new Error(`Accounting period ${monthName} ${year} is CLOSED. No transactions can be recorded or modified.`);
  }
}
