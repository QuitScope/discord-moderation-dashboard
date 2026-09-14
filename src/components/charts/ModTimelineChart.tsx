'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/lib/analytics';
import type { Case } from '@/lib/api';

const SERIES_COLORS = [
  CHART_COLORS.indigo, CHART_COLORS.emerald, CHART_COLORS.yellow,
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.purple,
];

interface ModTimelineChartProps {
  cases: Case[];
  modIds: string[];
  modNames: Record<string, string>;
}

export function ModTimelineChart({ cases, modIds, modNames }: ModTimelineChartProps) {
  const [visible, setVisible] = useState<Set<string>>(new Set(modIds.slice(0, 5)));

  // Build date → { [modId]: count } map
  const dateModMap = new Map<string, Record<string, number>>();
  for (const c of cases) {
    const modId = (c as any).createdById as string;
    if (!modId || !visible.has(modId)) continue;
    const date = new Date(c.createdAt).toISOString().slice(0, 10);
    const existing = dateModMap.get(date) ?? {};
    existing[modId] = (existing[modId] ?? 0) + 1;
    dateModMap.set(date, existing);
  }

  const chartData = Array.from(dateModMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  function toggleMod(modId: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  }

  return (
    <div>
      {/* Mod toggle checkboxes */}
      <div className="flex flex-wrap gap-2 mb-3">
        {modIds.slice(0, 6).map((modId, i) => {
          const color = SERIES_COLORS[i % SERIES_COLORS.length];
          const active = visible.has(modId);
          return (
            <button
              key={modId}
              onClick={() => toggleMod(modId)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-opacity"
              style={{ opacity: active ? 1 : 0.4 }}
            >
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: color }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                {modNames[modId] ?? modId.slice(0, 8)}
              </span>
            </button>
          );
        })}
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-40" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Keine Daten
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="date"
              tick={{ fill: CHART_COLORS.axis, fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickFormatter={(v: string) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#131F30',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#EFF2FB' }}
            />
            {modIds.slice(0, 6).filter((id) => visible.has(id)).map((modId, i) => (
              <Line
                key={modId}
                type="monotone"
                dataKey={modId}
                name={modNames[modId] ?? modId.slice(0, 8)}
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={1.5}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
