'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import styles from './page.module.css';

interface HistoryItem {
  type: 'input' | 'output' | 'error' | 'info' | 'success';
  content: string;
}

export default function BizzShell() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'info', content: 'BizzShell v1.0.4 (Enterprise Edition)' },
    { type: 'info', content: 'Type "help" to see available commands.' },
  ]);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    const newHistory: HistoryItem[] = [...history, { type: 'input', content: input }];
    
    // Command Parser
    switch(cmd) {
      case 'help':
        newHistory.push({ type: 'output', content: 'Available commands:\n  ls       - List available modules\n  balance  - Show current cash & bank balance\n  stock    - Check inventory levels (usage: stock [sku])\n  whoami   - Display session information\n  clear    - Clear terminal history\n  exit     - Return to dashboard' });
        break;
      case 'ls':
        newHistory.push({ type: 'output', content: 'Modules:\n- /dashboard\n- /invoices\n- /expenses\n- /inventory\n- /reports\n- /settings\n- /contacts' });
        break;
      case 'balance':
        newHistory.push({ type: 'success', content: 'Current Consolidated Balance: IDR 1.284.500.000,00' });
        break;
      case 'whoami':
        newHistory.push({ type: 'output', content: 'User: Ikhsan (Administrator)\nTenant: BizzCount Global Corp\nRole: SuperAdmin' });
        break;
      case 'clear':
        setHistory([{ type: 'info', content: 'Terminal cleared.' }]);
        setInput('');
        return;
      case 'exit':
        window.location.href = '/';
        break;
      default:
        if (cmd.startsWith('stock')) {
          const sku = cmd.split(' ')[1] || 'ALL';
          newHistory.push({ type: 'output', content: `Querying Stock for ${sku}...\n[SKU-1001] MacBook Pro M3: 15 Units\n[SKU-1002] Dell XPS: 8 Units` });
        } else {
          newHistory.push({ type: 'error', content: `Command not found: ${cmd}. Type "help" for assistance.` });
        }
    }

    setHistory(newHistory);
    setInput('');
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
            BizzShell Terminal — bizzcount@enterprise: ~
          </div>
        </div>

        {/* Output */}
        <div className={styles.outputArea}>
          {history.map((item, idx) => (
            <div key={idx} className={`${styles.line} ${styles[item.type]}`}>
              {item.type === 'input' && <span className={styles.promptSymbol}>$ </span>}
              {item.content}
            </div>
          ))}
          <div ref={outputEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleCommand} className={styles.promptLine}>
          <span className={styles.promptSymbol}>bizzcount@enterprise:~$</span>
          <input 
            ref={inputRef}
            type="text" 
            className={styles.input} 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            autoFocus 
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
}
