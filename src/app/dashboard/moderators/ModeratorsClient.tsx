'use client';

import { useState, useMemo } from 'react';
import type { Case } from '@/lib/api';
import {
  filterByRange, groupByModerator,
  type DateRange, type ModStat, type UserInfo,
} from '@/lib/analytics';
import { TimeRangeFilter } from '@/components/TimeRangeFilter';
import { ModBarChart } from '@/components/charts/ModBarChart';
import { ModTimelineChart } from '@/components/charts/ModTimelineChart';

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

interface ModeratorsClientProps {
  cases: Case[];
  userMap: Record<string, UserInfo>;
}

export function ModeratorsClient({ cases, userMap }: ModeratorsClientProps) {
  const [range, setRange]           = useState<DateRange>('30d');
  const [customFrom, setCustomFrom] = useState<string>();
  const [customTo, setCustomTo]     = useState<string>();

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

  const modStats: ModStat[] = useMemo(() => groupByModerator(filtered), [filtered]);
  const modIds = modStats.map((m) => m.modId);
  const modNames: Record<string, string> = Object.fromEntries(
    modIds.map((id) => [id, userMap[id]?.name ?? id.slice(0, 8) + '…'])
  );

  function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `vor ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `vor ${h}h`;
    return `vor ${Math.floor(h / 24)}d`;
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
            Moderatoren
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Team-Statistiken im Zeitraum
          </p>
        </div>
        <TimeRangeFilter
          value={range}
          customFrom={customFrom}
          customTo={customTo}
          onChange={handleRangeChange}
        />
      </div>

      {modStats.length === 0 ? (
        <div className="rounded-lg p-8 text-center text-sm"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
          Keine Moderations-Daten für diesen Zeitraum.
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Actions pro Moderator
              </h2>
              <ModBarChart data={modStats} modNames={modNames} />
            </div>
            <div className="rounded-lg p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Aktivität über Zeit
              </h2>
              <ModTimelineChart cases={filtered} modIds={modIds} modNames={modNames} />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['Moderator', 'Gesamt', 'Warnungen', 'Bans', 'Punkte', 'Letzte Aktion'].map((h) => (
                      <th key={h}
                        className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modStats.map((m) => (
                    <tr key={m.modId} className="row-hover"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-3">
                        <UserCell userId={m.modId} userMap={userMap} />
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold font-mono"
                        style={{ color: 'var(--indigo-bright)' }}>
                        {m.total}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono"
                        style={{ color: 'var(--yellow)' }}>
                        {m.warnings}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono"
                        style={{ color: m.bans > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                        {m.bans}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono"
                        style={{ color: 'var(--blue)' }}>
                        {m.pointsCases}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono"
                        style={{ color: 'var(--text-muted)' }}>
                        {relativeTime(m.lastActionAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
