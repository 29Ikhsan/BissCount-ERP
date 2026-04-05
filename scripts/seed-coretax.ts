import { PrismaClient } from '../src/generated/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting TARA Coretax 2026 Knowledge Ingestion...');

  // Optional: Clear or Keep generic ones
  // await prisma.taxKnowledge.deleteMany();

  const coretaxData = [
    {
      category: 'coretax',
      question: 'Apa itu Sistem Coretax (CTAS)?',
      answer: 'Sistem Inti Administrasi Perpajakan (SIAP) atau Coretax adalah sistem informasi yang menghimpun seluruh proses bisnis inti administrasi perpajakan Indonesia. Ini mencakup pendaftaran, pengelolaan SPT, pembayaran, pelaporan, hingga layanan edukasi (Taxpayer Portal).',
      keywords: ['apa itu coretax', 'ctas', 'siap', 'sistem inti'],
      references: ['Buku Manual Coretax 2024 - Seri Umum']
    },
    {
      category: 'coretax',
      question: 'Apa saja fitur utama di Portal Wajib Pajak Coretax?',
      answer: 'Fitur utama meliputi: Profil WP (data tunggal), Ledger Pajak (transparansi saldo pajak), E-Reporting (pelaporan SPT terpadu), E-Billing (pembayaran satu pintu), dan fitur monitoring tindak lanjut layanan.',
      keywords: ['fitur coretax', 'portal wp', 'layanan coretax'],
      references: ['Buku Manual Coretax 2024 - 19 Layanan Wajib Pajak_1.pdf']
    },
    {
      category: 'spt',
      question: 'Apa itu SPT Masa PPh Unifikasi di Coretax?',
      answer: 'SPT Masa PPh Unifikasi adalah satu SPT yang digunakan untuk melaporkan beberapa jenis pajak sekaligus, yaitu PPh Pasal 4 ayat (2), PPh Pasal 15, PPh Pasal 22, PPh Pasal 23, dan PPh Pasal 26. Ini menyederhanakan pelaporan.',
      keywords: ['spt unifikasi', 'apa itu unifikasi', 'pph unifikasi', 'lapor unifikasi'],
      references: ['Buku Manual Coretax 2024 - Seri SPT Masa Unifikasi.pdf']
    },
    {
      category: 'spt',
      question: 'Bagaimana cara membuat Bukti Potong Unifikasi?',
      answer: 'Pembuatan Bukti Potong (Bupot) dilakukan melalui fitur e-Bupot di Portal Coretax. WP memasukkan data identitas penerima penghasilan, nilai bruto, dan tarif. Bupot tersimpan secara real-time dan terintegrasi.',
      keywords: ['cara buat bupot', 'bukti potong unifikasi', 'e-bupot coretax'],
      references: ['Buku Manual Coretax 2024 - Seri Bukti Potong PPh.pdf']
    },
    {
      category: 'pmse',
      question: 'Apa kewajiban PPN bagi Pelaku Usaha PMSE?',
      answer: 'Pelaku usaha Perdagangan Melalui Sistem Elektronik (PMSE) luar negeri wajib memungut, menyetorkan, dan melaporkan PPN sebesar 12% (per 2026) atas pemanfaatan BKP/JKP digital di Indonesia.',
      keywords: ['ppn pmse', 'pajak digital', 'netflix spotify pajak', 'google pajak'],
      references: ['Buku Manual Coretax 2024 - 4 Pendaftaran WP PMSE_1.pdf']
    },
    {
      category: 'ppn',
      question: 'Berapa tarif PPN terbaru di tahun 2026?',
      answer: 'Berdasarkan UU HPP, tarif PPN Indonesia telah naik menjadi 12% efektif sejak 1 Januari 2025/2026. Seluruh faktur pajak otomatis menggunakan tarif ini.',
      keywords: ['tarif ppn 2026', 'ppn 12%', 'kenaikan ppn'],
      references: ['UU HPP', 'Buku Manual SPT Masa PPN.pdf']
    },
    {
      category: 'npwp',
      question: 'Bagaimana status NIK sebagai NPWP di Coretax?',
      answer: 'Di sistem Coretax, NIK bagi Wajib Pajak Orang Pribadi secara otomatis berfungsi sebagai NPWP (16 digit). WP melakukan pemadanan data mandiri di portal DJP.',
      keywords: ['nik npwp', 'npwp 16 digit', 'pemadanan nik'],
      references: ['Buku Manual Coretax 2024 - Pendaftaran WP Orang Pribadi.pdf']
    },
    {
      category: 'npwp',
      question: 'Apa syarat Pengukuhan PKP di Coretax?',
      answer: 'Pengukuhan PKP dapat dilakukan secara elektronik melalui Coretax. Syarat utama: omzet melebihi Rp 4,8 Milyar, melampirkan legalitas, dan verifikasi lapangan.',
      keywords: ['syarat pkp', 'pengukuhan pkp coretax', 'daftar pkp'],
      references: ['Buku Manual Coretax 2024 - Permohonan Pengukuhan PKP.pdf']
    },
    {
      category: 'pbb_p5l',
      question: 'Bagaimana cara pendaftaran objek PBB P5L?',
      answer: 'Pendaftaran objek PBB sektor Perkebunan, Perhutanan, Pertambangan, dan Sektor Lainnya (P5L) dilakukan dengan menyampaikan SPOP secara elektronik melalui Coretax.',
      keywords: ['daftar pbb p5l', 'pbb perhutanan', 'pbb pertambangan', 'spop elektronik'],
      references: ['Buku Manual Coretax 2024 - Pendaftaran Obyek PBB P5L.pdf']
    }
  ];

  for (const item of coretaxData) {
    await prisma.taxKnowledge.create({
      data: item
    });
  }

  console.log('✅ TARA Knowledge Base successfully upgraded with Coretax 2026 data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
