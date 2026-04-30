import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function run() {
  try {
    const email = `test_provision_${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('Bizzcount123!', 10);
    
    console.log('--- DB DIAGNOSTIC ---');
    const tenants = await prisma.tenant.findMany();
    console.log(`Available Tenants: ${tenants.length}`);
    if (tenants.length === 0) throw new Error('No tenants in database');
    const targetTenantId = tenants[0].id;

    console.log('--- SIMULATING USER CREATE ---');
    const newUser = await prisma.user.create({
      data: {
        name: 'Debug User',
        email: email,
        role: 'USER',
        permissions: ['Dashboard'],
        password: hashedPassword,
        tenantId: targetTenantId
      }
    });
    console.log(`User created successfully: ${newUser.id}`);

    console.log('--- SIMULATING AUDIT LOG CREATE ---');
    // We omit userId to verify if it can be null/undefined as per schema
    await prisma.auditLog.create({
      data: {
        action: 'PROVISION_USER',
        entity: 'USER',
        entityId: newUser.id,
        details: { name: 'Debug User', email: email, role: 'USER' },
        tenantId: targetTenantId,
      }
    });
    console.log('AuditLog created successfully.');

    // Final clean up
    await prisma.user.delete({ where: { id: newUser.id } });
    console.log('Cleanup successful.');
  } catch (e) {
    console.error('SERVER ERROR REPRODUCED LOGICALLY:');
    console.error(e);
    process.exit(1);
  }
}

run();
