export function NoAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center space-y-3 p-8">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Kein Zugriff
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Du hast keine Berechtigung für das Dashboard.
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Wende dich an einen Administrator, um Zugriff zu erhalten.
        </p>
      </div>
    </div>
  );
}
