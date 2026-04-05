'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, ChevronDown, Bot, Loader2, RefreshCw, Download, Info } from 'lucide-react';
import styles from './TaxChatWidget.module.css';
import { quickReplies, welcomeMessage } from '@/lib/taxKnowledge';
import { exportChatToPDF } from '@/lib/taxChatExporter';
import { usePathname } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  category?: string | null;
  sources?: string[];
  timestamp: Date;
}

export default function TaxChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [contextualSuggestion, setContextualSuggestion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Contextual Trigger
  useEffect(() => {
    if (pathname.includes('/invoices')) {
      setContextualSuggestion('Ingat tarif PPN 11% & PPh 23 (2%) untuk jasa.');
    } else if (pathname.includes('/expenses')) {
      setContextualSuggestion('Cek tarif PPh 21 TER atau PPh 23 untuk biaya.');
    } else if (pathname.includes('/assets')) {
      setContextualSuggestion('Berapa tarif penyusutan aset pajak?');
    } else {
      setContextualSuggestion(null);
    }
  }, [pathname]);

  const addBotMessage = useCallback((content: string, category?: string | null, sources?: string[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'bot',
        content,
        category,
        sources: sources || [],
        timestamp: new Date(),
      },
    ]);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setShowBadge(false);
    if (!hasGreeted) {
      setHasGreeted(true);
      addBotMessage(welcomeMessage);
    }
  }, [hasGreeted, addBotMessage]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      },
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
      addBotMessage(data.answer, data.categoryLabel, data.sources);
    } catch {
      addBotMessage('Maaf, ada kendala teknis saat ini. Mohon coba lagi sebentar lagi atau periksa koneksi Anda. 🙏');
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
    setHasGreeted(false);
    setTimeout(() => {
      addBotMessage(welcomeMessage);
      setHasGreeted(true);
    }, 100);
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  };

  return (
    <div className={styles.widgetContainer}>
      {/* Floating Bubble */}
      {!isOpen && (
        <button className={`${styles.bubble} ${contextualSuggestion ? styles.bubbleHighlight : ''}`} onClick={openChat} aria-label="Buka PajakBot">
          <Bot size={24} />
          {showBadge && <span className={styles.badge}>1</span>}
          {contextualSuggestion && !isOpen && (
            <div className={styles.contextHint}>
              <Info size={12} /> {contextualSuggestion}
            </div>
          )}
          <span className={styles.bubbleTooltip}>PajakBot</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.botAvatar}>
                <Bot size={18} />
              </div>
              <div>
                <div className={styles.botName}>PajakBot</div>
                <div className={styles.botStatus}>
                  <span className={styles.statusDot} />
                  Asisten Pajak Indonesia
                </div>
              </div>
            </div>
            <div className={styles.headerActions}>
              {messages.length > 1 && (
                <button className={styles.iconBtn} onClick={() => exportChatToPDF(messages)} title="Download PDF">
                  <Download size={15} />
                </button>
              )}
              <button className={styles.iconBtn} onClick={resetChat} title="Reset chat">
                <RefreshCw size={15} />
              </button>
              <button className={styles.iconBtn} onClick={() => setIsOpen(false)} title="Tutup">
                <ChevronDown size={18} />
              </button>
              <button className={styles.iconBtn} onClick={() => setIsOpen(false)} title="Tutup">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((msg) => (
              <div key={msg.id} className={`${styles.messageRow} ${styles[msg.role]}`}>
                {msg.role === 'bot' && (
                  <div className={styles.msgAvatar}>
                    <Bot size={13} />
                  </div>
                )}
                <div className={styles.messageBubble}>
                  <div
                    className={styles.messageText}
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                  {msg.category && (
                    <span className={styles.categoryTag}>{msg.category}</span>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className={styles.sources}>
                      📎 {msg.sources.join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.messageRow} ${styles.bot}`}>
                <div className={styles.msgAvatar}><Bot size={13} /></div>
                <div className={styles.messageBubble}>
                  <div className={styles.typing}>
                    <Loader2 size={14} className={styles.spinner} />
                    <span>Mencari jawaban...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 1 && (
            <div className={styles.quickReplies}>
              {quickReplies.slice(0, 4).map((q) => (
                <button key={q} className={styles.quickBtn} onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className={styles.inputArea}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan tentang perpajakan..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              aria-label="Kirim pesan"
            >
              <Send size={16} />
            </button>
          </div>
          <div className={styles.footer}>
            Berdasarkan Regulasi Pajak Terkini · **Edukasi, bukan konsultasi**
          </div>
        </div>
      )}
    </div>
  );
}
