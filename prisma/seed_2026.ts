import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning old tax knowledge... ---');
  await prisma.taxKnowledge.deleteMany({});

  console.log('--- Seeding 2026 Tax Rules... ---');

  const data = [
    // PPh 21
    {
      category: 'pph21',
      question: 'Apa itu PPh Pasal 21 untuk tahun 2026?',
      answer: '**PPh Pasal 21 (2026)** adalah pajak atas penghasilan berupa gaji, upah, honorarium, tunjangan, dan pembayaran lain dengan nama dan dalam bentuk apa pun sehubungan dengan pekerjaan atau jabatan, jasa, dan kegiatan yang dilakukan oleh orang pribadi subjek pajak dalam negeri.\n\n**Metode TER (Tarif Efektif Rata-rata)** tetap digunakan untuk pemotongan bulanan demi kemudahan administrasi.',
      keywords: ['pph 21', 'pajak karyawan', 'gaji', 'potong pajak', '2026'],
      references: ['PwC Pocket Tax Book 2026', 'UU HPP']
    },
    {
      category: 'pph21',
      question: 'Berapa tarif progresif PPh Orang Pribadi 2026?',
      answer: '**Tarif Progresif PPh OP 2026:**\n\n| Lapisan Penghasilan Kena Pajak | Tarif |\n|---|---|\n| s.d. Rp 60.000.000 | **5%** |\n| > Rp 60jt s.d. Rp 250jt | **15%** |\n| > Rp 250jt s.d. Rp 500jt | **25%** |\n| > Rp 500jt s.d. Rp 5 Miliar | **30%** |\n| Di atas Rp 5 Miliar | **35%** |',
      keywords: ['tarif pph', 'progresif', 'lapisan pajak', 'persen pajak'],
      references: ['PwC Pocket Tax Book 2026']
    },
    {
      category: 'pph21',
      question: 'Berapa PTKP (Penghasilan Tidak Kena Pajak) 2026?',
      answer: '**PTKP 2026 tetap sama dengan tahun sebelumnya:**\n\n• **WP Sendiri**: Rp 54.000.000\n• **WP Kawin**: + Rp 4.500.000\n• **Tanggungan**: + Rp 4.500.000/orang (Maks 3 orang)',
      keywords: ['ptkp', 'tidak kena pajak', 'batas pph', 'tanggungan'],
      references: ['PwC Pocket Tax Book 2026']
    },

    // PPN (BIG CHANGE)
    {
      category: 'ppn',
      question: 'Berapa tarif PPN (Pajak Pertambahan Nilai) tahun 2026?',
      answer: '**Tarif PPN 2026 resmi menjadi 12%**.\n\nSesuai dengan amanat UU Harmonisasi Peraturan Perpajakan (HPP), tarif PPN naik dari 11% menjadi 12% paling lambat 1 Januari 2025. \n\n**Catatan Penting:** Untuk penyerahan tertentu (seperti aset bekas atau jasa tertentu), pemerintah mungkin menggunakan mekanisme **DPP Nilai Lain** (11/12) sehingga beban efektifnya tetap setara 11%, namun secara administratif tarif yang digunakan adalah 12%.',
      keywords: ['ppn', 'vat', '12 persen', 'naik ppn', 'pajak pertambahan nilai'],
      references: ['UU HPP No.7/2021', 'PwC Pocket Tax Book 2026']
    },

    // PPh 23
    {
      category: 'pph23',
      question: 'Apa tarif PPh Pasal 23 untuk jasa dan sewa di 2026?',
      answer: '**Tarif PPh 23 (2026):**\n\n• **2%** dari jumlah bruto atas sewa (kecuali sewa tanah/bangunan).\n• **2%** dari jumlah bruto atas jasa teknik, manajemen, konstruksi, konsultan, dan jasa lainnya.\n\n⚠️ Jika penerima penghasilan **tidak memiliki NPWP**, tarif akan dipotong 100% lebih tinggi menjadi **4%**.',
      keywords: ['pph 23', 'pajak jasa', 'sewa', '2 persen', 'konsultan'],
      references: ['PwC Pocket Tax Book 2026']
    },
    {
      category: 'pph23',
      question: 'Berapa pajak atas dividen, bunga, dan royalti di 2026?',
      answer: '**Tarif PPh 23 atas Dividen, Bunga, dan Royalti:**\n\n• **15%** dari jumlah bruto.\n\n💡 **Pengecualian**: Dividen yang diterima oleh WP Badan Dalam Negeri atau WP Orang Pribadi yang diinvestasikan kembali di Indonesia dapat dikecualikan dari objek pajak (syarat tertentu).',
      keywords: ['dividen', 'bunga', 'royalti', 'investasi', '15 persen'],
      references: ['PwC Pocket Tax Book 2026']
    },

    // PPh Badan
    {
      category: 'pph_badan',
      question: 'Berapa tarif PPh Badan (Corporate Income Tax) 2026?',
      answer: '**Tarif PPh Badan 2026:**\n\n• **Tarif Umum: 22%**.\n• **Public Companies**: Perusahaan terbuka dengan kepemilikan publik ≥ 40% dapat memperoleh tarif **19%**.\n• **Fasilitas UMKM (31E)**: Diskon 50% atas tarif (menjadi **11%**) untuk bagian Penghasilan Kena Pajak dari peredaran bruto sampai dengan Rp 4,8 Miliar (bagi perusahaan dengan omzet ≤ Rp 50M).',
      keywords: ['pph badan', 'pajak perusahaan', 'corporate tax', '22 persen', '31E'],
      references: ['UU HPP', 'PwC Pocket Tax Book 2026']
    },

    // Sanksi
    {
      category: 'sanksi',
      question: 'Bagaimana penghitungan sanksi denda pajak di 2026?',
      answer: '**Sanksi Administrasi Pajak 2026:**\n\nSanksi bunga tidak lagi flat 2%, melainkan menggunakan **Suku Bunga Acuan** yang ditetapkan Menteri Keuangan.\n\n**Rumus**: (Suku Bunga Acuan + Uplift Factor) / 12\n\n• **Uplift Factor**: \n  - 0% untuk Kurang Bayar karena pembetulan sendiri.\n  - 5% untuk Kurang Bayar karena hasil pemeriksaan.\n  - 10% untuk pengungkapan ketidakbenaran data.',
      keywords: ['denda', 'sanksi', 'bunga pajak', 'kemenkeu', 'bi rate'],
      references: ['UU KUP', 'PwC Pocket Tax Book 2026']
    }
  ];

  for (const item of data) {
    await prisma.taxKnowledge.create({
      data: item
    });
  }

  console.log('--- Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
