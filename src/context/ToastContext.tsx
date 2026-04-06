'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  onUndo?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, onUndo?: () => void) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', onUndo?: () => void) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, onUndo }]);

    // Auto-dismiss after 6 seconds (standard ERP duration)
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
              {toast.type === 'warning' && <AlertTriangle size={18} />}
            </div>
            <div className="toast-message">{toast.message}</div>
            
            {toast.onUndo && (
              <button 
                className="toast-undo" 
                onClick={() => {
                  toast.onUndo!();
                  removeToast(toast.id);
                }}
              >
                UNDO
              </button>
            )}

            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 9999;
          pointer-events: none;
        }

        .toast {
          pointer-events: auto;
          min-width: 300px;
          max-width: 450px;
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 12px;
          animation: toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-left: 4px solid #e2e8f0;
        }

        @keyframes toast-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .toast-success { border-left-color: #10b981; }
        .toast-error { border-left-color: #ef4444; }
        .toast-info { border-left-color: #3b82f6; }
        .toast-warning { border-left-color: #f59e0b; }

        .toast-icon {
          flex-shrink: 0;
        }

        .toast-success .toast-icon { color: #10b981; }
        .toast-error .toast-icon { color: #ef4444; }
        .toast-info .toast-icon { color: #3b82f6; }
        .toast-warning .toast-icon { color: #f59e0b; }

        .toast-message {
          flex-grow: 1;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
          line-height: 1.25rem;
        }

        .toast-undo {
          background: #f1f5f9;
          color: #0f172a;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          letter-spacing: 0.05em;
        }

        .toast-undo:hover {
          background: #e2e8f0;
        }

        .toast-close {
          flex-shrink: 0;
          color: #94a3b8;
          transition: color 0.2s;
          padding: 4px;
          border-radius: 4px;
        }

        .toast-close:hover {
          color: #64748b;
          background: #f1f5f9;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
