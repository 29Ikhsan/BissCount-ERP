'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import styles from './page.module.css';
import { useLanguage } from '@/context/LanguageContext';

interface HistoryItem {
  type: 'input' | 'output' | 'error' | 'info' | 'success';
  content: string;
}

export default function BizzShell() {
  const { formatCurrency } = useLanguage();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'info', content: 'AKSIA TARA v1.2.0 (Activated)' },
    { type: 'info', content: 'Type "help" to see available commands.' },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const addLine = (type: HistoryItem['type'], content: string) => {
    setHistory(prev => [...prev, { type, content }]);
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const cmdLine = input.trim();
    const parts = cmdLine.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    setHistory(prev => [...prev, { type: 'input', content: cmdLine }]);
    setIsProcessing(true);
    setInput('');
    
    try {
      switch(cmd) {
        case 'help':
          addLine('output', 'Available commands:\n  ls       - List available modules\n  balance  - Show current cash & bank balance\n  stock    - Check inventory levels (usage: stock [sku])\n  whoami   - Display session information\n  clear    - Clear terminal history\n  exit     - Return to dashboard');
          break;
        case 'ls':
          addLine('output', 'Modules:\n- /dashboard\n- /invoices\n- /expenses\n- /inventory\n- /reports\n- /settings\n- /contacts');
          break;
        case 'balance': {
          const res = await fetch('/api/analytics/summary');
          const data = await res.json();
          const balance = data.kpis?.totalCashBalance || 0;
          const formatted = formatCurrency(balance);
          addLine('success', `Current Consolidated Cash Balance: ${formatted}\n\nPlease transfer payments via Wire Transfer or ACH to AKSIA Global Corp. Account No: 1234-5678-9012.\nThank you for your business! Document generated securely by AKSIA ERP.`);
          break;
        }
        case 'stock': {
          const sku = args[0] || 'ALL';
          const res = await fetch('/api/inventory');
          const data = await res.json();
          const products = data.products || [];
          
          if (sku === 'ALL') {
            const stockList = products.map((p: any) => {
              const qty = p.inventoryLevels?.reduce((s: number, l: any) => s + l.quantity, 0) || 0;
              return `[${p.sku}] ${p.name}: ${qty} Units`;
            }).join('\n');
            addLine('output', `Current Inventory Status:\n${stockList || 'No products found.'}`);
          } else {
            const p = products.find((prod: any) => prod.sku.toLowerCase() === sku.toLowerCase());
            if (p) {
               const qty = p.inventoryLevels?.reduce((s: number, l: any) => s + l.quantity, 0) || 0;
               addLine('output', `Result: [${p.sku}] ${p.name}\nQuantity on Hand: ${qty} Units\nCategory: ${p.category}`);
            } else {
               addLine('error', `Product SKU "${sku}" not found in local registry.`);
            }
          }
          break;
        }
        case 'whoami': {
          const res = await fetch('/api/settings');
          const data = await res.json();
          const profile = data.profile || {};
          const org = data.organization || {};
          addLine('output', `User: ${profile.name || 'Admin'} (${profile.jobTitle || 'System Admin'})\nOrganization: ${org.name || 'AKSIA Global Corp.'}\nSession: ACTIVE`);
          break;
        }
        case 'clear':
          setHistory([{ type: 'info', content: 'Terminal cleared.' }]);
          break;
        case 'exit':
          window.location.href = '/';
          break;
        default:
          addLine('error', `Command not found: ${cmd}. Type "help" for assistance.`);
      }
    } catch (err) {
      addLine('error', 'Execution failed: Network or API error.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.terminalWrapper} onClick={() => inputRef.current?.focus()}>
        {/* Header */}
        <div className={styles.terminalHeader}>
          <div className={styles.dotContainer}>
            <div className={`${styles.dot} ${styles.dotRed}`} />
            <div className={`${styles.dot} ${styles.dotYellow}`} />
            <div className={`${styles.dot} ${styles.dotGreen}`} />
          </div>
          <div className={styles.terminalTitle}>
            <TerminalIcon size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            AKSIA TARA Terminal — aksia@enterprise: ~
          </div>
        </div>

        {/* Output */}
        <div className={styles.outputArea}>
          {history.map((item, idx) => (
            <div key={idx} className={`${styles.line} ${styles[item.type]}`}>
              {item.type === 'input' && <span className={styles.promptSymbol}>$ </span>}
              <pre style={{ margin: 0, font: 'inherit', whiteSpace: 'pre-wrap' }}>{item.content}</pre>
            </div>
          ))}
          {isProcessing && <div className={styles.line} style={{ color: '#94A3B8' }}>Processing...</div>}
          <div ref={outputEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleCommand} className={styles.promptLine}>
          <span className={styles.promptSymbol}>aksia@enterprise:~$</span>
          <input 
            ref={inputRef}
            type="text" 
            className={styles.input} 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            autoFocus 
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
}
