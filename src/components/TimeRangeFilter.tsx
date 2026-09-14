'use client';

import { DateRange } from '@/lib/analytics';

interface TimeRangeFilterProps {
  value: DateRange;
  customFrom?: string;
  customTo?: string;
  onChange: (range: DateRange, from?: string, to?: string) => void;
}

const PRESETS: { label: string; value: Exclude<DateRange, 'custom'> }[] = [
  { label: '7d',  value: '7d'  },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

export function TimeRangeFilter({ value, customFrom, customTo, onChange }: TimeRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
          style={{
            background: value === p.value ? 'var(--indigo-bg)' : 'transparent',
            color: value === p.value ? 'var(--indigo-bright)' : 'var(--text-secondary)',
            border: `1px solid ${value === p.value ? 'rgba(99,102,241,0.35)' : 'var(--border-default)'}`,
          }}
        >
          {p.label}
        </button>
      ))}

      {/* Custom date range */}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={customFrom ?? ''}
          onChange={(e) => onChange('custom', e.target.value, customTo)}
          className="px-2 py-1 rounded-md text-xs"
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${value === 'custom' ? 'rgba(99,102,241,0.35)' : 'var(--border-default)'}`,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>
        <input
          type="date"
          value={customTo ?? ''}
          onChange={(e) => onChange('custom', customFrom, e.target.value)}
          className="px-2 py-1 rounded-md text-xs"
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${value === 'custom' ? 'rgba(99,102,241,0.35)' : 'var(--border-default)'}`,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        />
      </div>
    </div>
  );
}
