import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePPh21 } from '@/lib/taxation/pph21-engine';

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const params = await context.params;
    const id = params.id;

    if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    const decPayroll = await prisma.payroll.findUnique({
      where: { id: id },
      include: { employee: true, tenant: true }
    });

    if (!decPayroll) return NextResponse.json({ error: 'Payroll referensi tidak ditemukan' }, { status: 404 });
    if (decPayroll.month !== 12) return NextResponse.json({ error: '1721-A1 hanya dapat diterbitkan di bulan Desember.' }, { status: 400 });

    const yearPayrolls = await prisma.payroll.findMany({
      where: {
        employeeId: decPayroll.employeeId,
        year: decPayroll.year,
        status: 'COMPLETED'
      }
    });

    // Summing 1721-A1 components
    let sumBase = 0;
    let sumAllowances = 0;
    let sumJkkJkm = 0;
    let sumThrBonus = 0;
    let sumIuranPensiun = 0;
    let pph21JanNov = 0;

    for (const pr of yearPayrolls) {
      sumBase += pr.grossPay;
      sumAllowances += pr.allowances;
      sumJkkJkm += pr.jkkJkm;
      sumThrBonus += pr.thrBonus;
      sumIuranPensiun += pr.iuranPensiun;
      if (pr.month < 12) {
        pph21JanNov += pr.pph21;
      }
    }

    // Hitung Ulang Pajak Tahunan (Sama seperti engine)
    const taxInput = {
      isDecember: true,
      ptkpStatus: decPayroll.employee.ptkpStatus,
      monthlyBruto: decPayroll.grossPay + decPayroll.allowances,
      monthlyJkkJkm: decPayroll.jkkJkm,
      monthlyThrBonus: decPayroll.thrBonus,
      monthlyIuranPensiun: decPayroll.iuranPensiun,
      yearlyBrutoToDate: sumBase + sumAllowances,
      yearlyJkkJkmToDate: sumJkkJkm,
      yearlyThrBonusToDate: sumThrBonus,
      yearlyIuranPensiunToDate: sumIuranPensiun,
      pph21PaidJanNov: pph21JanNov
    };

    const taxResult = calculatePPh21(taxInput);

    const result = {
      tenant: decPayroll.tenant,
      employee: decPayroll.employee,
      year: decPayroll.year,
      components: {
        gajiPensiun: sumBase,
        tunjanganLainnya: sumAllowances,
        premiAsuransi: sumJkkJkm,
        brutoRutin: sumBase + sumAllowances + sumJkkJkm,
        bonusThr: sumThrBonus,
        totalBrutoSetahun: sumBase + sumAllowances + sumJkkJkm + sumThrBonus,
        biayaJabatan: taxResult.biayaJabatan,
        iuranPensiunJht: sumIuranPensiun,
        totalPengurang: taxResult.biayaJabatan + sumIuranPensiun,
        netoSetahun: (sumBase + sumAllowances + sumJkkJkm + sumThrBonus) - (taxResult.biayaJabatan + sumIuranPensiun),
        ptkpStatus: decPayroll.employee.ptkpStatus,
        pkp: taxResult.pkp,
        pph21TerutangA1: pph21JanNov + decPayroll.pph21, // Total PPh setahun (Paid Jan-Nov + December slice)
        pph21Lunas: pph21JanNov + decPayroll.pph21
      }
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
