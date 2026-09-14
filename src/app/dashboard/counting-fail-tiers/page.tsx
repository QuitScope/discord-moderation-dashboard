'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmojiInput } from '@/components/EmojiPicker';

interface FailTier {
  id: string;
  order: number;
  roleId: string;
  emoji: string;
}

interface GuildRole { id: string; name: string; color: number }

function roleColor(color: number) {
  return color === 0 ? 'var(--text-muted)' : `#${color.toString(16).padStart(6, '0')}`;
}

const selectStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
} as const;

export default function CountingFailTiersPage() {
  const { showToast, toastElement } = useToast();
  const [tiers, setTiers] = useState<FailTier[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoleId, setNewRoleId] = useState('');
  const [newEmoji, setNewEmoji] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tiersRes, rolesRes] = await Promise.all([
        fetch('/api/counting-fail-tiers'),
        fetch('/api/roles'),
      ]);
      const tiersData = await tiersRes.json();
      const rolesData = await rolesRes.json();
      // Error responses are objects ({ error: ... }), never arrays — don't let
      // them reach the render path.
      if (!tiersRes.ok || !Array.isArray(tiersData)) throw new Error('tiers request failed');
      setTiers(tiersData);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch {
      showToast('Fehler beim Laden der Fail-Stufen', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function addTier() {
    if (!newRoleId || !newEmoji) return;
    const res = await fetch('/api/counting-fail-tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId: newRoleId, emoji: newEmoji }),
    });
    if (!res.ok) { showToast('Fehler beim Hinzufügen', 'error'); return; }
    setNewRoleId('');
    setNewEmoji('');
    showToast('Stufe hinzugefügt');
    await load();
  }

  async function updateTier(id: string, patch: { roleId?: string; emoji?: string }) {
    const res = await fetch(`/api/counting-fail-tiers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { showToast('Fehler beim Speichern', 'error'); return; }
    await load();
  }

  async function deleteTier(id: string) {
    const res = await fetch(`/api/counting-fail-tiers/${id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Fehler beim Löschen', 'error'); return; }
    showToast('Stufe gelöscht');
    await load();
  }

  async function move(id: string, direction: -1 | 1) {
    const index = tiers.findIndex((t) => t.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= tiers.length) return;
    const orderedIds = tiers.map((t) => t.id);
    [orderedIds[index], orderedIds[swapIndex]] = [orderedIds[swapIndex], orderedIds[index]];
    const res = await fetch('/api/counting-fail-tiers/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
    if (!res.ok) { showToast('Fehler beim Umsortieren', 'error'); return; }
    await load();
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Counting Fail-Stufen"
        subtitle="Eskalationsleiter für Verzähler — pro Fail eine Stufe hoch, alle 24h ohne Fail eine Stufe runter"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade Fail-Stufen…</div>
        </div>
      ) : (
        <>
          {tiers.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              Noch keine Stufen konfiguriert. Ohne Stufen vergibt der Bot keine Fail-Rollen.
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['Stufe', 'Rolle', 'Emoji', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier, i) => (
                    <tr key={tier.id}
                      style={{ borderBottom: i < tiers.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{i + 1}</td>
                      <td className="px-4 py-3">
                        <select value={tier.roleId} onChange={(e) => updateTier(tier.id, { roleId: e.target.value })}
                          className="px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ ...selectStyle, color: roleColor(roles.find((r) => r.id === tier.roleId)?.color ?? 0) }}>
                          {!roles.some((r) => r.id === tier.roleId) && (
                            <option value={tier.roleId}>Unbekannte Rolle ({tier.roleId})</option>
                          )}
                          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <EmojiInput value={tier.emoji} onChange={(v) => updateTier(tier.id, { emoji: v })} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => move(tier.id, -1)} disabled={i === 0}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: i === 0 ? 0.4 : 1 }}>
                            ↑
                          </button>
                          <button onClick={() => move(tier.id, 1)} disabled={i === tiers.length - 1}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: i === tiers.length - 1 ? 0.4 : 1 }}>
                            ↓
                          </button>
                          <button onClick={() => deleteTier(tier.id)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.4)', color: 'var(--red)' }}>
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="panel p-4">
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              Neue Stufe
            </div>
            <div className="flex items-center gap-3">
              <select value={newRoleId} onChange={(e) => setNewRoleId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={selectStyle}>
                <option value="">Rolle auswählen…</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <EmojiInput value={newEmoji} onChange={setNewEmoji} />
              <button onClick={addTier} disabled={!newRoleId || !newEmoji}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: !newRoleId || !newEmoji ? 0.5 : 1 }}>
                Stufe hinzufügen
              </button>
            </div>
          </div>
        </>
      )}
      {toastElement}
    </div>
  );
}
