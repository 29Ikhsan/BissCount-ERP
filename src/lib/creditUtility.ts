import { prisma } from './prisma';

/**
 * Calculates the total outstanding balance for a specific contact.
 * Outstanding Balance = Sum(grandTotal - paidAmount) for all non-paid invoices.
 */
export async function getContactOutstandingBalance(contactId: string): Promise<number> {
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      contactId,
      status: { not: 'PAID' }
    },
    select: {
      grandTotal: true,
      paidAmount: true
    }
  });

  return unpaidInvoices.reduce((sum, inv) => {
    return sum + (inv.grandTotal - inv.paidAmount);
  }, 0);
}

/**
 * Checks if a new transaction amount would cause the contact to exceed their credit limit.
 * Returns { allowed: boolean, currentExposure: number, limit: number }
 */
export async function validateCreditLimit(contactId: string, additionalAmount: number): Promise<{
  allowed: boolean;
  currentExposure: number;
  limit: number;
  available: number;
}> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { creditLimit: true }
  });

  if (!contact) {
    return { allowed: true, currentExposure: 0, limit: 0, available: 0 };
  }

  const currentExposure = await getContactOutstandingBalance(contactId);
  const limit = contact.creditLimit || 0;
  const available = limit - currentExposure;

  // We allow the transaction if:
  // 1. The limit is managed (limit > 0)
  // 2. The new total doesn't exceed the limit
  // Note: if limit is 0, by default in this institutional ERP, 
  // we assume it means "No Credit Allowed" (Cash Only).
  
  if (limit === 0) {
    return { 
      allowed: false, 
      currentExposure, 
      limit, 
      available,
      message: "Client has no credit limit established (Cash Only)." 
    } as any;
  }

  const allowed = (currentExposure + additionalAmount) <= limit;

  return {
    allowed,
    currentExposure,
    limit,
    available
  };
}
