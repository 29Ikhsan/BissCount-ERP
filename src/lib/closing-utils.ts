import { prisma } from './prisma';

/**
 * Checks if a specific date falls within a closed financial period.
 * @param date The date to check
 * @returns boolean True if the period is locked, False otherwise.
 */
export async function isPeriodLocked(date: Date): Promise<boolean> {
  try {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return false;

    const closedPeriod = await prisma.closedPeriod.findUnique({
      where: {
        month_year_tenantId: {
          month,
          year,
          tenantId: tenant.id
        }
      }
    });

    return !!closedPeriod;
  } catch (error) {
    console.error('Period locking check failed:', error);
    // Be conservative: if check fails, don't lock, but log the error.
    return false;
  }
}
