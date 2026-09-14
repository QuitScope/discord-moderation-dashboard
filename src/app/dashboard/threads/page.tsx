'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

interface ThreadMetadata {
  archived: boolean;
  locked: boolean;
  create_timestamp: string | null;
}

interface Thread {
  id: string;
  name: string;
  type: number;
  parent_id: string | null;
  owner_id: string | null;
  message_count: number;
  member_count: number;
  thread_metadata: ThreadMetadata;
}

const THREAD_TYPE_LABEL: Record<number, string> = {
  10: 'News',
  11: 'Öffentlich',
  12: 'Privat',
  15: 'Forum',
};

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const { showToast, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/threads', { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as Thread[];
      setThreads(Array.isArray(data) ? data : []);
    } catch {
      setError('Threads konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function archive(threadId: string) {
    setActioning(threadId);
    try {
      const res = await fetch(`/api/threads/${threadId}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error();
      showToast('Thread archiviert');
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
    } catch {
      showToast('Fehler beim Archivieren', 'error');
    } finally {
      setActioning(null);
    }
  }

  async function deleteThread(threadId: string) {
    if (!confirm('Thread wirklich löschen? Das kann nicht rückgängig gemacht werden.')) return;
    setActioning(threadId);
    try {
      const res = await fetch(`/api/threads/${threadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Thread gelöscht');
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
    } catch {
      showToast('Fehler beim Löschen', 'error');
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Threads"
        subtitle="Aktive Threads im Server"
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: loading ? 0.6 : 1 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Aktualisieren
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade Threads…</div>
        </div>
      ) : error ? (
        <div className="text-sm px-4 py-3 rounded-lg" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>
          Keine aktiven Threads gefunden.
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Name', 'Kanal', 'Typ', 'Nachrichten', 'Aktionen'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {threads.map((thread, i) => (
                <tr key={thread.id}
                  style={{ borderBottom: i < threads.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: 'transparent' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)', maxWidth: '280px' }}>
                    <span className="truncate block">🧵 {thread.name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {thread.parent_id ? `#${thread.parent_id}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--indigo-bg)', color: 'var(--indigo-bright)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {THREAD_TYPE_LABEL[thread.type] ?? `Typ ${thread.type}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {thread.message_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => archive(thread.id)}
                        disabled={actioning === thread.id}
                        className="px-2.5 py-1 rounded text-xs font-medium"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: actioning === thread.id ? 0.5 : 1 }}
                      >
                        📁 Archivieren
                      </button>
                      <button
                        onClick={() => deleteThread(thread.id)}
                        disabled={actioning === thread.id}
                        className="px-2.5 py-1 rounded text-xs font-medium"
                        style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--red)', opacity: actioning === thread.id ? 0.5 : 1 }}
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toastElement}
    </div>
  );
}
