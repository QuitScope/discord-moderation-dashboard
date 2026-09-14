import { getCases } from '@/lib/api';
import { UserDisplay } from '@/components/UserDisplay';
import Link from 'next/link';

export default async function DashboardPage() {
  let recentCases: Awaited<ReturnType<typeof getCases>> = [];
  try {
    recentCases = (await getCases()) ?? [];
  } catch {
    // API nicht erreichbar
  }

  const finalCases = recentCases.filter((c) => c.status === 'final').length;
  const total = recentCases.length;
  const pendingCases = recentCases.filter((c) => c.status === 'pending' || c.status === 'draft').length;

  return (
    <div className="space-y-8 animate-in">
      {/* Page header */}
      <div>
        <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
          Übersicht
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          ModGuard Moderationsübersicht
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Cases gesamt" value={total} color="indigo" icon="cases" />
        <StatCard label="Abgeschlossen" value={finalCases} color="emerald" icon="check" />
        <StatCard label="Ausstehend" value={pendingCases} color="blue" icon="clock" />
      </div>

      {/* Recent cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-display text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Cases
          </h2>
          <Link
            href="/dashboard/cases"
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--indigo-bright)', fontFamily: 'var(--font-body)' }}
          >
            Alle anzeigen →
          </Link>
        </div>

        {recentCases.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Keine Cases vorhanden.</p>
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="space-y-3 md:hidden">
              {recentCases.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg p-4 space-y-3"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <UserDisplay userId={c.userId} size="sm" showId={false} />
                    <StatusPill status={c.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Typ
                      </div>
                      <TypeBadge type={c.type} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Bedrohung
                      </div>
                      <ThreatBadge type={c.type} points={c.points} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Punkte
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {c.points}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Datum
                      </div>
                      <span className="text-[12px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(c.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table layout */}
            <div
              className="hidden md:block rounded-lg overflow-hidden"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                      {['Nutzer', 'Typ', 'Bedrohung', 'Punkte', 'Status', 'Datum'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCases.slice(0, 5).map((c) => (
                      <tr
                        key={c.id}
                        className="row-hover"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      >
                        <td className="px-4 py-3">
                          <UserDisplay userId={c.userId} size="sm" showId={false} />
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={c.type} />
                        </td>
                        <td className="px-4 py-3">
                          <ThreatBadge type={c.type} points={c.points} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {c.points}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(c.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const StatIcons = {
  cases: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

function StatCard({ label, value, color, icon }: {
  label: string;
  value: number;
  color: 'indigo' | 'emerald' | 'blue';
  icon: keyof typeof StatIcons;
}) {
  const colorMap = {
    indigo:  { text: 'var(--indigo-bright)', bg: 'var(--indigo-bg)',  border: 'rgba(99,102,241,0.2)' },
    emerald: { text: 'var(--emerald)',        bg: 'var(--emerald-bg)', border: 'rgba(52,211,153,0.2)' },
    blue:    { text: 'var(--blue)',           bg: 'var(--blue-bg)',    border: 'rgba(96,165,250,0.2)' },
  };
  const c = colorMap[color];

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: 'var(--bg-card)', border: `1px solid var(--border-default)` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center"
          style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
        >
          {StatIcons[icon]}
        </div>
      </div>
      <div className="text-display text-3xl font-bold mb-0.5" style={{ color: c.text }}>
        {value}
      </div>
      <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    warning:    { label: 'Verwarnung', cls: 'badge badge-warning' },
    points:     { label: 'Punkte',    cls: 'badge badge-info' },
    instant_ban:{ label: 'Bann',      cls: 'badge badge-danger' },
    rejoin_ban: { label: 'Rejoin',    cls: 'badge badge-purple' },
  };
  const cfg = map[type] ?? { label: type, cls: 'badge badge-neutral' };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

function ThreatBadge({ type, points }: { type: string; points: number }) {
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
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
      style={{ 
        backgroundColor: bg,
        color: text,
      }}
    >
      {level}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    final:   { cls: 'badge badge-success', label: 'Abgeschlossen' },
    revoked: { cls: 'badge badge-neutral', label: 'Widerrufen' },
    expired: { cls: 'badge badge-neutral', label: 'Abgelaufen' },
    draft:   { cls: 'badge badge-warning', label: 'Entwurf' },
    pending: { cls: 'badge badge-info',    label: 'Ausstehend' },
  };
  const cfg = map[status] ?? { cls: 'badge badge-neutral', label: status };
  return <span className={cfg.cls}>{cfg.label}</span>;
}
