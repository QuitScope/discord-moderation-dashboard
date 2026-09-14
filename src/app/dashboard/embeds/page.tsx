'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import EmbedPreview from '@/components/EmbedPreview';

interface EmbedField { name: string; value: string; inline: boolean }

interface SavedEmbed {
  id: string;
  name: string;
  title: string | null;
  url: string | null;
  description: string | null;
  color: string | null;
  authorName: string | null;
  authorIcon: string | null;
  footerText: string | null;
  footerIcon: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  timestamp: boolean;
  fields: EmbedField[];
  createdAt: string;
}

interface GuildChannel { id: string; name: string; type: number }

interface FormState {
  name: string;
  title: string;
  url: string;
  description: string;
  color: string;
  authorName: string;
  authorIcon: string;
  footerText: string;
  footerIcon: string;
  imageUrl: string;
  thumbnailUrl: string;
  timestamp: boolean;
  fields: EmbedField[];
}

const emptyForm = (): FormState => ({
  name: '',
  title: '',
  url: '',
  description: '',
  color: '',
  authorName: '',
  authorIcon: '',
  footerText: '',
  footerIcon: '',
  imageUrl: '',
  thumbnailUrl: '',
  timestamp: false,
  fields: [],
});

const PRESET_COLORS = [
  '#5865F2', '#57F287', '#FEE75C', '#ED4245',
  '#EB459E', '#3498DB', '#E67E22', '#1ABC9C',
];

