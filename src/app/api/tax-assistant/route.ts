import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { searchTaxKnowledge, welcomeMessage, categoryLabels, TaxTopic } from '@/lib/taxKnowledge';

// Initialize DeepSeek Client (OpenAI-compatible)
const deepseek = process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'REPLACE_WITH_DEEPSEEK_KEY'
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmed = message.trim();

    // 1. Initial greeting / welcome logic
    const greetings = ['halo', 'hai', 'hello', 'hi', 'selamat', 'pagi', 'siang', 'malam', 'sore'];
    if (greetings.some((g) => trimmed.toLowerCase().startsWith(g)) && trimmed.length < 10) {
      return NextResponse.json({
        answer: welcomeMessage,
        category: null,
        sources: [],
      });
    }

    // 2. Fetch Knowledge Base for RAG (Retrieval)
    const dbTopics = await prisma.taxKnowledge.findMany();
    const topics: TaxTopic[] = dbTopics.map(t => ({
      id: t.id,
      category: t.category as any,
      keywords: t.keywords,
      question: t.question,
      answer: t.answer,
      references: t.references
    }));

    const contextResults = searchTaxKnowledge(trimmed, topics, 3);
    const contextStr = contextResults.length > 0 
      ? contextResults.map(r => `[Topik: ${r.topic.question}]\nJawaban Resmi: ${r.topic.answer}`).join('\n\n')
      : "Tidak ada konteks spesifik di database pengetahuan.";

    // 3. AI Generation (DeepSeek)
    if (deepseek) {
      try {
        const response = await deepseek.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `Anda adalah "TARA" (Tax AI Research Assistant) - asisten AI ahli perpajakan Indonesia tahun 2026 (Spesialis Sistem Coretax).
Tugas Anda adalah menjawab pertanyaan pengguna secara ramah, profesional, dan akurat berdasarkan modul regulasi Coretax 2024-2026.

KONTEKS DATABASE (Gunakan ini sebagai prioritas utama):
${contextStr}

ATURAN PENTING:
1. Jika ada konteks di atas yang relevan, gunakan sebagai dasar jawaban.
2. Jika tidak ada konteks, gunakan pengetahuan umum Anda tentang hukum pajak Indonesia 2026 (Ingat: PPN sudah 12%).
3. Selalu tampilkan jawaban dalam Bahasa Indonesia yang formal namun membantu.
4. Gunakan format Markdown (bold, list, atau tabel jika perlu).
5. Tambahkan disclaimer di akhir: "⚠️ Materi ini bersifat edukasi, bukan konsultasi resmi."`
            },
            ...history,
            { role: "user", content: trimmed }
          ],
          temperature: 0.3,
        });

        const text = response.choices[0].message.content;

        if (text) {
          return NextResponse.json({
            answer: text,
            category: contextResults[0]?.topic.category || 'AI_Generated',
            categoryLabel: contextResults[0]?.topic.category ? categoryLabels[contextResults[0]?.topic.category] : 'FIRA AI Business Copilot',
            sources: contextResults[0]?.topic.references || [],
          });
        }
      } catch (aiError: any) {
        console.error('DeepSeek AI Call Failed:', aiError);
      }
    }

    // 4. Fallback Logic
    const results = searchTaxKnowledge(trimmed, topics, 3);
    if (results.length === 0 || results[0].score < 1) {
      return NextResponse.json({
        answer: `Maaf, saya tidak menemukan jawaban yang tepat. (Mode Pencarian Lokal)\n\nSilakan coba pertanyaan spesifik seputar PPN 12%, PPh 21, atau e-Faktur.`,
        category: null,
        sources: [],
      });
    }

    const best = results[0].topic;
    return NextResponse.json({
      answer: best.answer + "\n\n(Catatan: Menampilkan jawaban dari database karena sistem AI sedang sibuk atau belum terkonfigurasi.)",
      category: best.category,
      categoryLabel: categoryLabels[best.category],
      sources: best.references || [],
    });

  } catch (error: any) {
    console.error('Tax Assistant API Error:', error);
    return NextResponse.json({ 
      error: 'Maaf, sistem asisten pajak sedang mengalami kendala teknis.', 
      details: error.message 
    }, { status: 500 });
  }
}
