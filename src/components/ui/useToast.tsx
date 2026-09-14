'use client';

import { useCallback, useRef, useState } from 'react';

type ToastType = 'success' | 'error';

// Encapsulates the toast state + auto-dismiss timer + markup that every
// client page re-implemented by hand. Usage:
//   const { showToast, toastElement } = useToast();
//   ...
//   {toastElement}
export function useToast(timeoutMs = 2500) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type });
      timer.current = setTimeout(() => setToast(null), timeoutMs);
    },
    [timeoutMs],
  );

  const toastElement = toast ? (
    <div
      className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl flex items-center gap-2"
      style={{
        zIndex: 50,
        background: toast.type === 'success' ? 'var(--emerald-bg)' : 'var(--red-bg)',
        border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
        color: toast.type === 'success' ? 'var(--emerald)' : 'var(--red)',
      }}
    >
      <span>{toast.type === 'success' ? '✓' : '✕'}</span>
      {toast.message}
    </div>
  ) : null;

  return { showToast, toastElement };
}
