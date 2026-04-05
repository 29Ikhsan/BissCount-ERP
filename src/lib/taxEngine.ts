/**
 * PPh 21 TER (Tarif Efektif Rata-Rata) Calculation Engine - 2024-2026 Compliant
 * 
 * Based on PP 58/2023 and PER-2/PJ/2024.
 */

export type TERCategory = 'A' | 'B' | 'C';

export function getTERCategory(ptkpStatus: string): TERCategory {
  const status = ptkpStatus.toUpperCase();
  if (['TK/0', 'TK/1', 'K/0'].includes(status)) return 'A';
  if (['TK/2', 'TK/3', 'K/1', 'K/2'].includes(status)) return 'B';
  if (status === 'K/3') return 'C';
  return 'A'; // Default to A
}

export function calculatePPh21TER(monthlyGross: number, category: TERCategory): { rate: number; pph21: number } {
  let rate = 0;

  // --- KATEGORI A ---
  if (category === 'A') {
    if (monthlyGross <= 5400000) rate = 0;
    else if (monthlyGross <= 5650000) rate = 0.0025;
    else if (monthlyGross <= 5950000) rate = 0.005;
    else if (monthlyGross <= 6300000) rate = 0.0075;
    else if (monthlyGross <= 6750000) rate = 0.01;
    else if (monthlyGross <= 7500000) rate = 0.0125;
    else if (monthlyGross <= 8550000) rate = 0.015;
    else if (monthlyGross <= 9650000) rate = 0.0175;
    else if (monthlyGross <= 10650000) rate = 0.02;
    else if (monthlyGross <= 12150000) rate = 0.03;
    else if (monthlyGross <= 15150000) rate = 0.05;
    else if (monthlyGross <= 19150000) rate = 0.07;
    else if (monthlyGross <= 24150000) rate = 0.09;
    else if (monthlyGross <= 32150000) rate = 0.12;
    else if (monthlyGross <= 42150000) rate = 0.15;
    else if (monthlyGross <= 52150000) rate = 0.17;
    else if (monthlyGross <= 62150000) rate = 0.19;
    else if (monthlyGross <= 72150000) rate = 0.21;
    else if (monthlyGross <= 82150000) rate = 0.23;
    else if (monthlyGross <= 102150000) rate = 0.25;
    else if (monthlyGross <= 122150000) rate = 0.27;
    else if (monthlyGross <= 152150000) rate = 0.29;
    else if (monthlyGross <= 182150000) rate = 0.31;
    else if (monthlyGross <= 232150000) rate = 0.33;
    else rate = 0.34;
  }

  // --- KATEGORI B ---
  else if (category === 'B') {
    if (monthlyGross <= 6200000) rate = 0;
    else if (monthlyGross <= 6500000) rate = 0.0025;
    else if (monthlyGross <= 6850000) rate = 0.005;
    else if (monthlyGross <= 7300000) rate = 0.0075;
    else if (monthlyGross <= 9200000) rate = 0.01;
    else if (monthlyGross <= 10750000) rate = 0.015;
    else if (monthlyGross <= 12450000) rate = 0.02;
    else if (monthlyGross <= 14550000) rate = 0.03;
    else if (monthlyGross <= 16550000) rate = 0.05;
    else if (monthlyGross <= 20550000) rate = 0.07;
    else if (monthlyGross <= 25550000) rate = 0.09;
    else if (monthlyGross <= 33550000) rate = 0.12;
    else if (monthlyGross <= 43550000) rate = 0.15;
    else if (monthlyGross <= 53550000) rate = 0.17;
    else if (monthlyGross <= 63550000) rate = 0.19;
    else if (monthlyGross <= 73550000) rate = 0.21;
    else if (monthlyGross <= 83550000) rate = 0.23;
    else if (monthlyGross <= 103550000) rate = 0.25;
    else if (monthlyGross <= 123550000) rate = 0.27;
    else if (monthlyGross <= 153550000) rate = 0.29;
    else if (monthlyGross <= 183550000) rate = 0.31;
    else if (monthlyGross <= 233550000) rate = 0.33;
    else rate = 0.34;
  }

  // --- KATEGORI C ---
  else if (category === 'C') {
    if (monthlyGross <= 6600000) rate = 0;
    else if (monthlyGross <= 6950000) rate = 0.0025;
    else if (monthlyGross <= 7350000) rate = 0.005;
    else if (monthlyGross <= 7800000) rate = 0.0075;
    else if (monthlyGross <= 8850000) rate = 0.01;
    else if (monthlyGross <= 10850000) rate = 0.0125;
    else if (monthlyGross <= 12850000) rate = 0.015;
    else if (monthlyGross <= 15050000) rate = 0.02;
    else if (monthlyGross <= 17050000) rate = 0.03;
    else if (monthlyGross <= 21050000) rate = 0.05;
    else if (monthlyGross <= 26050000) rate = 0.07;
    else if (monthlyGross <= 34050000) rate = 0.09;
    else if (monthlyGross <= 44050000) rate = 0.12;
    else if (monthlyGross <= 54050000) rate = 0.15;
    else if (monthlyGross <= 64050000) rate = 0.17;
    else if (monthlyGross <= 74050000) rate = 0.19;
    else if (monthlyGross <= 84050000) rate = 0.21;
    else if (monthlyGross <= 104050000) rate = 0.23;
    else if (monthlyGross <= 124050000) rate = 0.25;
    else if (monthlyGross <= 154050000) rate = 0.27;
    else if (monthlyGross <= 184050000) rate = 0.29;
    else if (monthlyGross <= 234050000) rate = 0.31;
    else rate = 0.33;
  }

  return { rate, pph21: Math.floor(monthlyGross * rate) };
}
