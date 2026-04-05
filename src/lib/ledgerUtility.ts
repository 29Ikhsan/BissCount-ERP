import { prisma } from './prisma';

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
  costCenterId?: string | null;
}

/**
 * High-level utility to post automated journal entries to the General Ledger.
 * Updates both JournalEntry records and Account running balances.
 */
export async function postToLedger(tx: any, {
  date,
  description,
  reference,
  lines,
  tenantId
}: {
  date: Date;
  description: string;
  reference?: string;
  lines: JournalLineInput[];
  tenantId: string;
}) {
  // 1. Create the Journal Entry
  const journalEntry = await tx.journalEntry.create({
    data: {
      date: new Date(date),
      description,
      reference: reference || null,
      tenantId
    }
  });

  // 2. Process Lines
  for (const line of lines) {
    if (line.debit === 0 && line.credit === 0) continue; // Skip zero lines

    await tx.journalLine.create({
      data: {
        journalEntryId: journalEntry.id,
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        costCenterId: line.costCenterId || null
      }
    });

    // 3. Update Account Balance
    const account = await tx.account.findUnique({ where: { id: line.accountId } });
    if (account) {
      let balanceDiff = 0;
      // Normal Balance Rules
      if (['ASSET', 'EXPENSE'].includes(account.type)) {
        balanceDiff = line.debit - line.credit;
      } else {
        balanceDiff = line.credit - line.debit;
      }

      await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: balanceDiff } }
      });
    }
  }

  return journalEntry;
}

/**
 * Finds an account by its unique code for a specific tenant.
 */
export async function findAccountByCode(tenantId: string, code: string, tx?: any) {
  const client = tx || prisma;
  return await client.account.findUnique({
    where: { code_tenantId: { code, tenantId } }
  });
}
