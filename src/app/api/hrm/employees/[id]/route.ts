import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const params = await context.params;
    const employeeId = params.id;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, tenantId: tenant.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    // Soft Delete (Resign)
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: 'RESIGNED' }
    });

    return NextResponse.json({ success: true, message: 'Karyawan berhasil di-nonaktifkan (RESIGN).' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
