import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-options';
import { Role, hasAdminAccess } from '@/lib/access';

export async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role as Role;

  if (!session || !hasAdminAccess(userRole)) {
    return { authorized: false, session };
  }
  return { authorized: true, session };
}

export interface AuthedSessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: Role;
  tenantId: string;
  permissions: string[];
}

export type RequireSessionResult =
  | { ok: true; user: AuthedSessionUser }
  | { ok: false; response: NextResponse };

/**
 * Resolve the current session for an API route. Returns a ready-to-return
 * 401 NextResponse when the caller is unauthenticated so handlers can do:
 *
 *   const auth = await requireSession();
 *   if (!auth.ok) return auth.response;
 *   const { user } = auth;
 */
export async function requireSession(): Promise<RequireSessionResult> {
  const session = await getServerSession(authOptions);
  const user = session?.user as AuthedSessionUser | undefined;
  if (!session || !user?.id || !user?.tenantId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

/** Same as requireSession() but additionally enforces ADMIN/SUPERADMIN. */
export async function requireAdminSession(): Promise<RequireSessionResult> {
  const auth = await requireSession();
  if (!auth.ok) return auth;
  if (!hasAdminAccess(auth.user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return auth;
}
