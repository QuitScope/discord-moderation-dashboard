'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Case } from '@/lib/api';
import {
  filterByRange, groupByDate, groupByType, groupByUser, computeKpis,
  type DateRange, type UserInfo,
} from '@/lib/analytics';
import { TimeRangeFilter } from '@/components/TimeRangeFilter';
import { CaseTrendChart } from '@/components/charts/CaseTrendChart';
import { ActionTypeChart } from '@/components/charts/ActionTypeChart';

interface AnalyticsClientProps {
  cases: Case[];
  userMap: Record<string, UserInfo>;
}

const THREAT_STYLES = {
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

export function AnalyticsClient({ cases, userMap }: AnalyticsClientProps) {
  const [range, setRange] = useState<DateRange>('30d');
  const [customFrom, setCustomFrom] = useState<string>();
  const [customTo, setCustomTo]   = useState<string>();

  function handleRangeChange(r: DateRange, from?: string, to?: string) {
    setRange(r);
    setCustomFrom(from);
    setCustomTo(to);
  }

  const filtered = filterByRange(
    cases, range,
    customFrom ? new Date(customFrom) : undefined,
    customTo   ? new Date(customTo)   : undefined,
  );

  const kpis      = computeKpis(filtered);
  const trend     = groupByDate(filtered);
  const typeBreak = groupByType(filtered);
  const top5      = groupByUser(filtered)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  const kpiCards = [
    { label: 'Cases gesamt', value: kpis.total,            color: 'var(--indigo-bright)' },
    { label: 'Bans',         value: kpis.bans,             color: 'var(--red)'           },
    { label: 'Warnungen',    value: kpis.warnings,         color: 'var(--yellow)'        },
    { label: 'Ø Pts/User',   value: kpis.avgPointsPerUser, color: 'var(--blue)'          },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
            Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Moderations-Übersicht
          </p>
        </div>
        <TimeRangeFilter
          value={range}
          customFrom={customFrom}
          customTo={customTo}
          onChange={handleRangeChange}
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <div key={k.label} className="rounded-lg p-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <div className="text-display text-2xl font-bold mb-0.5" style={{ color: k.color }}>
              {k.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="rounded-lg p-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Cases über Zeit
        </h2>
        <CaseTrendChart data={trend} />
      </div>

      {/* Type breakdown + Top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Action-Typen
          </h2>
          <ActionTypeChart data={typeBreak} />
        </div>

        <div className="rounded-lg p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Top User
            </h2>
            <Link href="/dashboard/leaderboard"
              className="text-xs font-medium"
              style={{ color: 'var(--indigo-bright)' }}>
              Alle anzeigen →
            </Link>
          </div>
          {top5.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Keine Daten</p>
          ) : (
            <div className="space-y-2">
              {top5.map((u, i) => {
                const s = THREAT_STYLES[u.threatLevel];
                return (
                  <Link key={u.userId} href={`/dashboard/users/${u.userId}`}
                    className="flex items-center gap-3 group">
                    <span className="text-xs font-mono w-5 text-right shrink-0"
                      style={{ color: 'var(--text-dim)' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <UserCell userId={u.userId} userMap={userMap} />
                    </div>
                    <span className="text-xs font-semibold shrink-0"
                      style={{ fontFamily: 'var(--font-mono)', color: s.color }}>
                      {u.totalPoints} pts
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: s.bg, color: s.color }}>
                      {u.threatLevel}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
