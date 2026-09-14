'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--abyss))',
          border: '1px solid hsl(var(--neon-cyan) / 0.3)',
          color: 'hsl(var(--neon-cyan))',
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '0.875rem',
        },
        className: 'cyber-toast',
      }}
      theme="dark"
    />
  );
}
