'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { discordAvatarUrl } from '@/lib/discord-avatar';

interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
  hoist: boolean;
  permissions: string;
}

interface RoleMember {
  user: { id: string; username: string; global_name: string | null; avatar: string | null };
  nick: string | null;
  roles: string[];
}

function roleColor(color: number): string {
  if (color === 0) return 'var(--text-muted)';
  return `#${color.toString(16).padStart(6, '0')}`;
}


export default function RolesPage() {
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, RoleMember[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);
  const [addInput, setAddInput] = useState<Record<string, string>>({});
  const [addWorking, setAddWorking] = useState<string | null>(null);
  const [removeWorking, setRemoveWorking] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { showToast, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as GuildRole[];
      setRoles(
        data
          .filter((r) => r.name !== '@everyone')
          .sort((a, b) => b.position - a.position),
      );
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleRole(roleId: string) {
    if (expandedRole === roleId) {
      setExpandedRole(null);
      return;
    }
    setExpandedRole(roleId);
    if (members[roleId]) return;
    setLoadingMembers(roleId);
    try {
      const res = await fetch(`/api/roles/${roleId}/members`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as RoleMember[];
      setMembers((prev) => ({ ...prev, [roleId]: data }));
    } catch {
      showToast('Fehler beim Laden der Mitglieder', 'error');
    } finally {
      setLoadingMembers(null);
    }
  }

  async function addRole(roleId: string) {
    const userId = (addInput[roleId] ?? '').trim();
    if (!userId) return;
    setAddWorking(roleId);
    try {
      const res = await fetch(`/api/roles/${roleId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (!res.ok) throw new Error();
      setAddInput((prev) => ({ ...prev, [roleId]: '' }));
      // Refresh member list
      const res2 = await fetch(`/api/roles/${roleId}/members`, { cache: 'no-store' });
      if (res2.ok) {
        const fresh = (await res2.json()) as RoleMember[];
        setMembers((prev) => ({ ...prev, [roleId]: fresh }));
      }
      showToast('Rolle vergeben');
    } catch {
      showToast('Fehler beim Vergeben der Rolle', 'error');
    } finally {
      setAddWorking(null);
    }
  }

  async function removeRole(roleId: string, userId: string) {
    setRemoveWorking(`${roleId}:${userId}`);
    try {
      const res = await fetch(`/api/roles/${roleId}/members/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setMembers((prev) => ({
        ...prev,
        [roleId]: (prev[roleId] ?? []).filter((m) => m.user.id !== userId),
      }));
      showToast('Rolle entzogen');
    } catch {
      showToast('Fehler beim Entziehen der Rolle', 'error');
    } finally {
      setRemoveWorking(null);
    }
  }

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
            Rollen
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Lade…' : `${roles.length} Rollen`}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rollen suchen…"
            className="px-3 py-1.5 rounded-md text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', width: '180px' }}
          />
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: loading ? 0.6 : 1 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade Rollen…</div>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((role) => {
            const color = roleColor(role.color);
            const expanded = expandedRole === role.id;
            const roleMembers = members[role.id] ?? [];
            const isLoadingMembers = loadingMembers === role.id;

            return (
              <div key={role.id} className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-elevated)', border: `1px solid ${expanded ? 'var(--indigo)' : 'var(--border-default)'}`, transition: 'border-color 0.15s' }}>
                {/* Role header row */}
                <button
                  onClick={() => toggleRole(role.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  style={{ cursor: 'pointer' }}>
                  <span className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: role.color !== 0 ? `0 0 6px ${color}55` : 'none' }} />
                  <span className="flex-1 text-sm font-medium" style={{ color: role.color !== 0 ? color : 'var(--text-primary)' }}>
                    {role.name}
                  </span>
                  {role.managed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>
                      BOT
                    </span>
                  )}
                  {role.hoist && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--indigo-bg)', color: 'var(--indigo-bright)', border: '1px solid rgba(99,102,241,0.3)' }}>
                      HOIST
                    </span>
                  )}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Expanded member panel */}
                {expanded && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Add member row */}
                    <div className="px-4 py-3 flex items-center gap-2"
                      style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <input
                        type="text"
                        value={addInput[role.id] ?? ''}
                        onChange={(e) => setAddInput((prev) => ({ ...prev, [role.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addRole(role.id)}
                        placeholder="User-ID eingeben…"
                        className="flex-1 px-3 py-1.5 rounded-md text-xs"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                      />
                      <button
                        onClick={() => addRole(role.id)}
                        disabled={!addInput[role.id]?.trim() || addWorking === role.id}
                        className="px-3 py-1.5 rounded-md text-xs font-bold"
                        style={{ background: 'var(--indigo)', color: '#fff', opacity: (!addInput[role.id]?.trim() || addWorking === role.id) ? 0.5 : 1 }}>
                        {addWorking === role.id ? '…' : '+ Vergeben'}
                      </button>
                    </div>

                    {/* Member list */}
                    {isLoadingMembers ? (
                      <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Lade Mitglieder…</div>
                    ) : roleMembers.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Keine Mitglieder mit dieser Rolle.</div>
                    ) : (
                      <div>
                        <div className="px-4 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {roleMembers.length} Mitglied{roleMembers.length !== 1 ? 'er' : ''}
                        </div>
                        {roleMembers.map((m) => {
                          const displayName = m.nick ?? m.user.global_name ?? m.user.username;
                          const isRemoving = removeWorking === `${role.id}:${m.user.id}`;
                          return (
                            <div key={m.user.id}
                              className="flex items-center gap-3 px-4 py-2"
                              style={{ borderTop: '1px solid var(--border-subtle)' }}>
                              <img src={discordAvatarUrl(m.user.id, m.user.avatar)} alt="" width={24} height={24} className="rounded-full flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{displayName}</div>
                                <div className="text-xs truncate" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.user.id}</div>
                              </div>
                              <button
                                onClick={() => removeRole(role.id, m.user.id)}
                                disabled={isRemoving}
                                className="px-2 py-1 rounded text-xs"
                                style={{ color: 'var(--red)', opacity: isRemoving ? 0.5 : 1 }}
                                title="Rolle entziehen">
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Rollen gefunden.</div>
          )}
        </div>
      )}

      {toastElement}
    </div>
  );
}
