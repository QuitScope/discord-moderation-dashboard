export default function MassDeleteMessagesPage() {
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
          Massenlöschung
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Alle Nachrichten eines Users server-weit löschen · Nur für Administratoren
        </p>
      </div>
      <div
        className="rounded-lg p-10 text-center"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Diese Funktion ist in der Portfolio-Demo noch nicht verfügbar.
        </p>
      </div>
    </div>
  );
}
