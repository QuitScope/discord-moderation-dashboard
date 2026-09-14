'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

interface PermissionOverwrite {
  id: string;
  type: 0 | 1;
  allow: string;
  deny: string;
}

interface GuildChannel {
  id: string;
  type: number;
  name: string;
  guild_id: string;
  position: number;
  rate_limit_per_user: number;
  permission_overwrites: PermissionOverwrite[];
}

const TEXT_TYPES = new Set([0, 5]); // GUILD_TEXT, GUILD_ANNOUNCEMENT

function isLocked(channel: GuildChannel): boolean {
  const overwrite = channel.permission_overwrites?.find(
    (o) => o.id === channel.guild_id && o.type === 0,
  );
  if (!overwrite?.deny) return false;
  return (Number(overwrite.deny) & 2048) === 2048;
}

function formatSlowmode(s: number): string {
  if (s === 0) return 'Aus';
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

const PRESETS = [0, 5, 10, 30, 60, 300, 3600, 21600];
const PRESET_LABELS = ['Aus', '5s', '10s', '30s', '1m', '5m', '1h', '6h'];

export default function ChannelsPage() {
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slowmodeDrafts, setSlowmodeDrafts] = useState<Record<string, number>>({});
  const [savingSlowmode, setSavingSlowmode] = useState<string | null>(null);
  const [togglingLock, setTogglingLock] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [purgeCounts, setPurgeCounts] = useState<Record<string, number>>({});
  const [purging, setPurging] = useState<string | null>(null);
  const { showToast, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/channels', { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as GuildChannel[];
      const text = Array.isArray(data)
        ? data.filter((c) => TEXT_TYPES.has(c.type)).sort((a, b) => a.position - b.position)
        : [];
      setChannels(text);
      const drafts: Record<string, number> = {};
      const counts: Record<string, number> = {};
      for (const c of text) {
        drafts[c.id] = c.rate_limit_per_user ?? 0;
        counts[c.id] = 50;
      }
      setSlowmodeDrafts(drafts);
      setPurgeCounts(counts);
    } catch {
      setError('Kanäle konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveSlowmode(channelId: string) {
    const seconds = slowmodeDrafts[channelId] ?? 0;
    setSavingSlowmode(channelId);
    try {
      const res = await fetch(`/api/channels/${channelId}/slowmode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds }),
      });
      if (!res.ok) throw new Error();
      setSaved(channelId);
      setTimeout(() => setSaved(null), 1500);
      setChannels((prev) =>
        prev.map((c) => c.id === channelId ? { ...c, rate_limit_per_user: seconds } : c)
      );
    } catch {
      showToast('Fehler beim Setzen des Slowmodes', 'error');
    } finally {
      setSavingSlowmode(null);
    }
  }

  async function purgeChannel(channelId: string) {
    const count = purgeCounts[channelId] ?? 50;
    setPurging(channelId);
    try {
      const res = await fetch(`/api/channels/${channelId}/purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      showToast(`${data.deleted ?? count} Nachrichten gelöscht`);
    } catch {
      showToast('Fehler beim Löschen der Nachrichten', 'error');
    } finally {
      setPurging(null);
    }
  }

  async function toggleLock(channel: GuildChannel) {
    const locked = isLocked(channel);
    setTogglingLock(channel.id);
    try {
      const res = await fetch(`/api/channels/${channel.id}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !locked }),
      });
      if (!res.ok) throw new Error();
      showToast(locked ? 'Kanal entsperrt' : 'Kanal gesperrt');
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id !== channel.id) return c;
          const withoutEvery = (c.permission_overwrites ?? []).filter(
            (o) => !(o.id === c.guild_id && o.type === 0),
          );
          const newOverwrite: PermissionOverwrite = {
            id: c.guild_id,
            type: 0,
            allow: '0',
            deny: locked ? '0' : '2048',
          };
          return { ...c, permission_overwrites: [...withoutEvery, newOverwrite] };
        })
      );
    } catch {
      showToast('Fehler beim Sperren des Kanals', 'error');
    } finally {
      setTogglingLock(null);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Kanäle"
        subtitle="Slowmode und Sperren pro Kanal verwalten"
        actions={
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: loading ? 0.6 : 1 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Aktualisieren
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade Kanäle…</div>
        </div>
      ) : error ? (
        <div className="text-sm px-4 py-3 rounded-lg" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Textkanäle gefunden.</div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Kanal', 'Slowmode', 'Gesperrt', 'Nachrichten löschen'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map((channel, i) => {
                const locked = isLocked(channel);
                const draft = slowmodeDrafts[channel.id] ?? 0;
                const currentSaved = channel.rate_limit_per_user ?? 0;
                const isDirty = draft !== currentSaved;
                const isSaving = savingSlowmode === channel.id;
                const isToggling = togglingLock === channel.id;
                const justSaved = saved === channel.id;
                const isPurging = purging === channel.id;
                const purgeCount = purgeCounts[channel.id] ?? 50;

                return (
                  <tr key={channel.id}
                    style={{ borderBottom: i < channels.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: locked ? 'var(--red)' : 'var(--text-primary)' }}>
                        {locked ? '🔒' : '#'} {channel.name}
                      </span>
                      {channel.type === 5 && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--indigo-bg)', color: 'var(--indigo-bright)' }}>NEWS</span>
                      )}
                    </td>

                    {/* Slowmode */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={PRESETS.includes(draft) ? draft : ''}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setSlowmodeDrafts((prev) => ({ ...prev, [channel.id]: v }));
                          }}
                          className="px-2 py-1 rounded-md text-xs"
                          style={{ background: 'var(--bg-card)', border: `1px solid ${isDirty ? 'var(--amber)' : 'var(--border-default)'}`, color: 'var(--text-primary)' }}>
                          {PRESETS.map((p, pi) => (
                            <option key={p} value={p}>{PRESET_LABELS[pi]}</option>
                          ))}
                          {!PRESETS.includes(draft) && (
                            <option value="">{formatSlowmode(draft)}</option>
                          )}
                        </select>
                        <input
                          type="number" min={0} max={21600}
                          value={draft}
                          onChange={(e) => setSlowmodeDrafts((prev) => ({ ...prev, [channel.id]: Math.min(21600, Math.max(0, parseInt(e.target.value) || 0)) }))}
                          className="w-16 px-2 py-1 rounded-md text-xs text-center"
                          style={{ background: 'var(--bg-card)', border: `1px solid ${isDirty ? 'var(--amber)' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                        />
                        {isDirty ? (
                          <button onClick={() => saveSlowmode(channel.id)} disabled={isSaving}
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{ background: 'var(--indigo)', color: '#fff', opacity: isSaving ? 0.6 : 1 }}>
                            {isSaving ? '…' : 'Setzen'}
                          </button>
                        ) : justSaved ? (
                          <span className="text-xs" style={{ color: 'var(--emerald)' }}>✓</span>
                        ) : null}
                      </div>
                    </td>

                    {/* Lock */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleLock(channel)}
                        disabled={isToggling}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                        style={{
                          background: locked ? 'var(--red)' : 'var(--bg-card)',
                          border: `1px solid ${locked ? 'var(--red)' : 'var(--border-default)'}`,
                          opacity: isToggling ? 0.5 : 1,
                        }}
                        aria-pressed={locked}>
                        <span className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
                          style={{ transform: locked ? 'translateX(18px)' : 'translateX(2px)' }} />
                      </button>
                    </td>

                    {/* Purge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={1} max={100}
                          value={purgeCount}
                          onChange={(e) => setPurgeCounts((prev) => ({ ...prev, [channel.id]: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) }))}
                          className="w-14 px-2 py-1 rounded-md text-xs text-center"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                        />
                        <button
                          onClick={() => purgeChannel(channel.id)}
                          disabled={isPurging}
                          className="px-2 py-1 rounded text-xs font-bold"
                          style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)', opacity: isPurging ? 0.6 : 1 }}>
                          {isPurging ? '…' : 'Löschen'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {toastElement}
    </div>
  );
}
