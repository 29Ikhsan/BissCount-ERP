import { getServerSession } from 'next-auth';
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
