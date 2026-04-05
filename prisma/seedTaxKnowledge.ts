import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const topics = [
    {
      category: 'ppn',
      keywords: ['ppn', 'tarif', '12', 'pajak pertambahan nilai', '2026'],
      question: 'Berapa tarif PPN tahun 2026?',
      answer: 'Sesuai UU HPP dan peraturan terbaru di portal **Coretax 2026**, tarif PPN (Pajak Pertambahan Nilai) di Indonesia kini adalah **12%**. Tarif ini mulai berlaku secara efektif untuk memperkuat penerimaan negara melalui sistem perpajakan digital yang terintegrasi (Modernisasi Coretax).',
      references: ['UU HPP 2021', 'PMK Coretax 2026']
    },
    {
      category: 'pph21',
      keywords: ['pph 21', 'ter', 'tarif efektif rata-rata', 'gaji', 'karyawan', 'ptkp'],
      question: 'Bagaimana menghitung PPh Pasal 21 dengan TER?',
      answer: 'Perhitungan PPh 21 tahun 2026 menggunakan metode **Tarif Efektif Rata-Rata (TER)** untuk masa pajak Januari-November. TER dibagi menjadi Kategori A, B, dan C berdasarkan status PTKP. Pada masa pajak Desember, dilakukan penghitungan ulang (re-kalkulasi) menggunakan tarif Pasal 17 ayat (1) huruf a UU PPh untuk memastikan akurasi pemotongan tahunan.',
      references: ['PP 58/2023', 'PER-2/PJ/2024']
    },
    {
      category: 'coretax',
      keywords: ['coretax', 'sistem baru', 'aksia', 'otomatisasi', 'djp'],
      question: 'Apa itu sistem Coretax?',
      answer: 'Sistem **Coretax** adalah sistem administrasi perpajakan yang sangat terintegrasi (CTAS) milik DJP. Di sistem Bizzcount, modul Tax Compliance sudah 100% tersinkronisasi dengan Coretax API, memungkinkan **e-Faktur Otomatis**, **e-Bupot Unifikasi**, dan pelaporan SPT Masa secara realtime melalui otentikasi biometrik dan sertifikat elektronik terbaru.',
      references: ['DJP Update 2026']
    }
  ];

  console.log('Seeding Tax Knowledge Base...');
  for (const t of topics) {
    await prisma.taxKnowledge.upsert({
      where: { id: `seed-${t.category}` }, // Static ID for seeding
      update: t,
      create: { id: `seed-${t.category}`, ...t },
    });
  }
  console.log('Knowledge Base Seeded Successfully! TARA is now ALIVE.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
