'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ModStat, CHART_COLORS } from '@/lib/analytics';

interface ModBarChartProps {
  data: ModStat[];
  modNames: Record<string, string>;
}

export function ModBarChart({ data, modNames }: ModBarChartProps) {
  const chartData = data.slice(0, 10).map((m) => ({
    name: modNames[m.modId] ?? m.modId.slice(0, 8) + '…',
    total: m.total,
    warnings: m.warnings,
    bans: m.bans,
    pointsCases: m.pointsCases,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        Keine Daten
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 36)}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            background: '#131F30',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#EFF2FB' }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="warnings"    name="Warnungen" stackId="a" fill={CHART_COLORS.yellow} fillOpacity={0.85} />
        <Bar dataKey="pointsCases" name="Punkte"    stackId="a" fill={CHART_COLORS.blue}   fillOpacity={0.85} />
        <Bar dataKey="bans"        name="Bans"      stackId="a" fill={CHART_COLORS.red}    fillOpacity={0.85} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
