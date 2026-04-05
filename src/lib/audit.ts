import { prisma } from './prisma';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'DEPRECIATE';
export type AuditEntity = 'Invoice' | 'Purchase' | 'Expense' | 'FixedAsset' | 'Product' | 'Contact';

/**
 * Records an activity to the AuditLog table.
 * @param action - The type of action performed.
 * @param entity - The model name being affected.
 * @param entityId - The unique ID of the record.
 * @param tenantId - The tenant performing the action.
 * @param userId - Optional ID of the user who performed the action.
 * @param details - Optional snapshot or description of changes.
 */
export async function recordAudit(
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  tenantId: string,
  userId?: string,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        tenantId,
        userId,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      },
    });
  } catch (error) {
    console.error(`Failed to record audit log for ${entity} ${entityId}:`, error);
    // We don't throw here to avoid blocking the main transaction if logging fails
  }
}
