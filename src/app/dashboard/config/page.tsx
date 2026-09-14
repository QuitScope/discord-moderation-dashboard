import { getConfig } from '@/lib/api';

export default async function ConfigPage() {
  let config: Awaited<ReturnType<typeof getConfig>> | null = null;
  let error = '';

  try {
    config = await getConfig();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Fehler beim Laden der Konfiguration.';
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in">
      {/* Header */}
      <div>
        <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
          Konfiguration
        </h1>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Schreibgeschützt – ändern via{' '}
          <code
            className="px-2 py-0.5 rounded text-xs"
            style={{ background: 'var(--amber-bg)', color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}
          >
            /config set
          </code>{' '}
          in Discord
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-lg p-4"
          style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <span style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Config */}
      {config ? (
        <div className="space-y-4">
          {/* Enforcement */}
          <ConfigSection title="Durchsetzungsparameter">
            <ConfigRow
              label="Punkteschwelle"
              description="Maximale Punkte bevor eine automatische Maßnahme ausgelöst wird"
              value={config.pointsThreshold}
              unit="pts"
              critical={config.pointsThreshold <= 5}
            />
            <ConfigRow
              label="Verfallszeitraum"
              description="Tage bis angesammelte Punkte verfallen"
              value={config.decayDays}
              unit="days"
            />
          </ConfigSection>

          {/* Rejoin protection */}
          <ConfigSection title="Beitrittsschutz">
            <ConfigRow
              label="Beitrittslimit"
              description="Maximale Anzahl Beitritte im Überwachungszeitraum"
              value={config.rejoinLimit}
            />
            <ConfigRow
              label="Überwachungszeitraum"
              description="Überwachungszeitraum für Beitrittsverfolgung"
              value={config.rejoinWindowDays}
              unit="days"
            />
            <ConfigRow
              label="Tempban-Dauer"
              description="Strafe bei Überschreiten des Beitrittslimits"
              value={config.rejoinTempbanDays}
              unit="days"
            />
          </ConfigSection>

          {/* Authorized roles */}
          {config.allowedRoleIds.length > 0 && (
            <ConfigSection title="Berechtigte Rollen">
              <div className="flex flex-wrap gap-2 p-4">
                {config.allowedRoleIds.map((id) => (
                  <span
                    key={id}
                    className="px-3 py-1.5 rounded text-xs"
                    style={{
                      background: 'var(--emerald-bg)',
                      color: 'var(--emerald)',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid rgba(52,211,153,0.2)',
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            </ConfigSection>
          )}
        </div>
      ) : !error ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
            Keine Konfiguration geladen.
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
            Initialisieren via{' '}
            <code style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>/config set</code>
            {' '}in Discord.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
    >
      <div
        className="px-5 py-3"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        <h2 className="text-display text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function ConfigRow({
  label,
  description,
  value,
  unit,
  critical,
}: {
  label: string;
  description: string;
  value: number;
  unit?: string;
  critical?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 transition-colors"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
          {label}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {description}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 ml-6 shrink-0">
        <span
          className="text-display text-2xl font-bold"
          style={{ color: critical ? 'var(--red)' : 'var(--amber)' }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {unit}
          </span>
        )}
        {critical && (
          <span className="badge badge-danger ml-2">Alarm</span>
        )}
      </div>
    </div>
  );
}
