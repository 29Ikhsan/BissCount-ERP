import { prisma } from './prisma';

export async function recordAudit(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CONFIG' | 'APPROVE' | 'REJECT' | 'POST',
  entity: string,
  entityId: string,
  tenantId: string,
  userId?: string,
  details?: any
) {
  try {
    return await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        tenantId,
        userId,
        details: details || {}
      }
    });
  } catch (error) {
    console.error('[Audit Log Error]:', error);
    // Non-blocking error, we don't want to crash the main app if audit fails
    return null;
  }
}

/**
 * Utility to track JSON diff (optional, for advanced forensic use)
 */
export function calculateDiff(oldObj: any, newObj: any) {
  const diff: any = {};
  for (const key in newObj) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      diff[key] = {
        before: oldObj[key],
        after: newObj[key]
      };
    }
  }
  return diff;
}
