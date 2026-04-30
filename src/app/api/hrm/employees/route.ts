import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/access-server';

export async function GET(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const employees = await prisma.employee.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(employees);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await request.json();
    
    // Support Batch Array (Import)
    if (Array.isArray(body)) {
      const inserts = body.map((emp: any) => ({
        employeeId: emp.employeeId || `EMP-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        name: emp.name,
        email: emp.email || null,
        department: emp.department || 'General',
        jobTitle: emp.jobTitle || 'Staff',
        salary: Number(emp.salary) || 0,
        ptkpStatus: emp.ptkpStatus || 'TK/0',
        npwp: emp.npwp || null,
        nik: emp.nik || null,
        address: emp.address || null,
        bankName: emp.bankName || null,
        bankNumber: emp.bankNumber || null,
        bankHolder: emp.bankHolder || null,
        bpjsKes: emp.bpjsKes || null,
        bpjsKet: emp.bpjsKet || null,
        status: 'ACTIVE',
        tenantId: tenant.id
      }));

      const created = await prisma.employee.createMany({
        data: inserts,
        skipDuplicates: true
      });
      return NextResponse.json({ success: true, count: created.count });
    }

    // Single Insert or Update
    const { 
      id, employeeId, name, email, department, jobTitle, salary, joinDate, 
      ptkpStatus, npwp, nik, address, bankName, bankNumber, bankHolder, bpjsKes, bpjsKet,
      tkuId, workerStatus, position, passportNo, facilityCap
    } = body;

    if (!employeeId || !name) return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });

    const data = {
      employeeId,
      name,
      email,
      department,
      jobTitle,
      salary: Number(salary) || 0,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      ptkpStatus: ptkpStatus || 'TK/0',
      npwp: npwp || null,
      nik: nik || null,
      address: address || null,
      bankName: bankName || null,
      bankNumber: bankNumber || null,
      bankHolder: bankHolder || null,
      bpjsKes: bpjsKes || null,
      bpjsKet: bpjsKet || null,
      tkuId: tkuId || null,
      workerStatus: workerStatus || 'Resident',
      position: position || jobTitle || null,
      passportNo: passportNo || null,
      facilityCap: facilityCap || 'N/A',
      tenantId: tenant.id,
      status: 'ACTIVE'
    };

    let employee;
    if (id) {
       employee = await prisma.employee.update({
         where: { id },
         data
       });
    } else {
       employee = await prisma.employee.create({
         data
       });
    }

    return NextResponse.json(employee);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
