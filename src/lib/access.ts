export type Role = 'SUPERADMIN' | 'ADMIN' | 'OPERATIONAL' | 'USER';

export interface RouteAccess {
  roles: Role[];
  label: string;
}

export const MODULE_PERMISSIONS: Record<string, Role[]> = {
  Dashboard: ['SUPERADMIN', 'ADMIN', 'OPERATIONAL', 'USER'],
  Operations: ['SUPERADMIN', 'ADMIN', 'OPERATIONAL'],
  CRM: ['SUPERADMIN', 'ADMIN'],
  Finance: ['SUPERADMIN', 'ADMIN'],
  HRM: ['SUPERADMIN', 'ADMIN'],
  TaxCompliance: ['SUPERADMIN', 'ADMIN'],
  AccountingReports: ['SUPERADMIN', 'ADMIN'],
  Settings: ['SUPERADMIN', 'ADMIN'],
};

export const canAccessModule = (role: Role, moduleKey: string, permissions?: string[]): boolean => {
  if (role === 'SUPERADMIN') return true; // Universal bypass
  
  // Check if granular permissions exist and include this module
  if (permissions && permissions.includes(moduleKey)) return true;
  
  const allowedRoles = MODULE_PERMISSIONS[moduleKey];
  if (!allowedRoles) return true;
  return allowedRoles.includes(role);
};

export const hasAdminAccess = (role: Role): boolean => {
  return role === 'SUPERADMIN' || role === 'ADMIN';
};
