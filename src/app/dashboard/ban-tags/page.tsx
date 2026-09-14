'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

interface LeaveCardTag {
  id: string;
  name: string;
  leaveText: string;
  roles: { id: string; roleId: string }[];
}

interface RoleAssignment {
  id: string;
  roleId: string;
  tagId: string;
  tag: LeaveCardTag;
}

export default function BanTagsPage() {
  const [tags, setTags] = useState<LeaveCardTag[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [banRoleIds, setBanRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [leaveText, setLeaveText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { showToast, toastElement } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/leave-card-tags', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
      fetch('/api/leave-card-tags/role-assignments', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
      fetch('/api/config', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([t, a, c]) => {
        setTags(Array.isArray(t) ? t : []);
        setAssignments(Array.isArray(a) ? a : []);
        setBanRoleIds(c?.banRoleIds ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addTag() {
    if (!name.trim() || !leaveText.trim()) { showToast('Name und Text erforderlich', 'error'); return; }
    const res = await fetch('/api/leave-card-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), leaveText: leaveText.trim() }),
    });
    if (res.ok) { setName(''); setLeaveText(''); showToast('Tag erstellt'); load(); }
    else showToast('Fehler', 'error');
  }

  async function deleteTag(id: string) {
    const res = await fetch(`/api/leave-card-tags/${id}`, { method: 'DELETE' });
    if (res.ok) { setConfirmDelete(null); showToast('Gelöscht'); load(); }
    else showToast('Fehler', 'error');
  }

  async function setRoleTag(roleId: string, tagId: string) {
    if (!tagId) {
      const res = await fetch(`/api/leave-card-tags/role-assignments/${roleId}`, { method: 'DELETE' });
      if (res.ok) { showToast('Zuordnung entfernt'); load(); } else showToast('Fehler', 'error');
      return;
    }
    const res = await fetch(`/api/leave-card-tags/role-assignments/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    });
    if (res.ok) { showToast('Zuordnung gespeichert'); load(); } else showToast('Fehler', 'error');
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Ban-Tags"
        subtitle="Individuelle Leave-Card-Texte pro Ban-Rolle · Nur für Administratoren"
      />

      {/* Add form */}
      <div className="panel p-4 space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Tag erstellen</h3>
        <div className="flex gap-2 flex-wrap">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (z.B. Cheater)"
            className="px-3 py-1.5 rounded text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', width: '200px' }} />
          <input value={leaveText} onChange={(e) => setLeaveText(e.target.value)} placeholder="Leave-Card-Text (z.B. Wurde wegen Cheatens gebannt)"
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            className="px-3 py-1.5 rounded text-sm flex-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', minWidth: '260px' }} />
          <button onClick={addTag}
            className="px-4 py-1.5 rounded text-sm font-medium"
            style={{ background: 'var(--amber)', color: '#000' }}>
            Erstellen
          </button>
        </div>
      </div>

      {/* Tag list */}
      <div className="panel overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Lade…</p>
        ) : tags.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Tags.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Name', 'Leave-Card-Text', 'Rollen', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{t.leaveText}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{t.roles?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    {confirmDelete === t.id ? (
                      <div className="flex gap-2 items-center">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sicher?</span>
                        <button onClick={() => deleteTag(t.id)}
                          className="px-2.5 py-1 rounded text-xs"
                          style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
                          Ja
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-2.5 py-1 rounded text-xs"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                          Nein
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(t.id)}
                        className="px-2.5 py-1 rounded text-xs"
                        style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
                        Löschen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role assignment */}
      <div className="panel p-4 space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Rollen-Zuordnung</h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Ban-Rollen werden unter Admin Config → Ban-Rollen konfiguriert. Hier weist du ihnen optional einen Tag zu —
          löst diese Rolle einen Ban aus, zeigt die Leave-Card den Tag-Text statt des Standardtexts.
        </p>
        {banRoleIds.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>Keine Ban-Rollen konfiguriert.</p>
        ) : (
          <div className="space-y-2">
            {banRoleIds.map((roleId) => {
              const current = assignments.find((a) => a.roleId === roleId);
              return (
                <div key={roleId} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{roleId}</span>
                  <select
                    value={current?.tagId ?? ''}
                    onChange={(e) => setRoleTag(roleId, e.target.value)}
                    className="px-3 py-1.5 rounded text-sm"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                    <option value="">Kein Tag</option>
                    {tags.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toastElement}
    </div>
  );
}
