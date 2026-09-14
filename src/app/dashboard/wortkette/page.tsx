'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

interface AdminState {
  currentTheme: string | null;
  themeExpiresAt: string | null;
  currentStreak: number;
  highScore: number;
  lastWord: string | null;
  usedWordCount: number;
  themes: string[];
}

const inputStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
} as const;

const btnStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-secondary)',
} as const;

const dangerStyle = {
  background: 'var(--red-bg)',
  border: '1px solid rgba(248,113,113,0.4)',
  color: 'var(--red)',
} as const;

/** Date -> value for <input type="datetime-local"> in local time. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultExpiry() {
  return toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
}

export default function WortketteAdminPage() {
  const { showToast, toastElement } = useToast();
  const [state, setState] = useState<AdminState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [themeSel, setThemeSel] = useState('');
  const [expiry, setExpiry] = useState(defaultExpiry());
  const [announce, setAnnounce] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wortkette-admin');
      const data = await res.json();
      if (!res.ok || typeof data !== 'object' || Array.isArray(data)) throw new Error('request failed');
      setState(data);
      setThemeSel(data.currentTheme ?? '');
      if (data.themeExpiresAt) setExpiry(toLocalInput(new Date(data.themeExpiresAt)));
    } catch {
      showToast('Fehler beim Laden', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function post(path: string, okMsg: string, confirmMsg: string) {
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch(path, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) { showToast(data?.message ?? 'Fehler', 'error'); return; }
      showToast(okMsg);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function applyTheme() {
    setBusy(true);
    try {
      const res = await fetch('/api/wortkette-admin/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: themeSel || null,
          expiresAt: expiry ? new Date(expiry).toISOString() : null,
          announce,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { showToast(data?.message ?? 'Fehler beim Setzen des Themas', 'error'); return; }
      showToast(data?.announced ? 'Thema gesetzt + im Kanal angekündigt' : 'Thema gesetzt');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Wortkette-Admin"
        subtitle="Kette zurücksetzen und das aktive Wochenthema steuern"
      />

      {loading || !state ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade…</div>
        </div>
      ) : (
        <>
          <div className="panel p-4">
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              Status
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              {[
                ['Aktuelles Thema', state.currentTheme ?? '—'],
                ['Läuft ab', state.themeExpiresAt ? new Date(state.themeExpiresAt).toLocaleString('de-DE') : '—'],
                ['Aktuelle Streak', String(state.currentStreak)],
                ['Highscore', String(state.highScore)],
                ['Letztes Wort', state.lastWord ?? '—'],
                ['Benutzte Wörter', String(state.usedWordCount)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</dt>
                  <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel p-4">
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              Benutzte Wörter
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              „Sperren aufheben" macht alle bereits gespielten Wörter wieder spielbar, die Kette läuft weiter.
              „Kompletter Neustart" setzt zusätzlich Streak und aktuelles Wort zurück — der Highscore bleibt.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                disabled={busy}
                onClick={() => post(
                  '/api/wortkette-admin/reset-used-words',
                  'Sperren aufgehoben',
                  `Alle ${state.usedWordCount} benutzten Wörter wieder freigeben?`,
                )}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{ ...btnStyle, opacity: busy ? 0.5 : 1 }}
              >
                Nur Sperren aufheben
              </button>
              <button
                disabled={busy}
                onClick={() => post(
                  '/api/wortkette-admin/reset-chain',
                  'Kette komplett zurückgesetzt',
                  'Kompletter Neustart: benutzte Wörter löschen UND Streak + aktuelles Wort zurücksetzen?',
                )}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{ ...dangerStyle, opacity: busy ? 0.5 : 1 }}
              >
                Kompletter Neustart
              </button>
            </div>
          </div>

          <div className="panel p-4">
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              Thema / Event
            </div>
            <div className="flex flex-col gap-3 max-w-md">
              <label className="text-sm">
                <span className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Thema</span>
                <select
                  value={themeSel}
                  onChange={(e) => setThemeSel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="">— kein Thema —</option>
                  {state.themes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Läuft ab</span>
                <input
                  type="datetime-local"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} />
                Im Kanal ankündigen
              </label>
              <button
                disabled={busy}
                onClick={applyTheme}
                className="self-start px-3 py-2 rounded-lg text-sm font-medium"
                style={{ ...btnStyle, opacity: busy ? 0.5 : 1 }}
              >
                Übernehmen
              </button>
            </div>
          </div>
        </>
      )}
      {toastElement}
    </div>
  );
}
