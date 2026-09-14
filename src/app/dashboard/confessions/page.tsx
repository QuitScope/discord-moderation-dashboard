'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';

type TabStatus = 'pending_review' | 'published' | 'rejected';

interface Confession {
  id: string;
  number: number;
  content: string;
  status: TabStatus;
  createdAt: string;
  userId: string;
}

interface ConfessionBan {
  id: string;
  userId: string;
  reason: string | null;
  createdAt: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std`;
  return `vor ${Math.floor(hours / 24)} Tagen`;
}

export default function ConfessionsPage() {
  const [tab, setTab] = useState<TabStatus | 'bans'>('pending_review');
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [bans, setBans] = useState<ConfessionBan[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newBanUserId, setNewBanUserId] = useState('');
  const [newBanReason, setNewBanReason] = useState('');
  const { showToast, toastElement } = useToast();

  const loadConfessions = useCallback(() => {
    if (tab === 'bans') return;
    setLoading(true);
    fetch(`/api/confessions?status=${tab}&page=${page}`)
      .then((r) => r.json())
      .then((d) => { setConfessions(d.confessions ?? []); setPages(d.pages ?? 1); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [tab, page]);

  const loadBans = useCallback(() => {
    if (tab !== 'bans') return;
    setLoading(true);
    fetch('/api/confession-bans')
      .then((r) => r.json())
      .then((d: ConfessionBan[]) => setBans(d ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { loadConfessions(); loadBans(); }, [loadConfessions, loadBans]);

  async function updateStatus(id: string, status: 'published' | 'rejected') {
    const res = await fetch(`/api/confessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { showToast('Gespeichert'); loadConfessions(); }
    else showToast('Fehler', 'error');
  }

  async function handleBan(id: string) {
    const confession = confessions.find((c) => c.id === id);
    if (!confession) return;
    const rejectRes = await fetch(`/api/confessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    if (!rejectRes.ok) { showToast('Fehler', 'error'); return; }
    const banRes = await fetch('/api/confession-bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: confession.userId }),
    });
    if (banRes.ok) { showToast('Confession abgelehnt & User gebannt'); loadConfessions(); }
    else showToast('Fehler', 'error');
  }

  async function addBan() {
    if (!/^\d+$/.test(newBanUserId.trim())) return;
    const res = await fetch('/api/confession-bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newBanUserId.trim(), reason: newBanReason.trim() }),
    });
    if (res.ok) { setNewBanUserId(''); setNewBanReason(''); showToast('Ban hinzugefügt'); loadBans(); }
    else showToast('Fehler', 'error');
  }

  async function removeBan(userId: string) {
    const res = await fetch(`/api/confession-bans/${userId}`, { method: 'DELETE' });
    if (res.ok) { showToast('Ban entfernt'); loadBans(); }
    else showToast('Fehler', 'error');
  }

  const tabs: { key: TabStatus | 'bans'; label: string }[] = [
    { key: 'pending_review', label: 'Wartend' },
    { key: 'published', label: 'Veröffentlicht' },
    { key: 'rejected', label: 'Abgelehnt' },
    { key: 'bans', label: 'Bans' },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>Confessions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Anonyme Geständnisse moderieren · Nur für Administratoren</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className="px-4 py-1.5 rounded-full text-sm font-medium"
            style={{
              background: tab === t.key ? 'var(--amber-bg)' : 'var(--bg-elevated)',
              border: `1px solid ${tab === t.key ? 'rgba(251,191,36,0.3)' : 'var(--border-default)'}`,
              color: tab === t.key ? 'var(--amber)' : 'var(--text-secondary)',
            }}
          >
            {t.label}
            {t.key === 'pending_review' && total > 0 && tab === 'pending_review' && (
              <span className="ml-2 text-xs font-bold">{total}</span>
            )}
          </button>
        ))}
      </div>

      {/* Confession list */}
      {tab !== 'bans' && (
        <div className="space-y-3">
          {loading && <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Lade…</p>}
          {!loading && confessions.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Einträge.</div>
          )}
          {confessions.map((c) => (
            <div key={c.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  #{c.number} · {relativeTime(c.createdAt)} · Anonym
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{c.content}</p>
              {tab === 'pending_review' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(c.id, 'published')}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: 'var(--emerald-bg)', border: '1px solid rgba(52,211,153,0.3)', color: 'var(--emerald)' }}>
                    ✓ Genehmigen
                  </button>
                  <button onClick={() => updateStatus(c.id, 'rejected')}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
                    ✗ Ablehnen
                  </button>
                  <button onClick={() => handleBan(c.id)}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                    ⊘ Ban
                  </button>
                </div>
              )}
            </div>
          ))}
          {pages > 1 && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Seite {page} von {pages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded text-xs"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: page === 1 ? 0.4 : 1 }}>
                  ← Zurück
                </button>
                <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded text-xs"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: page === pages ? 0.4 : 1 }}>
                  Weiter →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bans tab */}
      {tab === 'bans' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Ban hinzufügen</h3>
            <div className="flex gap-2 flex-wrap">
              <input value={newBanUserId} onChange={(e) => setNewBanUserId(e.target.value)} placeholder="User-ID…"
                className="px-3 py-1.5 rounded text-sm font-mono"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', width: '200px' }} />
              <input value={newBanReason} onChange={(e) => setNewBanReason(e.target.value)} placeholder="Grund (optional)…"
                className="px-3 py-1.5 rounded text-sm flex-1"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', minWidth: '160px' }} />
              <button onClick={addBan}
                className="px-4 py-1.5 rounded text-sm font-medium"
                style={{ background: 'var(--amber)', color: '#000' }}>
                Hinzufügen
              </button>
            </div>
          </div>

          <div className="panel overflow-hidden">
            {bans.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Bans.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['User-ID', 'Grund', 'Datum', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bans.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{b.userId}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{b.reason ?? '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{relativeTime(b.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeBan(b.userId)}
                          className="px-2.5 py-1 rounded text-xs"
                          style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
                          Entfernen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {toastElement}
    </div>
  );
}
