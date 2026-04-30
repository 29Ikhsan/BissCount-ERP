import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Role, hasAdminAccess } from '@/lib/access';
import bcrypt from 'bcryptjs';

import { checkAdminAccess } from '@/lib/access-server';

export async function GET() {
  try {
    const { authorized } = await checkAdminAccess();
    if (!authorized) {
      return NextResponse.json({ error: 'Access Denied: Admin authorization required.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('[Users API GET Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { authorized, session } = await checkAdminAccess();
    if (!authorized) {
      return NextResponse.json({ error: 'Access Denied: Admin authorization required.' }, { status: 403 });
    }

    // STABILIZATION: Verify Tenant ID from session exists in DB
    const sessionTenantId = (session?.user as any)?.tenantId;
    const dbTenant = await prisma.tenant.findFirst({
      where: sessionTenantId ? { id: sessionTenantId } : {},
      select: { id: true }
    });
    
    // Final active workspace fallback
    const finalTenantId = dbTenant?.id;
    if (!finalTenantId) {
      return NextResponse.json({ error: 'No active institutional workspace found.' }, { status: 500 });
    }

    const { userId, newRole, permissions } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const updateData: any = {};
    if (newRole) updateData.role = newRole;
    if (permissions) updateData.permissions = permissions;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, role: true, permissions: true }
    });

    // Verify current user exists for audit log FK
    const currentUserId = (session?.user as any)?.id;
    const adminExists = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true } }) : null;

    // Log the change for audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_USER_PERMISSIONS',
        entity: 'USER',
        entityId: userId,
        details: updateData,
        tenantId: finalTenantId || 'SYSTEM_FALLBACK_FAILURE',
        userId: adminExists ? currentUserId : null
      }
    });

    return NextResponse.json({ message: 'Role updated successfully', user: updatedUser });
  } catch (error: any) {
    console.error('[Users API PATCH Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, session } = await checkAdminAccess();
    if (!authorized) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    const { name, email, role, permissions } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash('Bizzcount123!', 10);
    
    // STABILIZATION: Verify Tenant ID from session exists in DB
    const sessionTenantId = (session?.user as any)?.tenantId;
    const dbTenantForPost = await prisma.tenant.findFirst({
      where: sessionTenantId ? { id: sessionTenantId } : {},
      select: { id: true }
    });
    
    // Final active workspace fallback
    const postTenantId = dbTenantForPost?.id;
    if (!postTenantId) {
       return NextResponse.json({ error: 'No active institutional workspace found in system.' }, { status: 500 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        permissions: permissions || ["Dashboard"],
        password: hashedPassword,
        tenantId: postTenantId,
      }
    });

    // Verify current user exists for audit log FK
    const currentUserId = (session?.user as any)?.id;
    const adminExists = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true } }) : null;

    await prisma.auditLog.create({
      data: {
        action: 'PROVISION_USER',
        entity: 'USER',
        entityId: newUser.id,
        details: { name, email, role, permissions: newUser.permissions },
        tenantId: postTenantId,
        userId: adminExists ? currentUserId : null
      }
    });

    return NextResponse.json({ 
      message: 'User provisioned successfully', 
      user: { 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role,
        permissions: newUser.permissions
      } 
    });
  } catch (error: any) {
    console.error('[Users API POST Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message }, { status: 500 });
  }
}
