'use client';

import { useState } from 'react';

const DURATION_OPTIONS = [
  { label: '10 Minuten', value: 10 * 60 * 1000 },
  { label: '30 Minuten', value: 30 * 60 * 1000 },
  { label: '1 Stunde', value: 60 * 60 * 1000 },
  { label: '6 Stunden', value: 6 * 60 * 60 * 1000 },
  { label: '12 Stunden', value: 12 * 60 * 60 * 1000 },
  { label: '1 Tag', value: 24 * 60 * 60 * 1000 },
  { label: '7 Tage', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '28 Tage', value: 28 * 24 * 60 * 60 * 1000 },
];

interface TimeoutModalProps {
  userId: string;
  username: string;
  onClose: () => void;
  onSuccess: (expiresAt: string) => void;
}

export function TimeoutModal({ userId, username, onClose, onSuccess }: TimeoutModalProps) {
  const [durationMs, setDurationMs] = useState(DURATION_OPTIONS[2].value);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/moderation/timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, durationMs, reason: reason || 'Kein Grund angegeben' }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Fehler beim Verhängen des Timeouts');
        return;
      }
      const data = await res.json() as { caseId: string; expiresAt: string };
      onSuccess(data.expiresAt);
      onClose();
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl p-6 w-full max-w-md"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
      >
        <h2 className="text-display text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          ⏱️ Timeout verhängen — {username}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Dauer
            </label>
            <select
              value={durationMs}
              onChange={(e) => setDurationMs(Number(e.target.value))}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              {DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Grund (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Kein Grund angegeben"
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          {error && (
            <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--amber)', color: '#000', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Wird angewendet…' : 'Timeout verhängen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
