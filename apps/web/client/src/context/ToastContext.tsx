import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast floating container */}
      <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] transition-all transform duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50 text-rose-950 border-rose-900'
                : 'bg-blue-50 text-blue-950 border-blue-900'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />}
            <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
            <button
              id={`close-toast-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-slate-900 transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
