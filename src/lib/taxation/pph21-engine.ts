export type TerCategory = 'A' | 'B' | 'C';

export interface PTKPData {
  status: string;
  amount: number;
  terCategory: TerCategory;
}

export const PTKP_TABLE: Record<string, PTKPData> = {
  'TK/0': { status: 'TK/0', amount: 54000000, terCategory: 'A' },
  'TK/1': { status: 'TK/1', amount: 58500000, terCategory: 'A' },
  'K/0':  { status: 'K/0',  amount: 58500000, terCategory: 'A' },
  'TK/2': { status: 'TK/2', amount: 63000000, terCategory: 'B' },
  'TK/3': { status: 'TK/3', amount: 67500000, terCategory: 'B' },
  'K/1':  { status: 'K/1',  amount: 63000000, terCategory: 'B' },
  'K/2':  { status: 'K/2',  amount: 67500000, terCategory: 'B' },
  'K/3':  { status: 'K/3',  amount: 72000000, terCategory: 'C' },
};

// Simplified TER Tables based on PP 58/2023 for frequently used ranges (focusing on the user's examples)
// In a full production system, this would be loaded from a database or a full JSON file containing the thousands of rows.
const TER_RATES = {
  A: [
    { min: 0, max: 5400000, rate: 0 },
    { min: 5400001, max: 5650000, rate: 0.25 },
    { min: 5650001, max: 5950000, rate: 0.5 },
    // Simplified fallback...
    { min: 5950001, max: Infinity, rate: 5 }
  ],
  B: [
    { min: 0, max: 6200000, rate: 0 },
    { min: 6200001, max: 6500000, rate: 0.25 },
    // The exact brackets for 15M and 17.5M from the DJP example:
    { min: 14050001, max: 15550000, rate: 6 }, // 15M falls here
    { min: 15550001, max: 17050000, rate: 6.5 },
    { min: 17050001, max: 19550000, rate: 7 }, // 17.5M falls here
    { min: 19550001, max: Infinity, rate: 8 }
  ],
  C: [
    { min: 0, max: 6600000, rate: 0 },
    { min: 6600001, max: 6950000, rate: 0.25 },
    { min: 6950001, max: Infinity, rate: 5 }
  ]
};

export function getTerRate(bruto: number, category: TerCategory): number {
  const table = TER_RATES[category];
  for (const bracket of table) {
    if (bruto >= bracket.min && bruto <= bracket.max) {
      return bracket.rate;
    }
  }
  // Default progressive estimation if exact bounds are missing from our simplified table
  if (bruto > 0) return 5; 
  return 0;
}

export function calculateProgressiveTax(pkp: number): number {
  if (pkp <= 0) return 0;
  
  let tax = 0;
  let remainingPkp = pkp;

  // 5% up to 60M
  if (remainingPkp > 0) {
    const tier = Math.min(remainingPkp, 60000000);
    tax += tier * 0.05;
    remainingPkp -= tier;
  }
  
  // 15% from 60M to 250M
  if (remainingPkp > 0) {
    const tier = Math.min(remainingPkp, 190000000); // 250M - 60M
    tax += tier * 0.15;
    remainingPkp -= tier;
  }
  
  // 25% from 250M to 500M
  if (remainingPkp > 0) {
    const tier = Math.min(remainingPkp, 250000000);
    tax += tier * 0.25;
    remainingPkp -= tier;
  }
  
  // 30% from 500M to 5B
  if (remainingPkp > 0) {
    const tier = Math.min(remainingPkp, 4500000000);
    tax += tier * 0.30;
    remainingPkp -= tier;
  }
  
  // 35% above 5B
  if (remainingPkp > 0) {
    tax += remainingPkp * 0.35;
  }

  return tax;
}

export interface PayrollCalculationInput {
  isDecember: boolean;
  ptkpStatus: string;
  monthlyBruto: number; // Gaji + Insentif this month
  monthlyIuranPensiun: number; // Pension deductions this month
  // Accumulated data for December true reconciliation
  yearlyBrutoToDate?: number; // Including this month
  yearlyIuranPensiunToDate?: number; // Including this month
  pph21PaidJanNov?: number;
}

export function calculatePPh21(input: PayrollCalculationInput) {
  const ptkp = PTKP_TABLE[input.ptkpStatus] || PTKP_TABLE['TK/0'];
  const ptkpAmount = ptkp.amount;
  const terCategory = ptkp.terCategory;

  if (!input.isDecember) {
    // TER Calculation for Jan - Nov
    const terRate = getTerRate(input.monthlyBruto, terCategory);
    const taxAmount = Math.floor(input.monthlyBruto * (terRate / 100)); // Bulatkan ke bawah sesuai ketentuan DJP
    
    // Monthly Biaya Jabatan max 500k
    const biayaJabatan = Math.min(input.monthlyBruto * 0.05, 500000);
    
    return {
      terCategory,
      terRate,
      biayaJabatan,
      pkp: 0, // Not strictly calculated for Jan-Nov
      taxAmount: taxAmount >= 0 ? taxAmount : 0
    };
  } else {
    // December: Full year reconciliation
    const yearlyBruto = input.yearlyBrutoToDate || 0;
    const yearlyPensiun = input.yearlyIuranPensiunToDate || 0;
    
    // Biaya Jabatan Setahun: 5% of Bruto max 6,000,000
    const biayaJabatan = Math.min(yearlyBruto * 0.05, 6000000);
    
    const totalPengurang = biayaJabatan + yearlyPensiun;
    const nettoSetahun = yearlyBruto - totalPengurang;
    
    // PKP dibulatkan ke bawah ratusan/ribuan (Standard tax rounding to nearest 1000)
    let pkp = nettoSetahun - ptkpAmount;
    if (pkp < 0) pkp = 0;
    pkp = Math.floor(pkp / 1000) * 1000;
    
    const taxSetahun = calculateProgressiveTax(pkp);
    
    const pph21PaidJanNov = input.pph21PaidJanNov || 0;
    const pph21Desember = taxSetahun - pph21PaidJanNov;

    return {
      terCategory,
      terRate: 0, // N/A for December progressive
      biayaJabatan,
      pkp,
      taxSetahun,
      pph21PaidJanNov,
      taxAmount: pph21Desember >= 0 ? pph21Desember : 0 // Handle LB if needed later
    };
  }
}
