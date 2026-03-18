'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount animation
    const t1 = setTimeout(() => setVisible(true), 10);
    // auto dismiss
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast.id, onRemove]);

  const bg =
    toast.type === 'success' ? 'bg-white border-l-4 border-[#22C55E]' :
    toast.type === 'error'   ? 'bg-white border-l-4 border-red-500' :
    'bg-white border-l-4 border-blue-500';

  const Icon = toast.type === 'error' ? XCircle : CheckCircle2;
  const iconColor = toast.type === 'error' ? 'text-red-500' : toast.type === 'success' ? 'text-[#22C55E]' : 'text-blue-500';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-[12px] shadow-lg min-w-[280px] max-w-[360px] transition-all duration-300 ${bg} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
      <p className="text-sm text-[#111827] flex-1">{toast.message}</p>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="text-[#9CA3AF] hover:text-[#374151] cursor-pointer flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${++counterRef.current}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
