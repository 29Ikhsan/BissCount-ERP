/**
 * PajakBot Knowledge Base – Indonesian Tax Law (2026 Update)
 */

export interface TaxTopic {
  id: string;
  category: TaxCategory;
  keywords: string[];
  question: string;
  answer: string;
  references?: string[];
}

export type TaxCategory =
  | 'pph21'
  | 'pph23'
  | 'pph25'
  | 'pph26'
  | 'pph_badan'
  | 'ppn'
  | 'spt'
  | 'npwp'
  | 'efaktur'
  | 'batas_waktu'
  | 'pph4(2)'
  | 'umum'
  | 'sanksi'
  | 'pmse'
  | 'pbb_p5l'
  | 'coretax';

export const categoryLabels: Record<TaxCategory, string> = {
  pph21: 'PPh Pasal 21',
  pph23: 'PPh Pasal 23',
  pph25: 'PPh Pasal 25',
  pph26: 'PPh Pasal 26',
  pph_badan: 'PPh Badan',
  ppn: 'PPN & PPnBM',
  spt: 'SPT & Pelaporan',
  npwp: 'NPWP & PKP',
  efaktur: 'e-Faktur',
  batas_waktu: 'Batas Waktu Pajak',
  'pph4(2)': 'PPh Pasal 4(2)',
  umum: 'Umum',
  sanksi: 'Sanksi & Denda',
  pmse: 'PMSE (Pajak Bisnis Digital)',
  pbb_p5l: 'PBB P5L (Perkebunan/Pertambangan)',
  coretax: 'CoreTax System Guide',
};

// Data is now fetched from the database.
export const taxKnowledge: TaxTopic[] = [];

// ───────────────────────────────────────────────────────
// SEARCH ENGINE Logic
// ───────────────────────────────────────────────────────

export interface SearchResult {
  topic: TaxTopic;
  score: number;
}

function normalize(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Weighted search among a provided list of topics.
 */
export function searchTaxKnowledge(query: string, topics: TaxTopic[], topN = 3): SearchResult[] {
  const normalizedQuery = normalize(query);
  const queryWords = normalizedQuery.split(' ').filter((w) => w.length > 2);

  // Intent Detection (Categorical Boosting)
  const categoryBoosts: Record<string, TaxCategory[]> = {
    'gaji': ['pph21'], 'karyawan': ['pph21'], 'upah': ['pph21'], 'honor': ['pph21'],
    'jasa': ['pph23'], 'sewa': ['pph4(2)', 'pph23'], 'royalti': ['pph23'],
    'faktur': ['ppn', 'efaktur'], 'efaktur': ['ppn', 'efaktur'], '12%': ['ppn'],
    'denda': ['sanksi'], 'telat': ['sanksi', 'batas_waktu'], 'sanksi': ['sanksi'],
    'lapor': ['spt', 'batas_waktu'], 'spt': ['spt'], 'tahunan': ['spt'],
    'perusahaan': ['pph_badan'], 'badan': ['pph_badan']
  };

  const results: SearchResult[] = topics.map((topic) => {
    let score = 0;

    // 1. Categorical Boost (Intent match)
    for (const [trigger, cats] of Object.entries(categoryBoosts)) {
      if (normalizedQuery.includes(trigger) && cats.includes(topic.category)) {
        score += 15;
      }
    }

    // 2. Exact keyword match (Highest weight)
    for (const keyword of topic.keywords) {
      const kw = normalize(keyword);
      if (normalizedQuery.includes(kw)) {
        score += 12;
        // Exact full phrase match in keywords
        if (kw === normalizedQuery) score += 20;
      }
    }

    // 3. Partial keyword match (Word by word)
    for (const keyword of topic.keywords) {
      const kwWords = normalize(keyword).split(' ').filter(w => w.length > 2);
      for (const word of queryWords) {
        if (kwWords.includes(word)) {
          score += 4;
        }
      }
    }

    // 4. Question match
    const normalizedQuestion = normalize(topic.question);
    if (normalizedQuery.includes(normalizedQuestion) || normalizedQuestion.includes(normalizedQuery)) {
      score += 10;
    }
    for (const word of queryWords) {
      if (normalizedQuestion.includes(word)) {
        score += 2;
      }
    }

    // 5. Answer match (Context check)
    const normalizedAnswer = normalize(topic.answer);
    for (const word of queryWords) {
      if (normalizedAnswer.includes(word)) {
        score += 1;
      }
    }

    return { topic, score };
  });

  return results
    .filter((r) => r.score > 5) // Minimum threshold for relevance
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export const quickReplies = [
  'Apa itu sistem Coretax?',
  'Berapa tarif PPN tahun 2026?',
  'Bagaimana lapor SPT Masa Unifikasi?',
  'Panduan Pendaftaran WP PMSE',
  'Berapa tarif PPh Pasal 21?',
  'Apa sanksi terlambat bayar pajak?',
  'Bagaimana menghitung PPh 25?',
  'Cara lapor SPT Masa PPN di Coretax',
];

export const welcomeMessage = 'Halo! Saya **TARA** 🤖 (**Tax AI Research Assistant**).\n\nSaya asisten ahli perpajakan Indonesia tahun 2026 (Modernisasi Coretax). Saya siap membantu Anda dalam:\n\n• **Pemahaman Coretax**: SPT Unifikasi, Pembayaran, Monitoring.\n• **Registrasi WP**: Orang Pribadi, Badan, PMSE, NPWP.\n• **PPN (12%)**: e-Faktur Coretax & Pelaporan Masa.\n• **PPh**: Pasal 21, 23, 25, 26, & PPh Badan.\n• **Kepatuhan**: Batas waktu pelaporan & kalkulasi sanksi.\n\n⚠️ **Disclaimer**: Materi ini bersifat edukasi/riset, bukan merupakan konsultasi perpajakan resmi. 📋';
