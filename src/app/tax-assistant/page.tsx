'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, RefreshCw, Loader2, BookOpen, Clock, MessageSquare, Download
} from 'lucide-react';
import { quickReplies, welcomeMessage, categoryLabels, TaxCategory } from '@/lib/taxKnowledge';
import { exportChatToPDF } from '@/lib/taxChatExporter';
import styles from './page.module.css';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  categoryLabel?: string | null;
  sources?: string[];
  timestamp: Date;
}

const topicButtons: { label: string; query: string; category: TaxCategory }[] = [
  { label: 'PPh 21', query: 'Apa itu PPh Pasal 21 dan berapa tarifnya?', category: 'pph21' },
  { label: 'PPh 23', query: 'Apa itu PPh Pasal 23 dan tarifnya?', category: 'pph23' },
  { label: 'PPh Badan', query: 'Berapa tarif PPh Badan?', category: 'pph_badan' },
  { label: 'PPN', query: 'Apa itu PPN dan berapa tarifnya?', category: 'ppn' },
  { label: 'e-Faktur', query: 'Apa itu e-Faktur dan cara membuatnya?', category: 'efaktur' },
  { label: 'NPWP', query: 'Bagaimana cara mendapatkan NPWP?', category: 'npwp' },
  { label: 'SPT', query: 'Kapan batas waktu SPT Tahunan?', category: 'spt' },
  { label: 'Sanksi', query: 'Apa sanksi terlambat bayar pajak?', category: 'sanksi' },
];

export default function TaxAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addBotMessage = useCallback((content: string, categoryLabel?: string | null, sources?: string[]) => {
    setMessages((prev) => [
      ...prev,
      { id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, role: 'bot', content, categoryLabel, sources: sources || [], timestamp: new Date() },
    ]);
  }, []);

  useEffect(() => {
    addBotMessage(welcomeMessage);
  }, [addBotMessage]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

     setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, role: 'user', content: trimmed, timestamp: new Date() },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/tax-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (data.answer) {
        addBotMessage(data.answer, data.categoryLabel, data.sources);
      } else {
        addBotMessage(data.error || 'Maaf, AI tidak dapat memberikan jawaban saat ini. Periksa konfigurasi API Anda.');
      }
    } catch {
      addBotMessage('Maaf, terjadi kesalahan koneksi. Silakan coba lagi. 🙏');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading, addBotMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setTimeout(() => addBotMessage(welcomeMessage), 100);
  };

  const formatContent = (content: string) => {
    if (!content) return '';
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Simple table support
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim().length > 0);
        return `<div class="${styles.tableRow}">${cells.map(c => `<span>${c.trim()}</span>`).join('')}</div>`;
      })
      // List support
      .replace(/^\•\s+(.*)/gm, '<li>$1</li>')
      .replace(/(<li>(?:[\s\S]*?)<\/li>)/g, '<ul>$1</ul>')
      .replace(/\n/g, '<br/>');
    
    return formatted;
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={styles.page}>
      {/* ─── Left Panel ─── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBox}>
            <Bot size={22} />
          </div>
          <div>
            <h2 className={styles.sidebarTitle}>PajakBot</h2>
            <p className={styles.sidebarSub}>Asisten Pajak Indonesia</p>
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <p className={styles.sideLabel}><BookOpen size={13} /> Topik Pajak</p>
          <div className={styles.topicGrid}>
            {topicButtons.map((t) => (
              <button key={t.category} className={styles.topicBtn} onClick={() => sendMessage(t.query)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <p className={styles.sideLabel}><MessageSquare size={13} /> Pertanyaan Umum</p>
          <div className={styles.quickList}>
            {quickReplies.map((q) => (
              <button key={q} className={styles.quickItem} onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <p>📖 Sumber: Regulasi Pajak Terkini</p>
          <p>Materi ini bersifat edukasi, bukan merupakan konsultasi perpajakan resmi.</p>
        </div>
      </aside>

      {/* ─── Chat Area ─── */}
      <main className={styles.chatArea}>
        {/* Chat Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div className={styles.chatAvatar}>
              <Bot size={20} />
            </div>
            <div>
              <h1 className={styles.chatTitle}>Asisten Pajak Indonesia</h1>
              <span className={styles.chatOnline}><span className={styles.onlineDot}/> Online · Siap membantu</span>
            </div>
          </div>
          <div className={styles.chatHeaderActions}>
            {messages.length > 1 && (
              <button className={styles.resetBtn} onClick={() => exportChatToPDF(messages)} title="Download PDF">
                <Download size={15} />
                <span>Download PDF</span>
              </button>
            )}
            <button className={styles.resetBtn} onClick={resetChat} title="Reset percakapan">
              <RefreshCw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.msgRow} ${styles[msg.role]}`}>
              {msg.role === 'bot' && (
                <div className={styles.avatar}><Bot size={14} /></div>
              )}
              <div className={styles.msgContent}>
                <div className={styles.bubble}>
                  <div
                    className={styles.msgText}
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                </div>
                <div className={styles.msgMeta}>
                  {msg.categoryLabel && (
                    <span className={styles.tag}>{msg.categoryLabel}</span>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <span className={styles.ref}>📎 {msg.sources.join(' · ')}</span>
                  )}
                  <span className={styles.time}><Clock size={10}/> {formatTime(msg.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className={`${styles.msgRow} ${styles.bot}`}>
              <div className={styles.avatar}><Bot size={14} /></div>
              <div className={styles.msgContent}>
                <div className={styles.bubble}>
                  <div className={styles.typing}>
                    <div className={styles.pulseDot} />
                    <span>AI sedang menyusun jawaban ahli...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan tentang perpajakan Indonesia... (Enter untuk kirim)"
            rows={2}
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
            <span>Kirim</span>
          </button>
        </div>
        <p className={styles.inputHint}>
          Tekan <kbd>Enter</kbd> untuk kirim · <kbd>Shift+Enter</kbd> untuk baris baru
        </p>
      </main>
    </div>
  );
}
