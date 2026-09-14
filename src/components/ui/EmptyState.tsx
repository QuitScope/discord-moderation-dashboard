// Standard empty/placeholder panel. Uses the existing `.panel` surface class
// instead of repeating inline bg/border styles per page.

export function EmptyState({
  message,
  children,
  className = '',
}: {
  message?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`panel p-8 text-center ${className}`}>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{children ?? message}</p>
    </div>
  );
}