export default function EmbedsPage() {
  const [embeds, setEmbeds] = useState<SavedEmbed[]>([]);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sendChannelId, setSendChannelId] = useState('');
  const [sending, setSending] = useState(false);
  const [activeSection, setActiveSection] = useState<'content' | 'author' | 'footer' | 'images' | 'fields'>('content');
  const { showToast, toastElement } = useToast(3000);

  const load = useCallback(async () => {
    setLoading(true);
    const [eRes, chRes] = await Promise.all([
      fetch('/api/embeds', { cache: 'no-store' }),
      fetch('/api/channels', { cache: 'no-store' }),
    ]);
    if (eRes.ok) setEmbeds(await eRes.json());
    if (chRes.ok) {
      const ch = (await chRes.json()) as GuildChannel[];
      setChannels(ch.filter((c) => c.type === 0 || c.type === 5).sort((a, b) => a.name.localeCompare(b.name)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startEdit(id: string) {
    const res = await fetch(`/api/embeds/${id}`, { cache: 'no-store' });
    if (!res.ok) return;
    const e: SavedEmbed = await res.json();
    setForm({
      name: e.name,
      title: e.title ?? '',
      url: e.url ?? '',
      description: e.description ?? '',
      color: e.color ?? '',
      authorName: e.authorName ?? '',
      authorIcon: e.authorIcon ?? '',
      footerText: e.footerText ?? '',
      footerIcon: e.footerIcon ?? '',
      imageUrl: e.imageUrl ?? '',
      thumbnailUrl: e.thumbnailUrl ?? '',
      timestamp: e.timestamp,
      fields: e.fields ?? [],
    });
    setEditingId(id);
    setActiveSection('content');
    setSendChannelId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startNew() {
    setForm(emptyForm());
    setEditingId('new');
    setActiveSection('content');
    setSendChannelId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() { setEditingId(null); }

  function patchForm(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  // Field helpers
  function addField() {
    setForm((f) => ({ ...f, fields: [...f.fields, { name: '', value: '', inline: false }] }));
  }
  function removeField(i: number) {
    setForm((f) => ({ ...f, fields: f.fields.filter((_, idx) => idx !== i) }));
  }
  function updateField(i: number, patch: Partial<EmbedField>) {
    setForm((f) => ({ ...f, fields: f.fields.map((fld, idx) => idx === i ? { ...fld, ...patch } : fld) }));
  }
  function moveField(i: number, dir: -1 | 1) {
    const j = i + dir;
    setForm((f) => { const flds = [...f.fields]; [flds[i], flds[j]] = [flds[j], flds[i]]; return { ...f, fields: flds }; });
  }

  async function save() {
    if (!form.name.trim()) { showToast('Name ist Pflicht', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        title: form.title || null,
        url: form.url || null,
        description: form.description || null,
        color: form.color || null,
        authorName: form.authorName || null,
        authorIcon: form.authorIcon || null,
        footerText: form.footerText || null,
        footerIcon: form.footerIcon || null,
        imageUrl: form.imageUrl || null,
        thumbnailUrl: form.thumbnailUrl || null,
        timestamp: form.timestamp,
        fields: form.fields,
      };
      const isNew = editingId === 'new';
      const res = await fetch(isNew ? '/api/embeds' : `/api/embeds/${editingId}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast(isNew ? 'Embed erstellt' : 'Embed gespeichert');
      setEditingId(null);
      await load();
    } catch {
      showToast('Fehler beim Speichern', 'error');
    } finally { setSaving(false); }
  }

  async function send() {
    if (!sendChannelId) { showToast('Kanal auswählen', 'error'); return; }
    if (!editingId || editingId === 'new') return;
    setSending(true);
    try {
      const res = await fetch(`/api/embeds/${editingId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: sendChannelId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) showToast('Embed gesendet');
      else showToast(data.error ?? 'Fehler beim Senden', 'error');
    } catch { showToast('Fehler beim Senden', 'error'); }
    finally { setSending(false); }
  }

  async function deleteEmbed(id: string) {
    if (!confirm('Embed löschen?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/embeds/${id}`, { method: 'DELETE' });
      showToast('Gelöscht');
      if (editingId === id) setEditingId(null);
      await load();
    } catch { showToast('Fehler', 'error'); }
    finally { setDeleting(null); }
  }

  // Build preview template object from form
  const previewData = {
    title: form.title || undefined,
    url: form.url || undefined,
    description: form.description || undefined,
    color: form.color || undefined,
    authorName: form.authorName || undefined,
    authorIcon: form.authorIcon || undefined,
    footerText: form.footerText || undefined,
    footerIcon: form.footerIcon || undefined,
    imageUrl: form.imageUrl || undefined,
    thumbnailUrl: form.thumbnailUrl || undefined,
    timestamp: form.timestamp,
    fields: form.fields.filter((f) => f.name || f.value),
  };

  const sections = [
    { key: 'content', label: 'Inhalt' },
    { key: 'author',  label: 'Author' },
    { key: 'footer',  label: 'Footer' },
    { key: 'images',  label: 'Bilder' },
    { key: 'fields',  label: `Felder (${form.fields.length})` },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Embed Builder</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Discord-Embeds erstellen, speichern und direkt senden</p>
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
              + Neues Embed
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
                {editingId === 'new' ? 'Neues Embed erstellen' : `"${form.name}" bearbeiten`}
              </h2>
            </div>
            <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-md"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
              Abbrechen
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            {/* ── Form column ── */}
            <div className="xl:col-span-3 space-y-4">

              {/* Name + Color */}
              <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Allgemein</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name *</label>
                    <input value={form.name} onChange={(e) => patchForm({ name: e.target.value })}
                      placeholder="Mein Embed"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Farbe (Seitenleiste)</label>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-shrink-0">
                        <input type="color" value={form.color ? `#${form.color.replace('#', '')}` : '#5865F2'}
                          onChange={(e) => patchForm({ color: e.target.value.replace('#', '') })}
                          className="w-10 h-9 rounded-lg cursor-pointer"
                          style={{ border: '1px solid var(--border-default)', padding: '2px' }} />
                      </div>
                      <input value={(form.color ?? '').replace('#', '')} onChange={(e) => patchForm({ color: e.target.value.replace('#', '').slice(0, 6) })}
                        placeholder="5865F2"
                        maxLength={6}
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                    </div>
                    {/* Preset colors */}
                    <div className="flex gap-1.5 mt-2">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} onClick={() => patchForm({ color: c.replace('#', '') })} title={c}
                          className="w-5 h-5 rounded-full transition-transform"
                          style={{ background: c, outline: (form.color ?? '').replace('#', '') === c.replace('#', '') ? `2px solid ${c}` : 'none', outlineOffset: '2px', transform: (form.color ?? '').replace('#', '') === c.replace('#', '') ? 'scale(1.2)' : 'scale(1)' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section tabs + content */}
              <div className="rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                {/* Tabs */}
                <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--border-default)' }}>
                  {sections.map((s) => (
                    <button key={s.key} onClick={() => setActiveSection(s.key)}
                      className="px-4 py-3 text-xs font-semibold relative whitespace-nowrap transition-colors"
                      style={{ color: activeSection === s.key ? 'var(--indigo-bright)' : 'var(--text-muted)' }}>
                      {s.label}
                      {activeSection === s.key && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--indigo)' }} />}
                    </button>
                  ))}
                  {activeSection === 'fields' && (
                    <button onClick={addField} disabled={form.fields.length >= 25}
                      className="ml-auto mr-3 my-2 px-3 py-1 rounded-md text-xs font-bold"
                      style={{ background: 'var(--indigo)', color: '#fff', opacity: form.fields.length >= 25 ? 0.4 : 1 }}>
                      + Feld
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {/* ── Content ── */}
                  {activeSection === 'content' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Titel</label>
                        <input value={form.title} onChange={(e) => patchForm({ title: e.target.value })}
                          placeholder="Embed-Titel"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Titel-URL (klickbarer Link)</label>
                        <input value={form.url} onChange={(e) => patchForm({ url: e.target.value })}
                          placeholder="https://…"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Beschreibung</label>
                          <div className="flex gap-1">
                            {['{user}', '{server}', '{memberCount}'].map((ph) => (
                              <button key={ph} onClick={() => patchForm({ description: form.description + ph })}
                                className="px-1.5 py-0.5 rounded text-[10px]"
                                style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>
                                {ph}
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea value={form.description} onChange={(e) => patchForm({ description: e.target.value })}
                          rows={5} placeholder="**Fett**, *kursiv*, `Code`, > Zitat…"
                          className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                          Markdown: **fett**, *kursiv*, ~~strikethrough~~, `code`, &gt; Zitat
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div onClick={() => patchForm({ timestamp: !form.timestamp })}
                          className="w-8 h-4 rounded-full relative transition-colors flex-shrink-0"
                          style={{ background: form.timestamp ? 'var(--indigo)' : 'var(--border-default)', cursor: 'pointer' }}>
                          <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all"
                            style={{ left: form.timestamp ? '17px' : '2px' }} />
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Timestamp anzeigen</span>
                      </label>
                    </>
                  )}

                  {/* ── Author ── */}
                  {activeSection === 'author' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Author-Name</label>
                        <input value={form.authorName} onChange={(e) => patchForm({ authorName: e.target.value })}
                          placeholder="ModGuard Bot"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Author-Icon (URL oder Emoji)</label>
                        <input value={form.authorIcon} onChange={(e) => patchForm({ authorIcon: e.target.value })}
                          placeholder="https://… oder 🤖"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                      </div>
                    </>
                  )}

                  {/* ── Footer ── */}
                  {activeSection === 'footer' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Footer-Text</label>
                        <input value={form.footerText} onChange={(e) => patchForm({ footerText: e.target.value })}
                          placeholder="ModGuard • modguard.example"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Footer-Icon (URL oder Emoji)</label>
                        <input value={form.footerIcon} onChange={(e) => patchForm({ footerIcon: e.target.value })}
                          placeholder="https://… oder 📌"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                      </div>
                    </>
                  )}

                  {/* ── Images ── */}
                  {activeSection === 'images' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Großes Bild (image URL)</label>
                        <input value={form.imageUrl} onChange={(e) => patchForm({ imageUrl: e.target.value })}
                          placeholder="https://…"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                        {form.imageUrl && (
                          <img src={form.imageUrl} alt="" className="mt-2 rounded-lg max-h-32 object-cover"
                            onError={(e) => (e.currentTarget.style.display = 'none')} />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Thumbnail (kleines Bild rechts)</label>
                        <input value={form.thumbnailUrl} onChange={(e) => patchForm({ thumbnailUrl: e.target.value })}
                          placeholder="https://…"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                        {form.thumbnailUrl && (
                          <img src={form.thumbnailUrl} alt="" className="mt-2 rounded-lg w-16 h-16 object-cover"
                            onError={(e) => (e.currentTarget.style.display = 'none')} />
                        )}
                      </div>
                    </>
                  )}

                  {/* ── Fields ── */}
                  {activeSection === 'fields' && (
                    form.fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="text-2xl">📋</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Noch keine Felder</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Max. 25 Felder, je 256/1024 Zeichen (Discord-Limit)</div>
                      </div>
                    ) : (
                      form.fields.map((fld, i) => (
                        <div key={i} className="rounded-xl p-3 space-y-2"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                          <div className="flex items-center gap-2">
                            {/* Move */}
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => moveField(i, -1)} disabled={i === 0}
                                className="text-[10px] px-1 py-0.5 rounded" style={{ color: 'var(--text-muted)', opacity: i === 0 ? 0.25 : 1 }}>▲</button>
                              <button onClick={() => moveField(i, 1)} disabled={i === form.fields.length - 1}
                                className="text-[10px] px-1 py-0.5 rounded" style={{ color: 'var(--text-muted)', opacity: i === form.fields.length - 1 ? 0.25 : 1 }}>▼</button>
                            </div>
                            <span className="text-xs font-medium flex-1" style={{ color: 'var(--text-muted)' }}>Feld {i + 1}</span>
                            {/* Inline toggle */}
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <div onClick={() => updateField(i, { inline: !fld.inline })}
                                className="w-7 h-3.5 rounded-full relative flex-shrink-0"
                                style={{ background: fld.inline ? 'var(--indigo)' : 'var(--border-default)', cursor: 'pointer' }}>
                                <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all"
                                  style={{ left: fld.inline ? '14px' : '1px' }} />
                              </div>
                              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Inline</span>
                            </label>
                            <button onClick={() => removeField(i)} className="text-xs px-1.5 py-1 rounded"
                              style={{ color: 'var(--red)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-bg)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>✕</button>
                          </div>
                          <input value={fld.name} onChange={(e) => updateField(i, { name: e.target.value })}
                            placeholder="Feldname" maxLength={256}
                            className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                          <textarea value={fld.value} onChange={(e) => updateField(i, { value: e.target.value })}
                            placeholder="Feldwert (Markdown unterstützt)" rows={2} maxLength={1024}
                            className="w-full px-2 py-1.5 rounded-lg text-xs resize-none outline-none"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                        </div>
                      ))
                    )
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
            <div className="xl:col-span-2">
              <div className="sticky top-4 space-y-4">
                {/* Preview */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Discord-Vorschau</p>
                  <div style={{ overflowX: 'auto' }}>
                    <EmbedPreview template={previewData} />
                  </div>
                </div>

                {/* Send panel (only for existing embeds) */}
                {editingId !== 'new' && (
                  <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Senden</p>
                    <select value={sendChannelId} onChange={(e) => setSendChannelId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                      <option value="">Kanal auswählen…</option>
                      {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    </select>
                    <button onClick={send} disabled={sending || !sendChannelId}
                      className="w-full py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: '#248046', color: '#fff', opacity: (sending || !sendChannelId) ? 0.6 : 1 }}>
                      {sending ? 'Wird gesendet…' : '▶ In Kanal senden'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Embed list ─── */}
      {loading ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Lade…</div>
      ) : embeds.length === 0 && editingId === null ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="text-4xl">📋</div>
          <div className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>Noch keine Embeds</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Erstelle deinen ersten Discord-Embed</div>
          <button onClick={startNew} className="mt-2 px-5 py-2 rounded-lg text-sm font-bold"
            style={{ background: 'var(--indigo)', color: '#fff' }}>
            + Jetzt erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {embeds.map((e) => {
            const isEditing = editingId === e.id;
            const accentColor = e.color ? `#${e.color.replace('#', '')}` : 'var(--indigo)';
            return (
              <div key={e.id} className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${isEditing ? 'var(--indigo)' : 'var(--border-default)'}`, background: 'var(--bg-elevated)' }}>
                <div className="flex items-center gap-4 px-4 py-3.5">
                  {/* Color accent bar */}
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: accentColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{e.name}</span>
                      {e.fields.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>
                          {e.fields.length} Felder
                        </span>
                      )}
                    </div>
                    {e.title && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{e.title}</div>}
                    {e.description && !e.title && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{e.description}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => isEditing ? cancelEdit() : startEdit(e.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: isEditing ? 'var(--indigo-bg)' : 'var(--bg-card)', border: `1px solid ${isEditing ? 'var(--indigo)' : 'var(--border-default)'}`, color: isEditing ? 'var(--indigo-bright)' : 'var(--text-secondary)' }}>
                      {isEditing ? 'Schließen' : 'Bearbeiten'}
                    </button>
                    <button onClick={() => deleteEmbed(e.id)} disabled={deleting === e.id}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium"
                      style={{ color: 'var(--red)', border: '1px solid transparent', opacity: deleting === e.id ? 0.4 : 1 }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.background = 'var(--red-bg)'; ev.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent'; ev.currentTarget.style.borderColor = 'transparent'; }}>
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
