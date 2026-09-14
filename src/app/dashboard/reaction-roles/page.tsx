'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { EmojiInput } from '@/components/EmojiPicker';
import { formatTime } from '@/lib/format';

type RRType = 'BUTTON' | 'SELECT' | 'REACTION';

interface SavedEmbedSummary {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  color: string | null;
}

interface RRGroup {
  id: string;
  name: string;
  type: string;
  channelId: string;
  messageId: string | null;
  sentAt: string | null;
  messageContent: string | null;
  embedId: string | null;
  embed?: SavedEmbedSummary | null;
  exclusive: boolean;
  allowedRoleIds: string[];
  placeholder: string | null;
  _count?: { buttons: number; options: number; reactions: number };
  buttons?: RRButton[];
  options?: RROption[];
  reactions?: RRReaction[];
  createdAt: string;
}

interface RRButton {
  id?: string;
  label: string;
  emoji: string;
  roleId: string;
  style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER';
  behavior: 'toggle' | 'add' | 'remove';
  position: number;
}

interface RROption {
  id?: string;
  label: string;
  description: string;
  emoji: string;
  roleId: string;
  position: number;
}

interface RRReaction {
  id?: string;
  emoji: string;
  roleId: string;
  selfRemove: boolean;
}

interface GuildChannel { id: string; name: string; type: number }
interface GuildRole { id: string; name: string; color: number }

const STYLE_META = [
  { value: 'PRIMARY',   label: 'Blau',  bg: '#5865f2' },
  { value: 'SECONDARY', label: 'Grau',  bg: '#4e5058' },
  { value: 'SUCCESS',   label: 'Grün',  bg: '#248046' },
  { value: 'DANGER',    label: 'Rot',   bg: '#da373c' },
] as const;

const BEHAVIORS = [
  { value: 'toggle', label: 'Toggle' },
  { value: 'add',    label: 'Nur +' },
  { value: 'remove', label: 'Nur −' },
] as const;

const emptyForm = () => ({
  name: '',
  type: 'BUTTON' as RRType,
  channelId: '',
  messageContent: '',
  embedId: null as string | null,
  exclusive: false,
  allowedRoleIds: [] as string[],
  messageId: null as string | null,
  sentAt: null as string | null,
  placeholder: '',
  buttons: [] as RRButton[],
  options: [] as RROption[],
  reactions: [] as RRReaction[],
});

function roleColor(color: number) {
  return color === 0 ? 'var(--text-muted)' : `#${color.toString(16).padStart(6, '0')}`;
}

function formatSentAt(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const date = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${date} ${formatTime(d)}`;
}

function EmojiDisplay({ emoji, size = 20, fallback = '?' }: { emoji: string; size?: number; fallback?: string }) {
  if (!emoji) return <span>{fallback}</span>;
  const custom = emoji.match(/^<(a?):([^:]+):(\d+)>$/);
  if (custom) {
    const ext = custom[1] === 'a' ? 'gif' : 'webp';
    return <img src={`https://cdn.discordapp.com/emojis/${custom[3]}.${ext}?size=32`} alt={custom[2]} style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }} />;
  }
  return <span style={{ fontSize: size }}>{emoji}</span>;
}

// ─── Discord button preview ───────────────────────────────────────────────────
function DiscordButton({ btn }: { btn: RRButton }) {
  const meta = STYLE_META.find((s) => s.value === btn.style) ?? STYLE_META[1];
  return (
    <span className="inline-flex items-center gap-1 rounded text-[13px] font-medium px-4 py-1.5 select-none"
      style={{ background: meta.bg, color: '#fff', minWidth: '60px', justifyContent: 'center', lineHeight: '20px', whiteSpace: 'nowrap', opacity: !btn.label && !btn.emoji ? 0.4 : 1 }}>
      {btn.emoji && <EmojiDisplay emoji={btn.emoji} size={16} />}
      {btn.label || <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: 11 }}>Label…</span>}
    </span>
  );
}

