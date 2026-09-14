'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

interface WebhookUser {
  id: string;
  username: string;
  global_name: string | null;
}

interface Webhook {
  id: string;
  type: 1 | 2 | 3;
  channel_id: string;
  name: string;
  avatar: string | null;
  user?: WebhookUser;
}

interface DiscordChannel {
  id: string;
  name: string;
}

const WEBHOOK_TYPE: Record<number, string> = {
  1: 'Incoming',
  2: 'Bot',
  3: 'Channel Follower',
};

function avatarUrl(webhook: Webhook): string {
  if (webhook.avatar) {
    return `https://cdn.discordapp.com/avatars/${webhook.id}/${webhook.avatar}.png?size=64`;
  }
  return `https://cdn.discordapp.com/embed/avatars/0.png`;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [channelMap, setChannelMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const { showToast, toastElement } = useToast();

  const [createName, setCreateName] = useState('');
  const [createChannelId, setCreateChannelId] = useState('');
  const [creating, setCreating] = useState(false);


  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [webhookRes, channelRes] = await Promise.all([
        fetch('/api/webhooks', { cache: 'no-store' }),
        fetch('/api/channels', { cache: 'no-store' }),
      ]);
      if (!webhookRes.ok) throw new Error(`${webhookRes.status}`);
      const data = (await webhookRes.json()) as Webhook[];
      setWebhooks(Array.isArray(data) ? data : []);
      if (channelRes.ok) {
        const channels = (await channelRes.json()) as DiscordChannel[];
        if (Array.isArray(channels)) {
          setChannelMap(new Map(channels.map((c) => [c.id, c.name])));
        }
      }
    } catch {
      setError('Webhooks konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createWebhook() {
    if (!createName.trim() || !createChannelId.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: createChannelId.trim(), name: createName.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? 'Fehler');
      }
      showToast('Webhook erstellt');
      setCreateName('');
      setCreateChannelId('');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Fehler beim Erstellen', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function deleteWebhook(id: string, name: string) {
    if (!confirm(`Webhook "${name}" wirklich löschen?`)) return;
    setActioning(id);
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Webhook gelöscht');
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch {
      showToast('Fehler beim Löschen', 'error');
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Webhooks"
        subtitle="Webhooks im Server verwalten"
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

      {/* Create form */}
      <div className="panel p-5">
        <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Webhook erstellen</div>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Name"
            className="px-3 py-1.5 rounded-md text-sm flex-1 min-w-32"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
          <input
            type="text"
            value={createChannelId}
            onChange={(e) => setCreateChannelId(e.target.value)}
            placeholder="Kanal-ID"
            className="px-3 py-1.5 rounded-md text-sm w-48"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          />
          <button
            onClick={createWebhook}
            disabled={creating || !createName.trim() || !createChannelId.trim()}
            className="px-4 py-1.5 rounded-md text-sm font-bold"
            style={{ background: 'var(--indigo)', color: '#fff', opacity: (creating || !createName.trim() || !createChannelId.trim()) ? 0.5 : 1 }}
          >
            {creating ? 'Erstelle…' : '+ Erstellen'}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade Webhooks…</div>
        </div>
      ) : error ? (
        <div className="text-sm px-4 py-3 rounded-lg" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
          Keine Webhooks gefunden.
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Webhook', 'Kanal', 'Typ', 'Erstellt von', 'Aktion'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook, i) => (
                <tr key={webhook.id}
                  style={{ borderBottom: i < webhooks.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl(webhook)}
                        alt=""
                        width={28} height={28}
                        className="rounded-full shrink-0"
                        style={{ background: 'var(--bg-card)' }}
                      />
                      <span className="font-medium truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
                        {webhook.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {webhook.channel_id ? (
                      <span
                        title={webhook.channel_id}
                        className="cursor-default"
                        style={{ fontFamily: channelMap.has(webhook.channel_id) ? 'inherit' : 'var(--font-mono)' }}
                      >
                        #{channelMap.get(webhook.channel_id) ?? webhook.channel_id}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--indigo-bg)', color: 'var(--indigo-bright)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {WEBHOOK_TYPE[webhook.type] ?? `Typ ${webhook.type}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {webhook.user?.global_name ?? webhook.user?.username ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteWebhook(webhook.id, webhook.name)}
                      disabled={actioning === webhook.id}
                      className="px-2.5 py-1 rounded text-xs font-medium"
                      style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--red)', opacity: actioning === webhook.id ? 0.5 : 1 }}
                    >
                      Löschen
                    </button>
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
