'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { InterfacePreview } from './InterfacePreview';
import { DiscordImagePreview } from './DiscordImagePreview';
import { useCanWrite } from './WriteAccess';
import { SaveBar, fieldClass, fieldStyle } from './ui';
import { isDirty, type ActionMeta, type GuildChannel, type InterfaceConfig } from './types';

const DEFAULTS = {
  title: 'Voice-Interface',
  description: 'Besitzer: {OWNER}',
  color: '#a72d4d',
  webhookName: 'Voice-Interface',
} as const;

/**
 * A part of the embed that opens its editor when clicked.
 *
 * Editing in place rather than in a form beside the preview: the embed *is* the form, so what
 * you click is what changes, and there is no second list of fields to map back onto it.
 */
function EditablePart({ label, children, editor }: { label: string; children: ReactNode; editor: ReactNode }) {
  const canWrite = useCanWrite();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!canWrite) return <>{children}</>;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={`${label} bearbeiten`}
        className="text-left rounded px-1 -mx-1 transition-colors"
        style={{ border: `1px dashed ${open ? '#5865f2' : 'transparent'}` }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = open ? '#5865f2' : '#4e5058'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = open ? '#5865f2' : 'transparent'; }}
      >
        {children}
      </button>
      {open && (
        <div
          className="absolute z-30 mt-1 w-72 rounded-lg p-3 space-y-2"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</div>
          {editor}
        </div>
      )}
    </div>
  );
}