// ─── Discord preview panel ────────────────────────────────────────────────────
function DiscordPreview({ content, embed, type, buttons, options, reactions, placeholder }: {
  content: string; embed?: SavedEmbedSummary | null; type: RRType;
  buttons: RRButton[]; options: RROption[]; reactions: RRReaction[]; placeholder: string;
}) {
  const rows: RRButton[][] = [];
  for (let i = 0; i < buttons.length; i += 5) rows.push(buttons.slice(i, i + 5));

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#313338', border: '1px solid #1e1f22' }}>
      <div className="px-4 py-2 flex items-center gap-2" style={{ background: '#2b2d31', borderBottom: '1px solid #1e1f22' }}>
        <span style={{ color: '#949ba4', fontSize: 12 }}># vorschau</span>
      </div>
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold"
            style={{ background: 'linear-gradient(135deg, var(--indigo) 0%, #7c3aed 100%)', color: '#fff', fontSize: 16 }}>D</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold" style={{ color: '#f2f3f5' }}>ModGuard</span>
              <span className="px-1 rounded text-[9px] font-bold" style={{ background: '#5865f2', color: '#fff' }}>BOT</span>
            </div>
            <div className="text-sm whitespace-pre-wrap" style={{ color: '#dbdee1', minHeight: content ? undefined : '0' }}>
              {content}
            </div>
            {embed ? (
              <div className="my-2 pl-3 py-2 rounded-r-md"
                style={{ borderLeft: `4px solid ${embed.color ? `#${embed.color.replace('#','')}` : '#5865f2'}`, background: '#2b2d31' }}>
                {embed.title && <div className="text-sm font-semibold mb-1" style={{ color: '#fff' }}>{embed.title}</div>}
                {embed.description && <div className="text-xs" style={{ color: '#dbdee1', whiteSpace: 'pre-wrap' }}>{embed.description.slice(0, 120)}{embed.description.length > 120 ? '…' : ''}</div>}
                {!embed.title && !embed.description && <div className="text-xs italic" style={{ color: '#4e5058' }}>Embed: {embed.name}</div>}
              </div>
            ) : !content ? (
              <div className="text-sm mb-3 italic" style={{ color: '#4e5058' }}>Kein Nachrichtentext…</div>
            ) : null}
            <div className="mt-2" />

            {/* BUTTON preview */}
            {type === 'BUTTON' && (
              rows.length > 0 ? (
                <div className="space-y-1">
                  {rows.map((row, ri) => (
                    <div key={ri} className="flex flex-wrap gap-1">
                      {row.map((btn, bi) => <DiscordButton key={bi} btn={btn} />)}
                    </div>
                  ))}
                </div>
              ) : <div className="text-xs italic" style={{ color: '#4e5058' }}>Noch keine Buttons…</div>
            )}

            {/* SELECT preview */}
            {type === 'SELECT' && (
              <div className="rounded-md p-2.5 flex items-center justify-between"
                style={{ background: '#1e1f22', border: '1px solid #111214', minWidth: '200px', maxWidth: '400px' }}>
                <span className="text-sm" style={{ color: options.length === 0 ? '#4e5058' : '#949ba4', fontStyle: options.length === 0 ? 'italic' : 'normal' }}>
                  {placeholder || 'Wähle eine Rolle…'}
                </span>
                <span style={{ color: '#949ba4', fontSize: 12 }}>▼</span>
              </div>
            )}

            {/* REACTION preview */}
            {type === 'REACTION' && (
              reactions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {reactions.map((r, ri) => (
                    <span key={ri} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm"
                      style={{ background: '#383a40', border: '1px solid #4e5058', color: '#dbdee1' }}>
                      <EmojiDisplay emoji={r.emoji} size={16} fallback="?" /> <span style={{ color: '#5865f2', fontSize: 12, fontWeight: 600 }}>1</span>
                    </span>
                  ))}
                </div>
              ) : <div className="text-xs italic" style={{ color: '#4e5058' }}>Noch keine Reaktionen…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReactionRolesPage() {
  const [groups, setGroups] = useState<RRGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [embeds, setEmbeds] = useState<SavedEmbedSummary[]>([]);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [messageMode, setMessageMode] = useState<'text' | 'embed'>('text');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [allowedRoleInput, setAllowedRoleInput] = useState('');
  const { showToast, toastElement } = useToast(3000);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, chRes, roRes, emRes] = await Promise.all([
        fetch('/api/reaction-roles', { cache: 'no-store' }),
        fetch('/api/channels', { cache: 'no-store' }),
        fetch('/api/roles', { cache: 'no-store' }),
        fetch('/api/embeds', { cache: 'no-store' }),
      ]);
      if (gRes.ok) setGroups(await gRes.json());
      if (chRes.ok) {
        const ch = (await chRes.json()) as GuildChannel[];
        setChannels(ch.filter((c) => c.type === 0 || c.type === 5).sort((a, b) => a.name.localeCompare(b.name)));
      }
      if (roRes.ok) {
        const ro = (await roRes.json()) as GuildRole[];
        setRoles(ro.filter((r) => r.name !== '@everyone').sort((a, b) => a.name.localeCompare(b.name)));
      }
      if (emRes.ok) setEmbeds(await emRes.json());
    } catch {
      showToast('Fehler beim Laden', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startEdit(id: string) {
    const res = await fetch(`/api/reaction-roles/${id}`, { cache: 'no-store' });
    if (!res.ok) { showToast('Fehler beim Laden der Gruppe', 'error'); return; }
    const g: RRGroup = await res.json();
    setMessageMode(g.embedId ? 'embed' : 'text');
    setForm({
      name: g.name,
      type: (g.type as RRType) ?? 'BUTTON',
      channelId: g.channelId,
      messageContent: g.messageContent ?? '',
      embedId: g.embedId,
      exclusive: g.exclusive,
      allowedRoleIds: g.allowedRoleIds,
      messageId: g.messageId,
      sentAt: g.sentAt,
      placeholder: g.placeholder ?? '',
      buttons: (g.buttons ?? []).map((b) => ({ ...b, emoji: b.emoji ?? '' })),
      options: (g.options ?? []).map((o) => ({ ...o, emoji: o.emoji ?? '', description: o.description ?? '' })),
      reactions: (g.reactions ?? []).map((r) => ({ ...r, selfRemove: (r as any).selfRemove ?? false })),
    });
    setEditingId(id);
    setAllowedRoleInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startNew() {
    setForm(emptyForm());
    setMessageMode('text');
    setEditingId('new');
    setAllowedRoleInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() { setEditingId(null); }

  // ── Button helpers
  function addButton() {
    setForm((f) => ({ ...f, buttons: [...f.buttons, { label: '', emoji: '', roleId: '', style: 'SECONDARY', behavior: 'toggle', position: f.buttons.length }] }));
  }
  function removeButton(i: number) {
    setForm((f) => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i).map((b, idx) => ({ ...b, position: idx })) }));
  }
  function updateButton(i: number, patch: Partial<RRButton>) {
    setForm((f) => ({ ...f, buttons: f.buttons.map((b, idx) => idx === i ? { ...b, ...patch } : b) }));
  }
  function moveButton(i: number, dir: -1 | 1) {
    const j = i + dir;
    setForm((f) => { const btns = [...f.buttons]; [btns[i], btns[j]] = [btns[j], btns[i]]; return { ...f, buttons: btns.map((b, idx) => ({ ...b, position: idx })) }; });
  }

  // ── Option helpers
  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, { label: '', description: '', emoji: '', roleId: '', position: f.options.length }] }));
  }
  function removeOption(i: number) {
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i).map((o, idx) => ({ ...o, position: idx })) }));
  }
  function updateOption(i: number, patch: Partial<RROption>) {
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => idx === i ? { ...o, ...patch } : o) }));
  }
  function moveOption(i: number, dir: -1 | 1) {
    const j = i + dir;
    setForm((f) => { const opts = [...f.options]; [opts[i], opts[j]] = [opts[j], opts[i]]; return { ...f, options: opts.map((o, idx) => ({ ...o, position: idx })) }; });
  }

  // ── Reaction helpers
  function addReaction() {
    setForm((f) => ({ ...f, reactions: [...f.reactions, { emoji: '', roleId: '', selfRemove: false }] }));
  }
  function removeReaction(i: number) {
    setForm((f) => ({ ...f, reactions: f.reactions.filter((_, idx) => idx !== i) }));
  }
  function updateReaction(i: number, patch: Partial<RRReaction>) {
    setForm((f) => ({ ...f, reactions: f.reactions.map((r, idx) => idx === i ? { ...r, ...patch } : r) }));
  }

  async function save(): Promise<boolean> {
    if (!form.name || !form.channelId) { showToast('Name und Kanal sind Pflicht', 'error'); return false; }
    if (form.type === 'BUTTON' && form.buttons.some((b) => !b.label || !b.roleId)) { showToast('Alle Buttons brauchen Label und Rolle', 'error'); return false; }
    if (form.type === 'SELECT' && form.options.some((o) => !o.label || !o.roleId)) { showToast('Alle Optionen brauchen Label und Rolle', 'error'); return false; }
    if (form.type === 'REACTION' && form.reactions.some((r) => !r.emoji || !r.roleId)) { showToast('Alle Reaktionen brauchen Emoji und Rolle', 'error'); return false; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        messageContent: messageMode === 'text' ? (form.messageContent || null) : null,
        embedId: messageMode === 'embed' ? (form.embedId || null) : null,
        buttons: form.buttons.map((b, i) => ({ ...b, emoji: b.emoji || undefined, position: i })),
        options: form.options.map((o, i) => ({ ...o, emoji: o.emoji || undefined, description: o.description || undefined, position: i })),
        reactions: form.reactions,
        placeholder: form.placeholder || undefined,
      };
      const isNew = editingId === 'new';
      const res = await fetch(isNew ? '/api/reaction-roles' : `/api/reaction-roles/${editingId}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast(isNew ? 'Erstellt' : 'Gespeichert');
      setEditingId(null);
      await load();
      return true;
    } catch {
      showToast('Fehler beim Speichern', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndSend() {
    if (editingId === null || editingId === 'new') return;
    const id = editingId;
    const ok = await save();
    if (ok) await sendMessage(id);
  }

  async function sendMessage(id: string) {
    setSending(true);
    try {
      const res = await fetch(`/api/reaction-roles/${id}/send`, { method: 'POST' });
      if (!res.ok) { showToast('Serverfehler beim Senden', 'error'); return; }
      const data = await res.json();
      if (data.ok) {
        showToast(data.action === 'updated' ? 'Nachricht aktualisiert' : 'Nachricht gesendet');
        await load();
      } else {
        showToast(data.error ?? 'Fehler beim Senden', 'error');
      }
    } catch {
      showToast('Fehler beim Senden', 'error');
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(id: string) {
    try {
      const res = await fetch(`/api/reaction-roles/${id}/message`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Discord-Nachricht gelöscht');
      await load();
    } catch { showToast('Fehler beim Löschen der Nachricht', 'error'); }
  }

  async function deleteMessageAndRefreshForm(id: string) {
    await deleteMessage(id);
    setForm((f) => ({ ...f, messageId: null, sentAt: null }));
  }

  async function deleteGroup(id: string) {
    if (!confirm('Reaktionsrolle löschen? Discord-Nachricht wird ebenfalls gelöscht.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/reaction-roles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Gelöscht');
      setEditingId(null);
      await load();
    } catch { showToast('Fehler beim Löschen', 'error'); }
    finally { setDeleting(null); }
  }

  const tabs: { key: RRType; label: string }[] = [
    { key: 'BUTTON',   label: 'Buttons' },
    { key: 'SELECT',   label: 'Selektoren' },
    { key: 'REACTION', label: 'Reaktionen' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Reaktionsrollen</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Button-, Selektor- oder Reaktions-basierte Rollenvergabe</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: loading ? 0.6 : 1 }}>
            Aktualisieren
          </button>
          {editingId === null && (
            <button onClick={startNew}
              className="px-4 py-1.5 rounded-md text-xs font-bold"
              style={{ background: 'var(--indigo)', color: '#fff' }}>
              + Neu erstellen
            </button>
          )}
        </div>
      </div>

      {/* ─── Editor ─── */}
      {editingId !== null && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'var(--indigo)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {editingId === 'new' ? 'Neue Reaktionsrolle erstellen' : `"${form.name}" bearbeiten`}
              </h2>
            </div>
            <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-md"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
              Abbrechen
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            {/* ── Config column ── */}
            <div className="xl:col-span-3 space-y-4">

              {/* Reaktionsrolle card */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Reaktionsrolle</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name *</label>
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="z.B. Spielerollen"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Kanal *</label>
                    <select value={form.channelId} onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                      <option value="">Kanal auswählen…</option>
                      {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Exklusiv toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setForm((f) => ({ ...f, exclusive: !f.exclusive }))}
                    className="w-8 h-4 rounded-full relative transition-colors flex-shrink-0"
                    style={{ background: form.exclusive ? 'var(--indigo)' : 'var(--border-default)', cursor: 'pointer' }}>
                    <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all"
                      style={{ left: form.exclusive ? '17px' : '2px' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Exklusiv</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(nur 1 Rolle gleichzeitig)</span>
                </label>

                {/* Allowed roles */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Rollen-Whitelist <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leer = alle)</span>
                  </label>
                  <div className="flex gap-2">
                    <select value={allowedRoleInput} onChange={(e) => setAllowedRoleInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                      <option value="">Rolle auswählen…</option>
                      {roles.filter((r) => !form.allowedRoleIds.includes(r.id)).map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <button onClick={() => { if (allowedRoleInput && !form.allowedRoleIds.includes(allowedRoleInput)) { setForm((f) => ({ ...f, allowedRoleIds: [...f.allowedRoleIds, allowedRoleInput] })); setAllowedRoleInput(''); } }}
                      className="px-3 py-2 rounded-lg text-xs font-bold"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                      + Hinzufügen
                    </button>
                  </div>
                  {form.allowedRoleIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.allowedRoleIds.map((rid) => {
                        const role = roles.find((r) => r.id === rid);
                        return (
                          <span key={rid} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                            {role && <span style={{ color: roleColor(role.color) }}>●</span>}
                            {role?.name ?? rid}
                            <button onClick={() => setForm((f) => ({ ...f, allowedRoleIds: f.allowedRoleIds.filter((x) => x !== rid) }))}
                              className="ml-1" style={{ color: 'var(--text-muted)' }}>✕</button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Nachricht card */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Nachricht</p>
                <div>
                  <div className="flex gap-1 mb-3 p-0.5 rounded-lg w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                    {(['text', 'embed'] as const).map((mode) => (
                      <button key={mode} onClick={() => setMessageMode(mode)}
                        className="px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                        style={{
                          background: messageMode === mode ? 'var(--indigo)' : 'transparent',
                          color: messageMode === mode ? '#fff' : 'var(--text-muted)',
                        }}>
                        {mode === 'text' ? 'Nur Text' : 'Embed'}
                      </button>
                    ))}
                  </div>

                  {messageMode === 'text' ? (
                    <textarea value={form.messageContent ?? ''} onChange={(e) => setForm((f) => ({ ...f, messageContent: e.target.value }))}
                      rows={3} placeholder="Klicke unten um eine Rolle zu erhalten…"
                      className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                  ) : (
                    <div className="space-y-2">
                      <select value={form.embedId ?? ''} onChange={(e) => setForm((f) => ({ ...f, embedId: e.target.value || null }))}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: form.embedId ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        <option value="">Embed auswählen…</option>
                        {embeds.map((e) => <option key={e.id} value={e.id}>{e.name}{e.title ? ` — ${e.title}` : ''}</option>)}
                      </select>
                      {embeds.length === 0 && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Noch keine Embeds.{' '}
                          <a href="/dashboard/embeds" className="underline" style={{ color: 'var(--indigo-bright)' }}>Zum Embed Builder →</a>
                        </p>
                      )}
                      {form.embedId && embeds.length > 0 && (
                        <a href="/dashboard/embeds" className="text-xs underline" style={{ color: 'var(--text-muted)' }}>Embed Builder öffnen →</a>
                      )}
                    </div>
                  )}
                </div>

                {/* Discord Nachricht — read-only status + delete */}
                {editingId !== 'new' && (
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Discord Nachricht</label>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: form.messageId ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      <span style={{ fontStyle: form.messageId ? 'normal' : 'italic' }}>
                        {form.messageId
                          ? `#${channels.find((c) => c.id === form.channelId)?.name ?? form.channelId} – gesendet: ${formatSentAt(form.sentAt)}`
                          : 'Noch nicht gesendet'}
                      </span>
                      {form.messageId && (
                        <button onClick={() => deleteMessageAndRefreshForm(editingId as string)}
                          title="Discord-Nachricht löschen"
                          className="ml-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>✕</button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs + items editor */}
              <div className="rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                <div className="flex border-b" style={{ borderColor: 'var(--border-default)' }}>
                  {tabs.map((tab) => (
                    <button key={tab.key} onClick={() => setForm((f) => ({ ...f, type: tab.key }))}
                      className="px-4 py-3 text-xs font-semibold relative transition-colors"
                      style={{ color: form.type === tab.key ? 'var(--indigo-bright)' : 'var(--text-muted)' }}>
                      {tab.label}
                      {form.type === tab.key && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--indigo)' }} />
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-4 space-y-3">

                  {/* ── BUTTON editor ── */}
                  {form.type === 'BUTTON' && (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Buttons</p>
                      {form.buttons.length === 0 ? (
                        <EmptyState icon="🎛️" text="Noch keine Buttons" sub='Klicke "+ Button" um einen hinzuzufügen' />
                      ) : (
                        <div className="space-y-2">
                          {form.buttons.map((btn, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-card)' }}>
                              <MoveArrows i={i} max={form.buttons.length} onMove={(d) => moveButton(i, d)} />
                              <div className="w-14 flex-shrink-0">
                                <EmojiInput value={btn.emoji} onChange={(v) => updateButton(i, { emoji: v })}
                                  placeholder="🎮"
                                  inputClassName="w-full px-2 py-1.5 rounded-lg text-sm text-center outline-none"
                                  inputStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                              </div>
                              <input value={btn.label} onChange={(e) => updateButton(i, { label: e.target.value })}
                                placeholder="Label *" className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                              <div className="w-40 flex-shrink-0">
                                <RoleSelect value={btn.roleId} roles={roles} onChange={(v) => updateButton(i, { roleId: v })} />
                              </div>
                              <StyleSwatches value={btn.style} onChange={(v) => updateButton(i, { style: v })} />
                              <SegmentedBehavior value={btn.behavior} onChange={(v) => updateButton(i, { behavior: v })} />
                              <DeleteBtn onClick={() => removeButton(i)} />
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={addButton} disabled={form.buttons.length >= 25}
                        className="mt-2 px-3 py-1.5 rounded-md text-xs font-bold"
                        style={{ background: 'var(--indigo)', color: '#fff', opacity: form.buttons.length >= 25 ? 0.4 : 1 }}>
                        + Button
                      </button>
                    </>
                  )}

                  {/* ── SELECT editor ── */}
                  {form.type === 'SELECT' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Placeholder-Text</label>
                        <input value={form.placeholder} onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
                          placeholder="Wähle eine Rolle…"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                      </div>

                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1 mt-3" style={{ color: 'var(--text-muted)' }}>Optionen</p>
                      {form.options.length === 0 ? (
                        <EmptyState icon="☰" text="Noch keine Optionen" sub='Klicke "+ Option" um eine hinzuzufügen' />
                      ) : (
                        <div className="space-y-2">
                          {form.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-card)' }}>
                              <MoveArrows i={i} max={form.options.length} onMove={(d) => moveOption(i, d)} />
                              <div className="w-14 flex-shrink-0">
                                <EmojiInput value={opt.emoji} onChange={(v) => updateOption(i, { emoji: v })}
                                  placeholder="🎮"
                                  inputClassName="w-full px-2 py-1.5 rounded-lg text-sm text-center outline-none"
                                  inputStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                              </div>
                              <input value={opt.label} onChange={(e) => updateOption(i, { label: e.target.value })}
                                placeholder="Label *" className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                              <input value={opt.description} onChange={(e) => updateOption(i, { description: e.target.value })}
                                placeholder="Beschreibung" className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                              <div className="w-40 flex-shrink-0">
                                <RoleSelect value={opt.roleId} roles={roles} onChange={(v) => updateOption(i, { roleId: v })} />
                              </div>
                              <DeleteBtn onClick={() => removeOption(i)} />
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={addOption} disabled={form.options.length >= 25}
                        className="mt-2 px-3 py-1.5 rounded-md text-xs font-bold"
                        style={{ background: 'var(--indigo)', color: '#fff', opacity: form.options.length >= 25 ? 0.4 : 1 }}>
                        + Option
                      </button>
                    </>
                  )}

                  {/* ── REACTION editor ── */}
                  {form.type === 'REACTION' && (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Reaktionen</p>
                      {form.reactions.length === 0 ? (
                        <EmptyState icon="😀" text="Noch keine Reaktionen" sub='Klicke "+ Reaktion" um eine hinzuzufügen' />
                      ) : (
                        <div className="space-y-2">
                          {form.reactions.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                              <div className="w-14 flex-shrink-0">
                                <EmojiInput value={r.emoji} onChange={(v) => updateReaction(i, { emoji: v })}
                                  placeholder="🎮"
                                  inputClassName="w-full px-2 py-1.5 rounded-lg text-sm text-center outline-none"
                                  inputStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <RoleSelect value={r.roleId} roles={roles} onChange={(v) => updateReaction(i, { roleId: v })} />
                              </div>
                              <button onClick={() => updateReaction(i, { selfRemove: !r.selfRemove })}
                                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                                style={{
                                  background: r.selfRemove ? 'var(--amber-bg)' : 'var(--bg-elevated)',
                                  border: `1px solid ${r.selfRemove ? 'rgba(251,191,36,0.4)' : 'var(--border-default)'}`,
                                  color: r.selfRemove ? 'var(--amber)' : 'var(--text-muted)',
                                }}>
                                {r.selfRemove ? '✓ Self-Remove' : '○ Self-Remove'}
                              </button>
                              <DeleteBtn onClick={() => removeReaction(i)} />
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={addReaction}
                        className="mt-2 px-3 py-1.5 rounded-md text-xs font-bold"
                        style={{ background: 'var(--indigo)', color: '#fff' }}>
                        + Reaktion
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Save row */}
              <div className="flex justify-end gap-2">
                <button onClick={cancelEdit} className="px-4 py-2 rounded-lg text-sm"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
                  Abbrechen
                </button>
                <button onClick={save} disabled={saving}
                  className="px-5 py-2 rounded-lg text-sm font-bold"
                  style={{ background: 'var(--indigo)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Speichere…' : 'Speichern'}
                </button>
              </div>
            </div>

            {/* ── Preview column ── */}
            <div className="xl:col-span-2 space-y-4">
              <div className="sticky top-4 space-y-4">
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Discord-Vorschau</p>
                  <DiscordPreview
                    content={messageMode === 'text' ? (form.messageContent ?? '') : ''}
                    embed={messageMode === 'embed' ? (embeds.find((e) => e.id === form.embedId) ?? null) : null}
                    type={form.type}
                    buttons={form.buttons}
                    options={form.options}
                    reactions={form.reactions}
                    placeholder={form.placeholder}
                  />
                  {form.type === 'REACTION' && (
                    <p className="text-[11px]" style={{ color: 'var(--amber)' }}>
                      ⚠ Bot reagiert automatisch auf die Nachricht nach dem Senden.
                    </p>
                  )}
                </div>
                {editingId !== 'new' && (
                  <button onClick={saveAndSend} disabled={sending || saving}
                    className="w-full py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: '#248046', color: '#fff', opacity: (sending || saving) ? 0.6 : 1 }}>
                    {sending || saving ? 'Wird gesendet…' : '▶ Senden / Aktualisieren'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Group list ─── */}
      {loading ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Lade…</div>
      ) : groups.length === 0 && editingId === null ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="text-4xl">🎛️</div>
          <div className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>Noch keine Reaktionsrollen</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Erstelle deine erste Reaktionsrolle um Mitgliedern die Rollenwahl zu ermöglichen</div>
          <button onClick={startNew} className="mt-2 px-5 py-2 rounded-lg text-sm font-bold" style={{ background: 'var(--indigo)', color: '#fff' }}>
            + Jetzt erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const channel = channels.find((c) => c.id === g.channelId);
            const isEditing = editingId === g.id;
            const typeLabel = g.type === 'SELECT' ? 'Selektor' : g.type === 'REACTION' ? 'Reaktion' : 'Buttons';
            const itemCount = g.type === 'SELECT' ? (g._count?.options ?? 0) : g.type === 'REACTION' ? (g._count?.reactions ?? 0) : (g._count?.buttons ?? 0);
            const typeIcon = g.type === 'SELECT' ? '☰' : g.type === 'REACTION' ? '😀' : '🎛️';
            return (
              <div key={g.id} className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${isEditing ? 'var(--indigo)' : 'var(--border-default)'}`, background: 'var(--bg-elevated)' }}>
                <div className="flex items-center gap-4 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: 'var(--indigo-bg)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {typeIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{g.name}</span>
                      {g.messageId ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: 'var(--emerald-bg)', color: 'var(--emerald)', border: '1px solid rgba(52,211,153,0.3)' }}>● Aktiv</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>○ Ausstehend</span>
                      )}
                      {g.exclusive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.3)' }}>Exklusiv</span>
                      )}
                      {g.embedId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--indigo-bg)', color: 'var(--indigo-bright)', border: '1px solid rgba(99,102,241,0.3)' }}>Embed</span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>
                        {typeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>#{channel?.name ?? g.channelId}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{itemCount} {typeLabel.toLowerCase()}{itemCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => sendMessage(g.id)} disabled={sending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: '#248046', color: '#fff', opacity: sending ? 0.5 : 1 }}>
                      {g.messageId ? '↻ Update' : '▶ Senden'}
                    </button>
                    <button onClick={() => isEditing ? cancelEdit() : startEdit(g.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: isEditing ? 'var(--indigo-bg)' : 'var(--bg-card)', border: `1px solid ${isEditing ? 'var(--indigo)' : 'var(--border-default)'}`, color: isEditing ? 'var(--indigo-bright)' : 'var(--text-secondary)' }}>
                      {isEditing ? 'Schließen' : 'Bearbeiten'}
                    </button>
                    <button onClick={() => deleteGroup(g.id)} disabled={deleting === g.id}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium"
                      style={{ color: 'var(--red)', border: '1px solid transparent', opacity: deleting === g.id ? 0.4 : 1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toastElement}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function EmptyState({ icon, text, sub }: { icon: string; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="text-2xl">{icon}</div>
      <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{text}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function RoleSelect({ value, roles, onChange }: { value: string; roles: { id: string; name: string }[]; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
      <option value="">Auswählen…</option>
      {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
    </select>
  );
}

function MoveArrows({ i, max, onMove }: { i: number; max: number; onMove: (d: -1 | 1) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <button onClick={() => onMove(-1)} disabled={i === 0} className="text-[10px] leading-none px-1 py-0.5 rounded"
        style={{ color: 'var(--text-muted)', opacity: i === 0 ? 0.25 : 1 }}>▲</button>
      <button onClick={() => onMove(1)} disabled={i === max - 1} className="text-[10px] leading-none px-1 py-0.5 rounded"
        style={{ color: 'var(--text-muted)', opacity: i === max - 1 ? 0.25 : 1 }}>▼</button>
    </div>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-2 py-1 rounded-md text-xs font-medium transition-colors"
      style={{ color: 'var(--red)', background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-bg)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      ✕
    </button>
  );
}

function StyleSwatches({ value, onChange }: { value: string; onChange: (v: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER') => void }) {
  return (
    <div className="flex gap-1.5 pt-1 justify-center">
      {STYLE_META.map((s) => (
        <button key={s.value} onClick={() => onChange(s.value as any)} title={s.label}
          className="w-5 h-5 rounded-full transition-transform"
          style={{ background: s.bg, outline: value === s.value ? `2px solid ${s.bg}` : 'none', outlineOffset: '2px', transform: value === s.value ? 'scale(1.2)' : 'scale(1)' }} />
      ))}
    </div>
  );
}

function SegmentedBehavior({ value, onChange }: { value: string; onChange: (v: 'toggle' | 'add' | 'remove') => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
      {BEHAVIORS.map((beh) => (
        <button key={beh.value} onClick={() => onChange(beh.value)}
          className="px-2.5 py-1 text-[11px] font-medium transition-colors"
          style={{
            background: value === beh.value ? 'var(--indigo)' : 'var(--bg-card)',
            color: value === beh.value ? '#fff' : 'var(--text-muted)',
            borderRight: beh.value !== 'remove' ? '1px solid var(--border-default)' : 'none',
          }}>
          {beh.label}
        </button>
      ))}
    </div>
  );
}
