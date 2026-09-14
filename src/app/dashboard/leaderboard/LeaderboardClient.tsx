'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Case } from '@/lib/api';
import {
  groupByUser,
  type UserStat, type ThreatLevel, type UserInfo,
} from '@/lib/analytics';
import { Pagination } from '@/components/Pagination';

type SortKey = 'totalPoints' | 'caseCount' | 'banCount' | 'threatLevel';

const THREAT_ORDER: ThreatLevel[] = ['niedrig', 'mittel', 'hoch', 'kritisch'];

const THREAT_STYLES: Record<ThreatLevel, { color: string; bg: string }> = {
  kritisch: { color: '#F87171', bg: 'rgba(248,113,113,0.10)' },
  hoch:     { color: '#FB923C', bg: 'rgba(251,146,60,0.10)'  },
  mittel:   { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)'  },
  niedrig:  { color: '#34D399', bg: 'rgba(52,211,153,0.10)'  },
};

function UserCell({ userId, userMap }: { userId: string; userMap: Record<string, UserInfo> }) {
  const info = userMap[userId];
  return (
    <div className="flex items-center gap-2">
      <img
        src={info?.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'}
        alt=""
        className="w-6 h-6 rounded-full shrink-0 object-cover"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
        {info?.name ?? userId.slice(0, 12) + '…'}
      </span>
    </div>
  );
}

interface LeaderboardClientProps {
  cases: Case[];
  userMap: Record<string, UserInfo>;
}

export function LeaderboardClient({ cases, userMap }: LeaderboardClientProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalPoints');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const userStats = useMemo(() => groupByUser(cases), [cases]);

  const sorted = useMemo(() => {
    let data = userStats;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((u) => {
        const name = userMap[u.userId]?.name?.toLowerCase() ?? '';
        return u.userId.includes(q) || name.includes(q);
      });
    }
    return [...data].sort((a, b) => {
      if (sortKey === 'threatLevel') {
        return THREAT_ORDER.indexOf(b.threatLevel) - THREAT_ORDER.indexOf(a.threatLevel);
      }
      return b[sortKey] - a[sortKey];
    });
  }, [userStats, sortKey, search, userMap]);

  const paginated = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize],
  );

  const SORT_BUTTONS: { key: SortKey; label: string }[] = [
    { key: 'totalPoints', label: 'Punkte'    },
    { key: 'caseCount',   label: 'Cases'     },
    { key: 'banCount',    label: 'Bans'      },
    { key: 'threatLevel', label: 'Bedrohung' },
  ];

  const maxPoints = sorted[0]?.totalPoints ?? 1;
  const globalOffset = (page - 1) * pageSize;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
          Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {userStats.length} Nutzer mit Einträgen
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          {SORT_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              onClick={() => { setSortKey(btn.key); setPage(1); }}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
              style={{
                background: sortKey === btn.key ? 'var(--indigo-bg)' : 'transparent',
                color: sortKey === btn.key ? 'var(--indigo-bright)' : 'var(--text-secondary)',
                border: `1px solid ${sortKey === btn.key ? 'rgba(99,102,241,0.35)' : 'var(--border-default)'}`,
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Name oder ID suchen…"
          className="px-3 py-1.5 rounded-md text-xs"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            minWidth: '180px',
          }}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Keine Einträge gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['#', 'Nutzer', 'Punkte', 'Cases', 'Bans', 'Bedrohung', 'Letzte Aktion'].map((h) => (
                    <th key={h}
                      className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, i) => {
                  const s = THREAT_STYLES[u.threatLevel];
                  const barWidth = Math.round((u.totalPoints / maxPoints) * 100);
                  return (
                    <tr key={u.userId} className="row-hover"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-dim)', width: 40 }}>
                        {globalOffset + i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/users/${u.userId}`}>
                          <UserCell userId={u.userId} userMap={userMap} />
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-mono"
                            style={{ color: 'var(--indigo-bright)', minWidth: 28 }}>
                            {u.totalPoints}
                          </span>
                          <div className="h-1.5 rounded-full flex-1 max-w-[80px]"
                            style={{ background: 'var(--bg-hover)' }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${barWidth}%`, background: 'var(--indigo)' }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono"
                        style={{ color: 'var(--text-primary)' }}>
                        {u.caseCount}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono"
                        style={{ color: u.banCount > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                        {u.banCount}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase"
                          style={{ background: s.bg, color: s.color }}>
                          {u.threatLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono"
                        style={{ color: 'var(--text-muted)' }}>
                        {new Date(u.lastCaseAt).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        total={sorted.length}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={setPageSize}
      />
    </div>
  );
}
