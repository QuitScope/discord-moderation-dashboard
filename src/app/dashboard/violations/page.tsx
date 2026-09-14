import { getViolations } from '@/lib/api';
import { ViolationsClient } from './ViolationsClient';

export default async function ViolationsPage() {
  let violations: Awaited<ReturnType<typeof getViolations>> | null = null;
  let error = '';

  try {
    violations = await getViolations();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Fehler beim Laden der Verstöße.';
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
            Verstöße
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Verstoßregeln und Eskalationsrichtlinien
          </p>
        </div>
        <div
          className="flex items-center gap-3 rounded-lg p-4"
          style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <span style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</span>
        </div>
      </div>
    );
  }

  return <ViolationsClient initialViolations={violations} />;
}
