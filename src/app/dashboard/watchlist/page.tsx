'use client';

import { useState, useEffect, useCallback } from 'react';
import { relativeDate } from '@/lib/format';
import { Pagination } from '@/components/Pagination';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

interface WatchlistEntry {
  id: string;
  userId: string;
  reason: string;
  createdById: string;
  createdAt: string;
}

interface WatchlistResponse {
  data: WatchlistEntry[];
  total: number;
  page: number;
  pages: number;
}

export default function WatchlistPage() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; pages: number }>({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { showToast, toastElement } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/watchlist?page=${page}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: WatchlistResponse | null) => {
        if (d && Array.isArray(d.data)) {
          setEntries(d.data);
          setMeta({ total: d.total, page: d.page, pages: d.pages });
        } else {
          setEntries([]);
          setMeta({ total: 0, page: 1, pages: 1 });
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function addEntry() {
    if (!/^\d+$/.test(userId.trim())) { showToast('Ungültige User-ID', 'error'); return; }
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId.trim(), reason: reason.trim() || 'Mehrfachaccount' }),
    });
    if (res.ok) { setUserId(''); setReason(''); showToast('Hinzugefügt'); if (page !== 1) setPage(1); else load(); }
    else showToast('Fehler', 'error');
  }

  async function deleteEntry(id: string) {
    const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
    if (res.ok) { setConfirmDelete(null); showToast('Entfernt'); load(); }
    else showToast('Fehler', 'error');
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Watchlist"
        subtitle="AutoBan-Einträge für Mehrfachaccounts · Nur für Administratoren"
      />

      {/* Add form */}
      <div className="panel p-4 space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Eintrag hinzufügen</h3>
        <div className="flex gap-2 flex-wrap">
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User-ID…"
            onKeyDown={(e) => e.key === 'Enter' && addEntry()}
            className="px-3 py-1.5 rounded text-sm font-mono"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', width: '200px' }} />
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Grund (Standard: Mehrfachaccount)"
            onKeyDown={(e) => e.key === 'Enter' && addEntry()}
            className="px-3 py-1.5 rounded text-sm flex-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', minWidth: '200px' }} />
          <button onClick={addEntry}
            className="px-4 py-1.5 rounded text-sm font-medium"
            style={{ background: 'var(--amber)', color: '#000' }}>
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Lade…</p>
        ) : entries.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Einträge.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['User-ID', 'Grund', 'Erstellt von', 'Datum', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{e.userId}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{e.reason}</td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{e.createdById}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{relativeDate(e.createdAt)}</td>
                  <td className="px-4 py-3">
                    {confirmDelete === e.id ? (
                      <div className="flex gap-2 items-center">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sicher?</span>
                        <button onClick={() => deleteEntry(e.id)}
                          className="px-2.5 py-1 rounded text-xs"
                          style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
                          Ja
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-2.5 py-1 rounded text-xs"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                          Nein
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(e.id)}
                        className="px-2.5 py-1 rounded text-xs"
                        style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
                        Entfernen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && meta.pages > 1 && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-default)' }}>
            <Pagination page={meta.page} totalPages={meta.pages} total={meta.total} onPage={setPage} />
          </div>
        )}
      </div>

      {toastElement}
    </div>
  );
}
