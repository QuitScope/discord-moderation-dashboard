'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Whether the current user may change anything on these pages.
 *
 * The write check already runs in the API and its web proxies, so this is not a security
 * boundary — it exists so a read-only user sees disabled controls instead of filling in a
 * form and being refused on save. The value is computed on the server in `layout.tsx`, which
 * is the only place that can read the session directly.
 */
const WriteAccessContext = createContext(false);

export function WriteAccessProvider({ canWrite, children }: { canWrite: boolean; children: ReactNode }) {
  return <WriteAccessContext.Provider value={canWrite}>{children}</WriteAccessContext.Provider>;
}

export function useCanWrite(): boolean {
  return useContext(WriteAccessContext);
}

/** Shown once at the top of a page instead of repeating "read-only" on every control. */
export function ReadOnlyNotice() {
  const canWrite = useCanWrite();
  if (canWrite) return null;
  return (
    <div className="rounded-lg p-3 flex gap-2" style={{ background: 'var(--amber-bg)', border: '1px solid rgba(245,158,11,0.3)' }}>
      <span>👁️</span>
      <p className="text-xs" style={{ color: 'var(--amber-bright)' }}>
        Du hast nur Leserechte für TempVoice. Änderungen lassen sich ansehen, aber nicht speichern.
      </p>
    </div>
  );
}
