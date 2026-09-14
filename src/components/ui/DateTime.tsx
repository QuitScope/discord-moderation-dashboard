import { formatDate, formatTime } from '@/lib/format';

// Date + dimmed time, monospace — the recurring table-cell timestamp pattern
// in cases/audit. Pure component (no client hooks).

export function DateTime({
  value,
  withSeconds = false,
}: {
  value: string | Date;
  withSeconds?: boolean;
}) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
      {formatDate(value)}{' '}
      <span style={{ color: 'var(--text-dim)' }}>{formatTime(value, withSeconds)}</span>
    </span>
  );
}