export function InterfaceEditor({ loaded, actions, channels, onSaved }: {
  loaded: InterfaceConfig;
  actions: ActionMeta[];
  channels: GuildChannel[];
  onSaved: (next: InterfaceConfig) => void;
}) {
  const canWrite = useCanWrite();
  const [form, setForm] = useState<InterfaceConfig>(loaded);
  const [saving, setSaving] = useState(false);
  const [sendChannelId, setSendChannelId] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => { setForm(loaded); }, [loaded]);

  const textChannels = channels.filter((c) => c.type === 0);
  // An empty layout means "each creator decides"; the preview then shows the full set, which
  // is what a fresh creator has.
  const previewOrder = form.buttonOrder.length > 0 ? form.buttonOrder : actions.map((a) => a.key);

  function set<K extends keyof InterfaceConfig>(key: K, value: InterfaceConfig[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const { id: _id, ...payload } = form;
      const res = await fetch('/api/tempvoice/interface', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as InterfaceConfig & { refresh?: { updated?: number; error?: string } };
      onSaved(saved);
      setForm(saved);
      // Saving always works; pushing the change into already-posted panels can fail on its own,
      // and saying so beats a silent "Gespeichert" while Discord still shows the old panel.
      setMessage(
        saved.refresh?.error
          ? { text: `Gespeichert, aber bestehende Interfaces konnten nicht aktualisiert werden: ${saved.refresh.error}`, error: true }
          : { text: `Gespeichert${saved.refresh?.updated ? ` · ${saved.refresh.updated} bestehende Interface-Nachricht(en) aktualisiert` : ''}` },
      );
    } catch {
      setMessage({ text: 'Fehler beim Speichern', error: true });
    } finally {
      setSaving(false);
    }
  }

  async function send() {
    if (!sendChannelId) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/tempvoice/interface/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: sendChannelId }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setMessage({ text: body.message ?? 'Interface konnte nicht gesendet werden', error: true });
        return;
      }
      const name = textChannels.find((c) => c.id === sendChannelId)?.name ?? 'den Kanal';
      setMessage({ text: `Das Interface wurde an #${name} gesendet.` });
    } catch {
      setMessage({ text: 'Interface konnte nicht gesendet werden', error: true });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: 'var(--indigo)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Interface</h2>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Klicke auf einen Teil der Nachricht, um ihn zu bearbeiten. Die Reihenfolge hier gilt für <b>alle</b> Panels;
        ist sie leer, entscheidet jeder Creator selbst.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <InterfacePreview
          key={actions.length}
          enabledActions={previewOrder}
          actions={actions}
          onChange={(next) => set('buttonOrder', next)}
          header={
            <div className="p-3 space-y-2" style={{ borderBottom: '1px solid #1e1f22' }}>
              <div className="flex items-center gap-2.5">
                <EditablePart
                  label="Webhook-Avatar (URL)"
                  editor={
                    <input className={fieldClass} style={fieldStyle} placeholder="https://…"
                      value={form.webhookAvatarUrl ?? ''}
                      onChange={(e) => set('webhookAvatarUrl', e.target.value || null)} />
                  }
                >
                  {form.webhookAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.webhookAvatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ background: 'linear-gradient(135deg, var(--indigo) 0%, #7c3aed 100%)' }}>🔊</div>
                  )}
                </EditablePart>

                <EditablePart
                  label="Webhook-Name"
                  editor={
                    <input className={fieldClass} style={fieldStyle} placeholder={DEFAULTS.webhookName}
                      value={form.webhookName ?? ''}
                      onChange={(e) => set('webhookName', e.target.value || null)} />
                  }
                >
                  <span className="text-sm font-semibold" style={{ color: '#f2f3f5' }}>
                    {form.webhookName || DEFAULTS.webhookName}
                  </span>
                </EditablePart>
                <span className="px-1 rounded text-[9px] font-bold" style={{ background: '#5865f2', color: '#fff' }}>APP</span>
              </div>

              <div className="pl-3 py-1.5" style={{ borderLeft: `3px solid ${form.embedColor || DEFAULTS.color}` }}>
                <EditablePart
                  label="Farbe (HEX)"
                  editor={
                    <div className="flex gap-2 items-center">
                      <input type="color" value={form.embedColor || DEFAULTS.color}
                        onChange={(e) => set('embedColor', e.target.value)} className="w-10 h-8 rounded" />
                      <input className={fieldClass} style={fieldStyle} placeholder={DEFAULTS.color}
                        value={form.embedColor ?? ''} onChange={(e) => set('embedColor', e.target.value || null)} />
                    </div>
                  }
                >
                  <span className="text-[9px] uppercase tracking-wide" style={{ color: '#6d6f78' }}>
                    Farbe {form.embedColor || DEFAULTS.color}
                  </span>
                </EditablePart>

                <div>
                  <EditablePart
                    label="Titel"
                    editor={
                      <input className={fieldClass} style={fieldStyle} placeholder={DEFAULTS.title}
                        value={form.embedTitle ?? ''} onChange={(e) => set('embedTitle', e.target.value || null)} />
                    }
                  >
                    <span className="text-sm font-bold" style={{ color: '#fff' }}>{form.embedTitle || DEFAULTS.title}</span>
                  </EditablePart>
                </div>

                <div>
                  <EditablePart
                    label="Beschreibung"
                    editor={
                      <div className="space-y-1">
                        <textarea rows={3} className={`${fieldClass} resize-none`} style={fieldStyle}
                          placeholder={DEFAULTS.description}
                          value={form.embedDescription ?? ''}
                          onChange={(e) => set('embedDescription', e.target.value || null)} />
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {'{OWNER}'} wird im Temp-Channel zum Besitzer. In einem Textkanal gibt es keinen — die Zeile entfällt dort.
                        </p>
                      </div>
                    }
                  >
                    <span className="text-xs whitespace-pre-wrap" style={{ color: '#b5bac1' }}>
                      {form.embedDescription || DEFAULTS.description}
                    </span>
                  </EditablePart>
                </div>

                <div className="mt-1">
                  <EditablePart
                    label="Anhang (Bild-URL)"
                    editor={
                      <input className={fieldClass} style={fieldStyle} placeholder="https://…"
                        value={form.embedImageUrl ?? ''} onChange={(e) => set('embedImageUrl', e.target.value || null)} />
                    }
                  >
                    <span className="text-[10px]" style={{ color: '#6d6f78' }}>
                      {form.embedImageUrl ? 'Anhang gesetzt' : '+ Anhang'}
                    </span>
                  </EditablePart>
                </div>

                <div className="mt-1">
                  <EditablePart
                    label="Footer"
                    editor={
                      <input className={fieldClass} style={fieldStyle}
                        value={form.embedFooter ?? ''} onChange={(e) => set('embedFooter', e.target.value || null)} />
                    }
                  >
                    <span className="text-[10px]" style={{ color: '#949ba4' }}>{form.embedFooter || '+ Footer'}</span>
                  </EditablePart>
                </div>
              </div>
            </div>
          }
        />

        <div className="space-y-3">
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Legendenbild</p>
            <DiscordImagePreview enabledActions={previewOrder} />
          </div>

          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Interface senden</p>
            <div className="flex gap-2">
              <select className={`flex-1 ${fieldClass}`} style={fieldStyle} disabled={!canWrite}
                value={sendChannelId} onChange={(e) => setSendChannelId(e.target.value)}>
                <option value="">Kanal wählen…</option>
                {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
              <button
                onClick={send}
                disabled={!canWrite || !sendChannelId || sending}
                className="px-4 py-2 rounded-lg text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--indigo)', color: '#fff', opacity: !canWrite || !sendChannelId || sending ? 0.5 : 1 }}
              >
                {sending ? 'Sendet…' : 'Senden'}
              </button>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Gesendete Interfaces werden bei einer Änderung hier automatisch neu gerendert.
            </p>
          </div>

          {message && (
            <div className="rounded-lg p-3 text-xs"
              style={{
                background: message.error ? 'var(--red-bg, rgba(239,68,68,0.1))' : 'var(--indigo-bg)',
                border: `1px solid ${message.error ? 'rgba(239,68,68,0.3)' : 'var(--indigo)'}`,
                color: message.error ? 'var(--red)' : 'var(--indigo-bright)',
              }}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      <SaveBar
        dirty={isDirty(form, loaded)}
        saving={saving}
        onSave={save}
        onReset={() => setForm(loaded)}
      />
    </div>
  );
}
