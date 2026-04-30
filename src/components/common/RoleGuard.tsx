'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Role, canAccessModule } from '@/lib/access';

interface RoleGuardProps {
  children: ReactNode;
  moduleKey: string;
}

export default function RoleGuard({ children, moduleKey }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    const userRole = (session?.user as any)?.role as Role || 'USER';
    const userPermissions = (session?.user as any)?.permissions || [];
    
    if (!canAccessModule(userRole, moduleKey, userPermissions)) {
      router.push('/unauthorized'); // Initial planned redirect
    }
  }, [session, status, router, moduleKey]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p>Verifying Institutional Credentials...</p>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role as Role || 'USER';
  const userPermissions = (session?.user as any)?.permissions || [];
  
  if (!canAccessModule(userRole, moduleKey, userPermissions)) {
    return null; // Don't render until authorized or redirected
  }

  return <>{children}</>;
}
