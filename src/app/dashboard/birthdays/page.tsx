'use client';

import { useState, useEffect, useCallback } from 'react';
import { discordAvatarUrl } from '@/lib/discord-avatar';
import { Pagination } from '@/components/Pagination';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

interface BirthdayEntry {
  userId: string;
  day: number;
  month: number;
  year: number | null;
}

interface DiscordUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function daysUntilBirthday(day: number, month: number): number {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), month - 1, day);
  const nextYear = new Date(now.getFullYear() + 1, month - 1, day);
  const target = thisYear >= now ? thisYear : nextYear;
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function isToday(day: number, month: number): boolean {
  const now = new Date();
  return now.getDate() === day && now.getMonth() + 1 === month;
}

interface BirthdaysResponse {
  data: BirthdayEntry[];
  total: number;
  page: number;
  pages: number;
}

export default function BirthdaysPage() {
  const [birthdays, setBirthdays] = useState<BirthdayEntry[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; pages: number }>({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [userMap, setUserMap] = useState<Map<string, DiscordUser>>(new Map());
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/birthdays?page=${page}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as BirthdaysResponse;
      const data = Array.isArray(json.data) ? json.data : [];
      setBirthdays(data);
      setMeta({ total: json.total ?? 0, page: json.page ?? 1, pages: json.pages ?? 1 });

      if (data.length > 0) {
        const ids = data.map((b) => b.userId).join(',');
        const uRes = await fetch(`/api/discord/users?ids=${encodeURIComponent(ids)}`, { cache: 'no-store' });
        if (uRes.ok) {
          const users = (await uRes.json()) as DiscordUser[];
          const map = new Map<string, DiscordUser>();
          for (const u of users) map.set(u.id, u);
          setUserMap(map);
        }
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function deleteBirthday(userId: string) {
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/birthdays/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Geburtstag gelöscht');
      load();
    } catch {
      showToast('Fehler beim Löschen', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Geburtstage"
        subtitle={loading ? 'Lade…' : `${meta.total} eingetragen`}
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
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade Geburtstage…</div>
        </div>
      ) : birthdays.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>
          Noch keine Geburtstage eingetragen.<br />
          <span className="text-xs mt-1 block">Mitglieder nutzen <code>/geburtstag setzen</code></span>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Mitglied', 'Datum', 'Alter', 'In'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {birthdays.map((b, i) => {
                const user = userMap.get(b.userId);
                const displayName = user?.globalName ?? user?.username ?? b.userId;
                const today = isToday(b.day, b.month);
                const days = daysUntilBirthday(b.day, b.month);
                const currentYear = new Date().getFullYear();
                const age = b.year ? (today ? currentYear - b.year : currentYear - b.year + (days > 0 ? 0 : 1)) : null;
                const isDeleting = deletingId === b.userId;

                return (
                  <tr key={b.userId}
                    style={{ borderBottom: i < birthdays.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: today ? 'color-mix(in srgb, #f47fff 5%, transparent)' : 'transparent' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={discordAvatarUrl(b.userId, user?.avatar ?? null)} alt="" width={28} height={28} className="rounded-full" style={{ flexShrink: 0 }} />
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                            {displayName}
                            {today && <span className="text-xs">🎂</span>}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{b.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: today ? '#f47fff' : 'var(--text-primary)' }}>
                        {b.day}. {MONTH_NAMES[b.month - 1]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {age !== null ? `${age} J.` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {today ? (
                        <span className="font-bold" style={{ color: '#f47fff' }}>Heute!</span>
                      ) : (
                        <span style={{ color: days <= 7 ? 'var(--amber)' : 'var(--text-muted)' }}>
                          {days}d
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteBirthday(b.userId)} disabled={isDeleting}
                        className="px-2 py-1 rounded text-xs"
                        style={{ color: 'var(--red)', opacity: isDeleting ? 0.5 : 1 }}
                        title="Löschen">
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta.pages > 1 && (
        <div className="mt-4">
          <Pagination page={meta.page} totalPages={meta.pages} total={meta.total} onPage={setPage} />
        </div>
      )}

      {toastElement}
    </div>
  );
}
