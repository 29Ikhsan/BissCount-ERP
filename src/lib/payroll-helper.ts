/**
 * Indonesian PPh 21 & BPJS Calculator (2026 UU HPP Standards)
 */
export function calculateIDRPayroll(monthlySalary: number, allowances: number = 0) {
  const grossIncome = monthlySalary + allowances;

  // 1. BPJS Karyawan (Employee Deductions)
  const bpjsHealth = Math.min(grossIncome * 0.01, 120000); // 1% capped at 12M salary
  const bpjsJHT = grossIncome * 0.02; // 2% JHT (Old Age)
  const bpjsJP = Math.min(grossIncome * 0.01, 95000); // 1% Pension capped approx

  const totalBPJS = bpjsHealth + bpjsJHT + bpjsJP;

  // 2. PPh 21 (Income Tax)
  // Biaya Jabatan: 5% of Gross, max 500k/month
  const biayaJabatan = Math.min(grossIncome * 0.05, 500000);
  
  // Net Monthly for Tax purposes
  const netMonthly = grossIncome - biayaJabatan - bpjsJHT - bpjsJP;
  const annualNet = netMonthly * 12;

  // PTKP (Non-taxable income) - Default TK/0 (Single) 54M
  const ptkp = 54000000;
  const pkp = Math.max(0, annualNet - ptkp); // Taxable Income

  // Progressive Tax Brackets (UU HPP)
  let annualTax = 0;
  let remainingPKP = pkp;

  const brackets = [
    { limit: 60000000, rate: 0.05 },
    { limit: 190000000, rate: 0.15 }, // up to 250M
    { limit: 250000000, rate: 0.25 }, // up to 500M
    { limit: 4500000000, rate: 0.30 }, // up to 5B
    { limit: Infinity, rate: 0.35 }
  ];

  for (const bracket of brackets) {
    if (remainingPKP > 0) {
      const taxableInBracket = Math.min(remainingPKP, bracket.limit);
      annualTax += taxableInBracket * bracket.rate;
      remainingPKP -= taxableInBracket;
    } else break;
  }

  const monthlyTax = Math.round(annualTax / 12);

  return {
    grossIncome,
    bpjsDeductions: Math.round(totalBPJS),
    pph21Tax: monthlyTax,
    totalDeductions: Math.round(totalBPJS + monthlyTax),
    netPay: Math.round(grossIncome - totalBPJS - monthlyTax)
  };
}
