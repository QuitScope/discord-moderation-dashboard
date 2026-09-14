import { getAuditCases, getAuditEvents } from '@/lib/api';
import { UserDisplay } from '@/components/UserDisplay';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CaseStatusBadge } from '@/components/ui/CaseStatusBadge';
import { DateTime } from '@/components/ui/DateTime';
import { UrlPagination } from '@/components/ui/UrlPagination';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ cp?: string; ep?: string }>;
}) {
  const { cp, ep } = await searchParams;
  const casesPage = parsePage(cp);
  const eventsPage = parsePage(ep);

  let casesResult: Awaited<ReturnType<typeof getAuditCases>> | null = null;
  let eventsResult: Awaited<ReturnType<typeof getAuditEvents>> | null = null;
  let error = '';

  try {
    [casesResult, eventsResult] = await Promise.all([
      getAuditCases(casesPage),
      getAuditEvents(eventsPage),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Fehler beim Laden des Protokolls.';
  }

  const cases = casesResult?.data ?? [];
  const events = eventsResult?.data ?? [];

  return (
    <div className="space-y-8 animate-in">
      <PageHeader title="Protokoll" subtitle="Systemweite Aktivitäten und Moderationshistorie" />

      {error && (
        <div
          className="flex items-center gap-3 rounded-lg p-4"
          style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <span style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Enforcement Actions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-display text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Maßnahmen
          </h2>
          <span className="badge badge-amber">{casesResult?.total ?? 0} Einträge</span>
        </div>

        {cases.length === 0 ? (
          <EmptyState message="Keine Maßnahmen protokolliert." />
        ) : (
          <div className="panel overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Case ID', 'Ziel', 'Typ', 'Status', 'Datum'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="row-hover" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-5 py-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {c.id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3">
                      <UserDisplay userId={c.userId} size="sm" showId={false} />
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                        {c.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <CaseStatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3">
                      <DateTime value={c.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(casesResult?.pages ?? 1) > 1 && (
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                <UrlPagination
                  page={casesResult?.page ?? 1}
                  pages={casesResult?.pages ?? 1}
                  total={casesResult?.total ?? 0}
                  param="cp"
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Member movement */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-display text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Mitgliederbewegungen
          </h2>
          <span className="badge badge-neutral">{eventsResult?.total ?? 0} Ereignisse</span>
        </div>

        {events.length === 0 ? (
          <EmptyState message="Keine Mitgliederereignisse protokolliert." />
        ) : (
          <div className="panel overflow-hidden">
            {events.map((e, idx) => (
              <div
                key={e.id}
                className="row-hover flex items-center justify-between px-5 py-3"
                style={{ borderBottom: idx < events.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              >
                <div className="flex items-center gap-4">
                  <EventBadge event={e.event} />
                  <UserDisplay userId={e.userId} size="sm" showId={false} />
                </div>
                <DateTime value={e.timestamp} withSeconds />
              </div>
            ))}

            {(eventsResult?.pages ?? 1) > 1 && (
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                <UrlPagination
                  page={eventsResult?.page ?? 1}
                  pages={eventsResult?.pages ?? 1}
                  total={eventsResult?.total ?? 0}
                  param="ep"
                />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function parsePage(raw?: string): number {
  const parsed = raw ? parseInt(raw, 10) : 1;
  return parsed && !isNaN(parsed) && parsed > 0 ? parsed : 1;
}

function EventBadge({ event }: { event: 'join' | 'leave' }) {
  if (event === 'join') {
    return (
      <span className="badge badge-success">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
        Beigetreten
      </span>
    );
  }
  return (
    <span className="badge badge-danger">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
      Verlassen
    </span>
  );
}
