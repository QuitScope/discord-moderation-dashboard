'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';

interface PointsConfig {
  pointsPerBump: number;
  countingRescueEnabled: boolean;
  countingRescueCost: number;
  countingRescueMessage: string | null;
  failTierRedeemEnabled: boolean;
  failTierRedeemCost: number;
  failTierRedeemMessage: string | null;
  pointsPerWortketteWord: number;
  wortketteDailyPointsCap: number;
}

const cardStyle: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border-default)' };
const fieldStyle: React.CSSProperties = { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' };
const fieldClass = 'px-3 py-2 rounded-lg text-sm outline-none';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0 cursor-pointer"
      style={{ background: checked ? 'var(--emerald)' : 'var(--border-default)' }}
    >
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: checked ? '18px' : '2px' }} />
    </div>
  );
}

export default function PointsPage() {
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [draft, setDraft] = useState<PointsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast: show, toastElement } = useToast();

  const load = useCallback(async () => {
    const res = await fetch('/api/points/config', { cache: 'no-store' });
    if (res.ok) {
      const c: PointsConfig = await res.json();
      setConfig(c);
      setDraft(c);
    } else {
      show('Punkte-Konfiguration konnte nicht geladen werden.', 'error');
    }
  }, [show]);

  useEffect(() => {
    load().catch(() => show('Konnte Punkte-Konfiguration nicht laden.', 'error')).finally(() => setLoading(false));
  }, [load, show]);

  async function toggleField(field: 'countingRescueEnabled' | 'failTierRedeemEnabled', enabled: boolean) {
    if (!draft) return;
    const previous = draft;
    const next = { ...draft, [field]: enabled };
    setDraft(next);
    setConfig(next);
    try {
      const res = await fetch('/api/points/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: enabled }),
      });
      if (!res.ok) throw new Error();
      const updated: PointsConfig = await res.json();
      setConfig(updated);
      setDraft(updated);
    } catch {
      show('Fehler beim Umschalten.', 'error');
      setConfig(previous);
      setDraft(previous);
    }
  }

  async function save() {
    if (!draft) return;
    const previous = config;
    setSaving(true);
    try {
      const res = await fetch('/api/points/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsPerBump: draft.pointsPerBump,
          countingRescueEnabled: draft.countingRescueEnabled,
          countingRescueCost: draft.countingRescueCost,
          countingRescueMessage: draft.countingRescueMessage,
          failTierRedeemEnabled: draft.failTierRedeemEnabled,
          failTierRedeemCost: draft.failTierRedeemCost,
          failTierRedeemMessage: draft.failTierRedeemMessage,
          pointsPerWortketteWord: draft.pointsPerWortketteWord,
          wortketteDailyPointsCap: draft.wortketteDailyPointsCap,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Fehler beim Speichern.');
      }
      const updated: PointsConfig = await res.json();
      setConfig(updated);
      setDraft(updated);
      show('Einstellungen gespeichert');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Fehler beim Speichern.', 'error');
      if (previous) {
        setConfig(previous);
        setDraft(previous);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade Punkte-System…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in">
      {toastElement}
      <div className="mb-2">
        <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>Punkte-System</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Bump-Belohnung, Wortkette, Verzähl-Rettung und Fail-Tier-Freikauf konfigurieren</p>
      </div>

      <div className="rounded-lg p-4 space-y-4" style={cardStyle}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Bump-Belohnung</h2>
        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Punkte pro Bump</label>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={draft.pointsPerBump}
            onChange={(e) => setDraft((d) => d && { ...d, pointsPerBump: e.target.value === '' ? 0 : Number(e.target.value) })}
            className={`w-full ${fieldClass}`}
            style={fieldStyle}
          />
        </div>
      </div>

      <div className="rounded-lg p-4 space-y-4" style={cardStyle}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Wortkette</h2>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Nur „besondere" Wörter zahlen ein (Wochenthema-Treffer, lange Wörter, Spezial-Sprüche-Trigger). 0 = aus.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Punkte pro besonderem Wort</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.pointsPerWortketteWord}
              onChange={(e) => setDraft((d) => d && { ...d, pointsPerWortketteWord: e.target.value === '' ? 0 : Number(e.target.value) })}
              className={`w-full ${fieldClass}`}
              style={fieldStyle}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Tageslimit pro Nutzer</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.wortketteDailyPointsCap}
              onChange={(e) => setDraft((d) => d && { ...d, wortketteDailyPointsCap: e.target.value === '' ? 0 : Number(e.target.value) })}
              className={`w-full ${fieldClass}`}
              style={fieldStyle}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4 space-y-4" style={cardStyle}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Verzähl-Rettung</h2>
          <Toggle checked={draft.countingRescueEnabled} onChange={(v) => toggleField('countingRescueEnabled', v)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Kosten (Punkte)</label>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={draft.countingRescueCost}
            onChange={(e) => setDraft((d) => d && { ...d, countingRescueCost: e.target.value === '' ? 0 : Number(e.target.value) })}
            className={`w-full ${fieldClass}`}
            style={fieldStyle}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Nachricht</label>
          <textarea
            value={draft.countingRescueMessage ?? ''}
            onChange={(e) => setDraft((d) => d && { ...d, countingRescueMessage: e.target.value })}
            rows={3}
            className={`w-full ${fieldClass}`}
            style={fieldStyle}
          />
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Verfügbare Platzhalter: {'{{usermention}}'}, {'{{cost}}'}, {'{{balance}}'}, {'{{nextnumber}}'}
          </p>
        </div>
      </div>

      <div className="rounded-lg p-4 space-y-4" style={cardStyle}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Fail-Tier-Freikauf</h2>
          <Toggle checked={draft.failTierRedeemEnabled} onChange={(v) => toggleField('failTierRedeemEnabled', v)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Kosten (Punkte)</label>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={draft.failTierRedeemCost}
            onChange={(e) => setDraft((d) => d && { ...d, failTierRedeemCost: e.target.value === '' ? 0 : Number(e.target.value) })}
            className={`w-full ${fieldClass}`}
            style={fieldStyle}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Nachricht</label>
          <textarea
            value={draft.failTierRedeemMessage ?? ''}
            onChange={(e) => setDraft((d) => d && { ...d, failTierRedeemMessage: e.target.value })}
            rows={3}
            className={`w-full ${fieldClass}`}
            style={fieldStyle}
          />
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Verfügbare Platzhalter: {'{{cost}}'}, {'{{balance}}'}
          </p>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded-lg text-xs font-bold"
        style={{ background: 'var(--emerald-bg)', color: 'var(--emerald)', border: '1px solid rgba(52,211,153,0.2)' }}
      >
        {saving ? 'Speichert…' : 'Speichern'}
      </button>
    </div>
  );
}
