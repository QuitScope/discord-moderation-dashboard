'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TimeSeriesPoint, CHART_COLORS } from '@/lib/analytics';

interface CaseTrendChartProps {
  data: TimeSeriesPoint[];
}

export function CaseTrendChart({ data }: CaseTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        Keine Daten für diesen Zeitraum
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
            fontFamily: 'var(--font-mono)',
          }}
          labelStyle={{ color: '#EFF2FB', marginBottom: 4 }}
          itemStyle={{ color: '#8B99B5' }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.axis, paddingTop: 8 }}
        />
        <Line type="monotone" dataKey="total"    name="Gesamt"    stroke={CHART_COLORS.indigo}  strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="warnings" name="Warnungen" stroke={CHART_COLORS.yellow}  strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="bans"     name="Bans"      stroke={CHART_COLORS.red}     strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="points"   name="Punkte"    stroke={CHART_COLORS.blue}    strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
