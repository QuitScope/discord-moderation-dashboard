'use client';

import { useState, useEffect, useCallback } from 'react';
import { TimeoutModal } from '@/components/TimeoutModal';
import { Pagination } from '@/components/Pagination';
import { useToast } from '@/components/ui/useToast';
import { discordAvatarUrl } from '@/lib/discord-avatar';
import { relativeDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';

interface Member {
  id: string;
  activePoints: number;
  caseCount: number;
  createdAt: string;
  username: string | null;
  globalName: string | null;
  avatar: string | null;
  activeTimeoutUntil: string | null;
}

interface MembersResponse {
  users: Member[];
  total: number;
  page: number;
  pages: number;
}

const TIMEOUT_OPTIONS = [
  { label: '10 Min', value: 10 * 60 * 1000 },
  { label: '1 Std', value: 60 * 60 * 1000 },
  { label: '1 Tag', value: 24 * 60 * 60 * 1000 },
  { label: '7 Tage', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '28 Tage', value: 28 * 24 * 60 * 60 * 1000 },
];

function pointsColor(pts: number, threshold: number): string {
  if (pts === 0) return 'var(--emerald)';
  if (pts >= threshold) return 'var(--red)';
  return 'var(--amber)';
}

export default function MembersPage() {
  const [data, setData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'points' | 'critical'>('all');
  const [sort, setSort] = useState('points');
  const [page, setPage] = useState(1);
  const [timeoutTarget, setTimeoutTarget] = useState<{ id: string; username: string } | null>(null);
  const threshold = 7;

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [timeoutDuration, setTimeoutDuration] = useState(TIMEOUT_OPTIONS[1].value);

  // Bulk ban by ID panel
  const [showBulkBanPanel, setShowBulkBanPanel] = useState(false);
  const [bulkBanText, setBulkBanText] = useState('');

  // Toast
  const { showToast, toastElement } = useToast(3000);

  const minPoints = filter === 'points' ? 1 : filter === 'critical' ? threshold : 0;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '50',
      search,
      minPoints: String(minPoints),
      sort,
    });
    fetch(`/api/members?${params}`)
      .then((r) => r.json())
      .then((d: MembersResponse) => { if (d.users) setData(d); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [page, search, minPoints, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSelectedIds(new Set()); }, [page, search, filter, sort]);

  function applySearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!data?.users) return;
    const allSelected = data.users.length > 0 && data.users.every((m) => selectedIds.has(m.id));
    setSelectedIds(allSelected ? new Set() : new Set(data.users.map((m) => m.id)));
  }

  async function bulkKick() {
    if (!confirm(`${selectedIds.size} Mitglieder kicken?`)) return;
    setBulkWorking(true);
    let done = 0;
    for (const id of selectedIds) {
      await fetch(`/api/members/${id}`, { method: 'DELETE' }).catch(() => null);
      done++;
    }
    setBulkWorking(false);
    setSelectedIds(new Set());
    showToast(`${done} Mitglieder gekickt`);
    load();
  }

  async function bulkBan() {
    if (!confirm(`${selectedIds.size} Mitglieder bannen?`)) return;
    setBulkWorking(true);
    try {
      const res = await fetch('/api/members/bulk-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedIds) }),
      });
      const result = (await res.json()) as { banned_users?: string[]; failed_users?: string[] };
      if (res.ok) {
        showToast(`${result.banned_users?.length ?? 0} gebannt, ${result.failed_users?.length ?? 0} fehlgeschlagen`);
      } else {
        showToast('Fehler beim Bannen', 'error');
      }
    } catch {
      showToast('Fehler beim Bannen', 'error');
    } finally {
      setBulkWorking(false);
      setSelectedIds(new Set());
      load();
    }
  }

  async function bulkTimeout() {
    if (!confirm(`${selectedIds.size} Mitglieder timeouten?`)) return;
    setBulkWorking(true);
    let done = 0;
    for (const id of selectedIds) {
      await fetch('/api/moderation/timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: id, durationMs: timeoutDuration, reason: 'Bulk Timeout' }),
      }).catch(() => null);
      done++;
    }
    setBulkWorking(false);
    setSelectedIds(new Set());
    showToast(`${done} Timeouts gesetzt`);
    load();
  }

  const parsedBulkBanIds = bulkBanText
    .split(/[\s,\n]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d{17,20}$/.test(s));

  async function doBulkBanByIds() {
    if (parsedBulkBanIds.length === 0) return;
    if (!confirm(`${parsedBulkBanIds.length} IDs bannen?`)) return;
    setBulkWorking(true);
    try {
      const res = await fetch('/api/members/bulk-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: parsedBulkBanIds }),
      });
      const result = (await res.json()) as { banned_users?: string[]; failed_users?: string[] };
      if (res.ok) {
        showToast(`${result.banned_users?.length ?? 0} gebannt, ${result.failed_users?.length ?? 0} fehlgeschlagen`);
        setBulkBanText('');
        setShowBulkBanPanel(false);
      } else {
        showToast('Fehler beim Bannen', 'error');
      }
    } catch {
      showToast('Fehler beim Bannen', 'error');
    } finally {
      setBulkWorking(false);
      load();
    }
  }

  const allSelected = !!data?.users?.length && data.users.every((m) => selectedIds.has(m.id));

  return (
    <>
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Members"
        subtitle={data ? `${data.total} Mitglieder` : 'Lade…'}
        actions={
          <button
            onClick={() => setShowBulkBanPanel((v) => !v)}
            className="px-3 py-1.5 rounded-md text-xs font-medium mt-1"
            style={{ background: showBulkBanPanel ? 'var(--red-bg)' : 'var(--bg-elevated)', border: `1px solid ${showBulkBanPanel ? 'rgba(248,113,113,0.3)' : 'var(--border-default)'}`, color: showBulkBanPanel ? 'var(--red)' : 'var(--text-secondary)' }}
          >
            🔨 Bulk Ban
          </button>
        }
      />

      {/* Bulk Ban by ID panel */}
      {showBulkBanPanel && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(248,113,113,0.3)' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Bulk Ban per ID-Liste</div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Discord User-IDs eingeben (durch Leerzeichen, Komma oder Zeilenumbruch trennen)
          </div>
          <textarea
            value={bulkBanText}
            onChange={(e) => setBulkBanText(e.target.value)}
            rows={4}
            placeholder="123456789012345678&#10;234567890123456789&#10;..."
            className="w-full px-3 py-2 rounded-md text-xs mb-3 resize-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          />
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {parsedBulkBanIds.length} gültige ID{parsedBulkBanIds.length !== 1 ? 's' : ''} erkannt
            </span>
            <button
              onClick={doBulkBanByIds}
              disabled={parsedBulkBanIds.length === 0 || bulkWorking}
              className="px-4 py-1.5 rounded-md text-xs font-bold"
              style={{ background: 'var(--red)', color: '#fff', opacity: (parsedBulkBanIds.length === 0 || bulkWorking) ? 0.5 : 1 }}
            >
              {bulkWorking ? 'Banne…' : `${parsedBulkBanIds.length} bannen`}
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder="Username oder User-ID…"
            className="px-3 py-1.5 rounded-md text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', width: '240px' }}
          />
          <button onClick={applySearch} className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
            Suchen
          </button>
        </div>
        <div className="flex gap-1">
          {(['all', 'points', 'critical'] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }} className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: filter === f ? 'var(--amber-bg)' : 'var(--bg-elevated)', border: `1px solid ${filter === f ? 'rgba(251,191,36,0.3)' : 'var(--border-default)'}`, color: filter === f ? 'var(--amber)' : 'var(--text-secondary)' }}>
              {f === 'all' ? 'Alle' : f === 'points' ? 'Hat Punkte' : 'Kritisch'}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-md text-sm"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
          <option value="points">Punkte ↓</option>
          <option value="cases">Cases ↓</option>
          <option value="joinedAt">Beigetreten ↓</option>
        </select>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              <th className="px-3 py-3 w-8">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                  className="rounded" style={{ accentColor: 'var(--indigo)', cursor: 'pointer' }} />
              </th>
              {['Mitglied', 'Punkte', 'Cases', 'Dabei seit', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Lade…</td></tr>
            ) : !data?.users?.length ? (
              <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Mitglieder gefunden.</td></tr>
            ) : data.users.map((m) => (
              <tr key={m.id}
                style={{ borderBottom: '1px solid var(--border-subtle)', background: selectedIds.has(m.id) ? 'color-mix(in srgb, var(--indigo) 6%, transparent)' : 'transparent' }}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)}
                    className="rounded" style={{ accentColor: 'var(--indigo)', cursor: 'pointer' }} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={discordAvatarUrl(m.id, m.avatar)} alt="" width={28} height={28} className="rounded-full" style={{ flexShrink: 0 }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {m.globalName ?? m.username ?? 'Unbekannt'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold" style={{ color: pointsColor(m.activePoints, threshold) }}>{m.activePoints}</span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{m.caseCount}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{relativeDate(m.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.activeTimeoutUntil && new Date(m.activeTimeoutUntil) > new Date() && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(254,231,92,0.15)', color: 'var(--amber)', border: '1px solid rgba(254,231,92,0.4)' }}
                        title={`Timeout bis ${new Date(m.activeTimeoutUntil).toLocaleString('de-DE')}`}>
                        ⏱️ Timeout
                      </span>
                    )}
                    <button onClick={() => setTimeoutTarget({ id: m.id, username: m.username ?? m.id })}
                      className="text-xs px-2.5 py-1 rounded"
                      style={{ background: 'rgba(254,231,92,0.1)', border: '1px solid rgba(254,231,92,0.3)', color: 'var(--amber)' }}>
                      ⏱️
                    </button>
                    <a href={`/dashboard/users/${m.id}`} className="text-xs px-2.5 py-1 rounded"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                      Profil
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-default)' }}>
            <Pagination page={data.page} totalPages={data.pages} total={data.total} onPage={setPage} />
          </div>
        )}
      </div>
    </div>

    {/* Bulk action bar */}
    {selectedIds.size > 0 && (
      <div className="fixed bottom-0 left-0 right-0 z-50 px-6 py-3 flex items-center gap-4 flex-wrap"
        style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--indigo)', boxShadow: '0 -4px 24px rgba(0,0,0,0.4)' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--indigo-bright)', minWidth: '100px' }}>
          {selectedIds.size} ausgewählt
        </span>
        <button onClick={bulkKick} disabled={bulkWorking}
          className="px-3 py-1.5 rounded-md text-xs font-bold"
          style={{ background: 'var(--amber-bg)', border: '1px solid rgba(251,191,36,0.3)', color: 'var(--amber)', opacity: bulkWorking ? 0.5 : 1 }}>
          Kicken
        </button>
        <button onClick={bulkBan} disabled={bulkWorking}
          className="px-3 py-1.5 rounded-md text-xs font-bold"
          style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)', opacity: bulkWorking ? 0.5 : 1 }}>
          Bannen
        </button>
        <div className="flex items-center gap-2">
          <select value={timeoutDuration} onChange={(e) => setTimeoutDuration(Number(e.target.value))}
            className="px-2 py-1.5 rounded-md text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
            {TIMEOUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={bulkTimeout} disabled={bulkWorking}
            className="px-3 py-1.5 rounded-md text-xs font-bold"
            style={{ background: 'rgba(254,231,92,0.1)', border: '1px solid rgba(254,231,92,0.3)', color: 'var(--amber)', opacity: bulkWorking ? 0.5 : 1 }}>
            Timeout
          </button>
        </div>
        <button onClick={() => setSelectedIds(new Set())}
          className="ml-auto px-3 py-1.5 rounded-md text-xs"
          style={{ color: 'var(--text-muted)' }}>
          Abbrechen
        </button>
      </div>
    )}

    {timeoutTarget && (
      <TimeoutModal
        userId={timeoutTarget.id}
        username={timeoutTarget.username}
        onClose={() => setTimeoutTarget(null)}
        onSuccess={() => { setTimeoutTarget(null); load(); }}
      />
    )}

    {toastElement}
    </>
  );
}
