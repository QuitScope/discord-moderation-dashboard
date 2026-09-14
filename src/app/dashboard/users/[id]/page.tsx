import { getUser } from '@/lib/api';
import { fetchDiscordUser, getAvatarUrl, getDisplayName, getDefaultAvatarUrl } from '@/lib/discord';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { UserTimeoutActions } from './UserTimeoutActions';

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const discordUser = await fetchDiscordUser(id);

  let user: Awaited<ReturnType<typeof getUser>>;
  try {
    user = await getUser(id);
  } catch {
    notFound();
  }

  if (!user) {
    notFound();
  }

  // Determine threat level
  const getThreatLevel = () => {
    if (user.activePoints >= 7) return { level: 'Kritisch', color: '#dc2626', bg: '#dc262615' };
    if (user.activePoints >= 4) return { level: 'Hoch', color: '#ea580c', bg: '#ea580c15' };
    if (user.activePoints >= 2) return { level: 'Mittel', color: '#d97706', bg: '#d9770615' };
    return { level: 'Niedrig', color: '#059669', bg: '#05966915' };
  };
  const threat = getThreatLevel();

  const activeTimeout = user.cases.find(
    (c) => c.type === 'timeout' && c.status === 'final' && c.expiresAt && new Date(c.expiresAt) > new Date(),
  ) ?? null;

  return (
    <div className="space-y-6 animate-in">
      {/* Back */}
      <Link
        href="/dashboard/cases"
        className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Zurück zu Cases
      </Link>

      {/* User profile card */}
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden" style={{ border: '2px solid var(--border-strong)' }}>
              <Image
                src={discordUser ? getAvatarUrl(discordUser, 128) || getDefaultAvatarUrl(id) : getDefaultAvatarUrl(id)}
                alt={discordUser ? getDisplayName(discordUser) : id}
                width={80}
                height={80}
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-display text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {discordUser ? getDisplayName(discordUser) : id}
                </h1>
                {discordUser && (
                  <div className="space-y-0.5">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      @{discordUser.username}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      ID: {id}
                    </p>
                  </div>
                )}
                {!discordUser && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                    ID: {id}
                  </p>
                )}
              </div>
              {/* Threat level */}
              <div
                className="rounded-lg px-4 py-2.5 text-right shrink-0"
                style={{ background: threat.bg, border: `1px solid ${threat.color}40` }}
              >
                <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Bedrohungsstufe
                </div>
                <div className="text-display font-bold text-lg" style={{ color: threat.color }}>
                  {threat.level}
                </div>
              </div>
            </div>

            {user.lastViolationAt && (
              <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--red)' }}>
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Letzter Verstoß:{' '}
                {new Date(user.lastViolationAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {', '}
                {new Date(user.lastViolationAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
        <UserTimeoutActions
          userId={id}
          username={discordUser?.username ?? id}
          activeTimeout={activeTimeout ? { expiresAt: activeTimeout.expiresAt! } : null}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <UserStatCard label="Aktive Punkte" value={user.activePoints} color={threat.color} />
        <UserStatCard label="Punkte gesamt" value={user.currentPoints} color="var(--amber)" />
        <UserStatCard label="Cases gesamt" value={user.cases.length} color="var(--blue)" />
      </div>

      {/* Case history */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-display text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Moderationshistorie
          </h2>
          <div className="flex items-center gap-2">
            {(() => {
              const dryRunCount = user.cases.filter(c => c.status === 'dry_run').length;
              const activeCount = user.cases.length - dryRunCount;

              if (dryRunCount > 0) {
                return (
                  <>
                    <span className="badge badge-neutral">{activeCount} aktiv</span>
                    <span className="badge-orange">{dryRunCount} Dry-Run</span>
                  </>
                );
              }
              return <span className="badge badge-neutral">{user.cases.length} Einträge</span>;
            })()}
          </div>
        </div>

        {/* Warning banner for dry-run cases */}
        {user.cases.some(c => c.status === 'dry_run') && (
          <div
            className="rounded-lg p-4 mb-4 flex items-start gap-3"
            style={{ background: 'var(--orange-bg)', border: '1px solid var(--orange)40' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" style={{ color: 'var(--orange)' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--orange)' }}>
                Enthält Test-Cases aus Dry-Run-Modus
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Diese Cases wurden nur simuliert und führten zu keinen echten Discord-Aktionen.
              </p>
            </div>
          </div>
        )}

        {user.cases.length === 0 ? (
          <div
            className="rounded-lg p-10 text-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <div className="text-2xl mb-2">✓</div>
            <p style={{ color: 'var(--emerald)', fontSize: '14px', fontWeight: 500 }}>Saubere Akte</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Keine Verstöße eingetragen.</p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Typ', 'Bedrohung', 'Punkte', 'Status', 'Grund', 'Datum'].map((h) => (
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
                {user.cases.map((c) => (
                  <tr
                    key={c.id}
                    className="row-hover"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: c.status === 'dry_run' ? '3px dashed var(--orange)' : 'none',
                      background: c.status === 'dry_run' ? 'var(--orange-bg)' : undefined,
                    }}
                  >
                    <td className="px-5 py-3.5 text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                      {c.type.replace('_', ' ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <ThreatLevelBadge type={c.type} points={c.points} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min((c.points / 10) * 100, 100)}%`,
                              background: c.points >= 7 ? 'var(--red)' : c.points >= 4 ? 'var(--yellow)' : 'var(--amber)',
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {c.points}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {c.reasonText || '—'}
                    </td>
                    <td className="px-5 py-3.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UserStatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
    >
      <div className="text-display text-3xl font-bold mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}

function ThreatLevelBadge({ type, points }: { type: string; points: number }) {
  // Determine threat level based on type and points
  let level: 'niedrig' | 'mittel' | 'hoch' | 'kritisch';
  
  if (type === 'instant_ban' || type === 'role_ban') {
    level = 'kritisch';
  } else if (points >= 7) {
    level = 'kritisch';
  } else if (points >= 4) {
    level = 'hoch';
  } else if (points >= 2) {
    level = 'mittel';
  } else {
    level = 'niedrig';
  }
  
  const config = {
    niedrig:   { bg: '#059669', text: '#ffffff' }, // emerald-600 - darker green
    mittel:    { bg: '#d97706', text: '#ffffff' }, // amber-600 - darker amber
    hoch:      { bg: '#ea580c', text: '#ffffff' }, // orange-600 - darker orange
    kritisch:  { bg: '#dc2626', text: '#ffffff' }, // red-600 - darker red
  };
  
  const { bg, text } = config[level];
  
  return (
    <span 
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ 
        backgroundColor: bg,
        color: text,
      }}
    >
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classMap: Record<string, string> = {
    final:    'badge badge-success',
    revoked:  'badge badge-neutral',
    expired:  'badge badge-neutral',
    draft:    'badge badge-warning',
    pending:  'badge badge-info',
    dry_run:  'badge-orange',
  };
  const labelMap: Record<string, string> = {
    final:    'Abgeschlossen',
    revoked:  'Widerrufen',
    expired:  'Abgelaufen',
    draft:    'Entwurf',
    pending:  'Ausstehend',
    dry_run:  '[DRY RUN]',
  };
  return <span className={classMap[status] ?? 'badge badge-neutral'}>{labelMap[status] ?? status}</span>;
}
