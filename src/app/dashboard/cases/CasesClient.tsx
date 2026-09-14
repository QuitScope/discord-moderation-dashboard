'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CaseReason } from '@/components/CaseReason';
import { CaseStatusBadge } from '@/components/ui/CaseStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/Pagination';
import { formatDate, formatTime } from '@/lib/format';

type Case = {
  id: string;
  userId: string;
  type: string;
  points: number;
  status: string;
  createdById: string;
  createdAt: string;
  reasonText: string;
  reasonKey: string | null;
};

interface CasesClientProps {
  cases: Case[];
  userMapping: Record<string, { displayName: string; avatarUrl: string | null }>;
  roleMapping: Record<string, string>;
  total: number;
  page: number;
  pages: number;
  hideDryRun: boolean;
}

export function CasesClient({ cases, userMapping, roleMapping, total, page, pages, hideDryRun }: CasesClientProps) {
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function toggleDryRun(checked: boolean) {
    setParam({ dry: checked ? '1' : null, page: '1' });
  }

  function goToPage(p: number) {
    setParam({ page: String(p) });
  }

  return (
    <>
      {/* Filter section */}
      <div
        className="rounded-lg px-4 py-3"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
      >
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hideDryRun}
            onChange={(e) => toggleDryRun(e.target.checked)}
            className="cyber-checkbox"
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Dry-Run Cases ausblenden
          </span>
        </label>
      </div>

      {/* Empty */}
      {cases.length === 0 && (
        <EmptyState
          className="p-12"
          message={hideDryRun ? 'Keine Cases (außer Dry-Run) gefunden.' : 'Keine Cases gefunden.'}
        />
      )}

      {/* Mobile card layout */}
      {cases.length > 0 && (
        <div className="space-y-3 md:hidden">
          {cases.map((c) => (
            <div
              key={c.id}
              className="rounded-lg overflow-hidden"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <div
                className="px-4 py-3 cursor-pointer"
                onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      fill="none"
                      style={{ 
                        transform: expandedCase === c.id ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {c.id.slice(0, 8)}…
                  </div>
                  <CaseStatusBadge status={c.status} />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Ziel
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {userMapping[c.userId]?.displayName || c.userId.slice(0, 12) + '…'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Typ
                      </div>
                      <CaseTypeBadge type={c.type} reasonText={c.reasonText} createdById={c.createdById} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Bedrohung
                      </div>
                      <ThreatLevelBadge type={c.type} points={c.points} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Punkte
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--bg-hover)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Moderator
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {c.createdById === 'system' 
                          ? '🤖 System' 
                          : userMapping[c.createdById]?.displayName || c.createdById.slice(0, 12) + '…'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Datum
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(c.createdAt)}{' '}
                        <span style={{ color: 'var(--text-dim)' }}>{formatTime(c.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {expandedCase === c.id && (
                <div className="px-4 py-4 border-t" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Grund
                    </div>
                    <CaseReason reasonText={c.reasonText} type={c.type} createdById={c.createdById} roleMapping={roleMapping} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {cases.length > 0 && (
        <div
          className="hidden md:block rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Case ID', 'Ziel', 'Typ', 'Bedrohung', 'Punkte', 'Status', 'Moderator', 'Datum'].map((h) => (
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
                  <Fragment key={c.id}>
                    <tr
                      className="row-hover cursor-pointer"
                      style={{ borderBottom: expandedCase === c.id ? 'none' : '1px solid var(--border-subtle)' }}
                      onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                    >
                      <td className="px-5 py-3.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <div className="flex items-center gap-2">
                          <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 12 12" 
                            fill="none"
                            style={{ 
                              transform: expandedCase === c.id ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}
                          >
                            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {c.id.slice(0, 8)}…
                        </div>
                      </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/users/${c.userId}`}
                        className="text-sm hover:text-cyan-400 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {userMapping[c.userId]?.displayName || c.userId.slice(0, 12) + '…'}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <CaseTypeBadge type={c.type} reasonText={c.reasonText} createdById={c.createdById} />
                    </td>
                    <td className="px-5 py-3.5">
                      <ThreatLevelBadge type={c.type} points={c.points} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-16 h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--bg-hover)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
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
                      <CaseStatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {c.createdById === 'system' 
                          ? '🤖 System' 
                          : userMapping[c.createdById]?.displayName || c.createdById.slice(0, 12) + '…'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatDate(c.createdAt)}{' '}
                      <span style={{ color: 'var(--text-dim)' }}>{formatTime(c.createdAt)}</span>
                    </td>
                  </tr>
                  {expandedCase === c.id && (
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td colSpan={8} className="px-5 py-4" style={{ background: 'var(--bg-base)' }}>
                        <div className="space-y-2">
                          <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>
                            Grund
                          </div>
                          <CaseReason reasonText={c.reasonText} type={c.type} createdById={c.createdById} roleMapping={roleMapping} />
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cases.length > 0 && (
        <Pagination page={page} totalPages={pages} total={total} onPage={goToPage} />
      )}
    </>
  );
}

function CaseTypeBadge({ type, reasonText, createdById }: { type: string; reasonText: string; createdById: string }) {
  const isAutomatic = createdById === 'system' || reasonText.includes('Automatischer Ban');
  
  const map: Record<string, { label: string; cls: string }> = {
    warning:     { label: 'Verwarnung', cls: 'badge badge-warning' },
    points:      { label: 'Punkte',    cls: 'badge badge-info' },
    instant_ban: { label: isAutomatic ? '🤖 Auto-Bann' : 'Bann', cls: 'badge badge-danger' },
    rejoin_ban:  { label: 'Rejoin Bann',    cls: 'badge badge-purple' },
    role_ban:    { label: isAutomatic ? '🤖 Rollen-Kick' : 'Rollen-Kick', cls: 'badge badge-danger' },
    mass_message_delete: { label: 'Massenlöschung', cls: 'badge badge-danger' },
  };
  const cfg = map[type] ?? { label: type, cls: 'badge badge-neutral' };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

function ThreatLevelBadge({ type, points }: { type: string; points: number }) {
  // Determine threat level based on type and points
  let level: 'niedrig' | 'mittel' | 'hoch' | 'kritisch';
  
  if (type === 'instant_ban' || type === 'role_ban' || type === 'mass_message_delete') {
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

