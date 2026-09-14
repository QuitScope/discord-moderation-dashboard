// Consistent page title block. Replaces the per-page
// <h1>…</h1><p>…</p> header markup duplicated across the dashboard.

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-display text-2xl md:text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
