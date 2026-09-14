'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { TypeBreakdown, CHART_COLORS } from '@/lib/analytics';

interface ActionTypeChartProps {
  data: TypeBreakdown;
}

export function ActionTypeChart({ data }: ActionTypeChartProps) {
  const chartData = [
    { name: 'Verwarnung', value: data.warning,     color: CHART_COLORS.yellow  },
    { name: 'Punkte',     value: data.points,      color: CHART_COLORS.blue    },
    { name: 'Bann',       value: data.instant_ban, color: CHART_COLORS.red     },
    { name: 'Rejoin',     value: data.rejoin_ban,  color: CHART_COLORS.purple  },
  ];

  if (chartData.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        Keine Daten
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
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
          itemStyle={{ color: '#8B99B5' }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="value" name="Anzahl" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
