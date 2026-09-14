'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

type Tab = 'join' | 'leave';

const PRESETS = ['', 'centered', 'neon', 'minimal', 'hero'] as const;
const THEMES = ['', 'dark', 'light'] as const;

interface WelcomeCardConfig {
  joinCardEnabled: boolean;
  joinCardChannelId: string;
  joinCardPreset: string;
  joinCardBackground: string;
  joinCardTheme: string;
  joinCardSubtitle: string;
  joinCardMessage: string;
  joinCardShowMemberCount: boolean;
  joinCardRingColor: string;
  joinCardFontColor: string;
  joinCardFontUsernameColor: string;
  leaveCardEnabled: boolean;
  leaveCardChannelId: string;
  leaveCardPreset: string;
  leaveCardBackground: string;
  leaveCardTheme: string;
  leaveCardSubtitle: string;
  leaveCardBanSubtitle: string;
  leaveCardMessage: string;
  leaveCardRingColor: string;
  leaveCardFontColor: string;
  leaveCardFontUsernameColor: string;
}

const DEFAULTS: WelcomeCardConfig = {
  joinCardEnabled: false, joinCardChannelId: '', joinCardPreset: '', joinCardBackground: '',
  joinCardTheme: '', joinCardSubtitle: '', joinCardMessage: '', joinCardShowMemberCount: false,
  joinCardRingColor: '', joinCardFontColor: '', joinCardFontUsernameColor: '',
  leaveCardEnabled: false, leaveCardChannelId: '', leaveCardPreset: '', leaveCardBackground: '',
  leaveCardTheme: '', leaveCardSubtitle: '', leaveCardBanSubtitle: '', leaveCardMessage: '',
  leaveCardRingColor: '', leaveCardFontColor: '', leaveCardFontUsernameColor: '',
};

function normalizeConfig(raw: Record<string, unknown>): WelcomeCardConfig {
  return {
    joinCardEnabled: Boolean(raw.joinCardEnabled),
    joinCardChannelId: (raw.joinCardChannelId as string) ?? '',
    joinCardPreset: (raw.joinCardPreset as string) ?? '',
    joinCardBackground: (raw.joinCardBackground as string) ?? '',
    joinCardTheme: (raw.joinCardTheme as string) ?? '',
    joinCardSubtitle: (raw.joinCardSubtitle as string) ?? '',
    joinCardMessage: (raw.joinCardMessage as string) ?? '',
    joinCardShowMemberCount: Boolean(raw.joinCardShowMemberCount),
    joinCardRingColor: (raw.joinCardRingColor as string) ?? '',
    joinCardFontColor: (raw.joinCardFontColor as string) ?? '',
    joinCardFontUsernameColor: (raw.joinCardFontUsernameColor as string) ?? '',
    leaveCardEnabled: Boolean(raw.leaveCardEnabled),
    leaveCardChannelId: (raw.leaveCardChannelId as string) ?? '',
    leaveCardPreset: (raw.leaveCardPreset as string) ?? '',
    leaveCardBackground: (raw.leaveCardBackground as string) ?? '',
    leaveCardTheme: (raw.leaveCardTheme as string) ?? '',
    leaveCardSubtitle: (raw.leaveCardSubtitle as string) ?? '',
    leaveCardBanSubtitle: (raw.leaveCardBanSubtitle as string) ?? '',
    leaveCardMessage: (raw.leaveCardMessage as string) ?? '',
    leaveCardRingColor: (raw.leaveCardRingColor as string) ?? '',
    leaveCardFontColor: (raw.leaveCardFontColor as string) ?? '',
    leaveCardFontUsernameColor: (raw.leaveCardFontUsernameColor as string) ?? '',
  };
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
      style={{
        background: value ? 'var(--indigo)' : 'var(--bg-card)',
        border: `1px solid ${value ? 'var(--indigo)' : 'var(--border-default)'}`,
      }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
        style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-1.5 rounded-md text-sm';
const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' };

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      className={inputCls}
      style={inputStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? ''}
    />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select className={inputCls} style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function renderMessagePreview(template: string, previewUsername: string, previewServerName: string): React.ReactNode {
  const resolved = template
    .replace(/{username}/g, previewUsername)
    .replace(/{count}/g, '42')
    .replace(/{server}/g, previewServerName);
  return resolved.split(/({user})/g).map((part, i) =>
    part === '{user}' ? (
      <span
        key={i}
        className="rounded px-1"
        style={{ background: 'rgba(88,101,242,0.3)', color: '#a6b6ff' }}
      >
        @{previewUsername}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function ColorField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded cursor-pointer border-0 p-0"
          style={{ background: 'none' }}
        />
        <TextInput value={value} onChange={onChange} placeholder="#ffffff" />
      </div>
    </Field>
  );
}

export function WelcomeCardClient({ previewUsername, previewServerName }: { previewUsername: string; previewServerName: string }) {
  const [draft, setDraft] = useState<WelcomeCardConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('join');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const { showToast, toastElement } = useToast();

  const set = useCallback(<K extends keyof WelcomeCardConfig>(key: K, value: WelcomeCardConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    fetch('/api/welcome-card', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setDraft(normalizeConfig(data)))
      .catch(() => showToast('Konfiguration konnte nicht geladen werden.', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const loadPreview = useCallback(async (currentDraft: WelcomeCardConfig, currentTab: Tab) => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/welcome-card/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: currentTab, ...currentDraft }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      previewUrlRef.current = url;
    } catch {
      showToast('Vorschau konnte nicht geladen werden.', 'error');
    } finally {
      setPreviewLoading(false);
    }
  }, [showToast]);

  // Debounced auto-preview: fires 600ms after last change
  useEffect(() => {
    if (loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPreview(draft, tab);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft, tab, loading, loadPreview]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/welcome-card', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      showToast('Gespeichert');
    } catch {
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Welcome Card"
        subtitle="Bild-Cards für Join und Leave konfigurieren"
        actions={
          <button
            onClick={save}
            disabled={saving || loading}
            className="px-4 py-1.5 rounded-md text-sm font-semibold"
            style={{ background: 'var(--indigo)', color: '#fff', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {(['join', 'leave'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-sm font-medium"
            style={{
              background: tab === t ? 'var(--indigo-bg)' : 'var(--bg-elevated)',
              border: `1px solid ${tab === t ? 'rgba(99,102,241,0.4)' : 'var(--border-default)'}`,
              color: tab === t ? 'var(--indigo-bright)' : 'var(--text-secondary)',
            }}
          >
            {t === 'join' ? 'Join Card' : 'Leave Card'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade…</span>
        </div>
      ) : (
        <div className="flex gap-6 flex-col xl:flex-row">
          {/* Form */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>

              {tab === 'join' && (
                <>
                  <Field label="Join Card aktiv">
                    <div className="flex items-center gap-3">
                      <Toggle value={draft.joinCardEnabled} onChange={(v) => set('joinCardEnabled', v)} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {draft.joinCardEnabled ? 'Aktiviert' : 'Deaktiviert'}
                      </span>
                    </div>
                  </Field>
                  <Field label="Join Channel ID" hint="Discord Channel-ID für Join-Cards">
                    <TextInput value={draft.joinCardChannelId} onChange={(v) => set('joinCardChannelId', v)} placeholder="123456789012345678" />
                  </Field>
                  <Field label="Preset">
                    <SelectInput
                      value={draft.joinCardPreset}
                      onChange={(v) => set('joinCardPreset', v)}
                      options={PRESETS.map((p) => ({ value: p, label: p || '— Standard —' }))}
                    />
                  </Field>
                  <Field label="Hintergrund" hint="Hex-Farbe (#1e1e2e) oder Bild-URL">
                    <TextInput value={draft.joinCardBackground} onChange={(v) => set('joinCardBackground', v)} placeholder="#1e1e2e oder https://…" />
                  </Field>
                  <Field label="Theme">
                    <SelectInput
                      value={draft.joinCardTheme}
                      onChange={(v) => set('joinCardTheme', v)}
                      options={THEMES.map((t) => ({ value: t, label: t || '— Standard —' }))}
                    />
                  </Field>
                  <Field label="Subtitle" hint="Text unter dem Username">
                    <TextInput value={draft.joinCardSubtitle} onChange={(v) => set('joinCardSubtitle', v)} placeholder="Willkommen!" />
                  </Field>
                  <Field label="Nachricht" hint="Text über dem Bild · Platzhalter: {user} {username} {count} {server}">
                    <textarea
                      className={inputCls}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                      value={draft.joinCardMessage}
                      onChange={(e) => set('joinCardMessage', e.target.value)}
                      placeholder="Willkommen auf dem Server, {user}!"
                      rows={2}
                    />
                  </Field>
                  <Field label="Mitgliederzahl anzeigen">
                    <div className="flex items-center gap-3">
                      <Toggle value={draft.joinCardShowMemberCount} onChange={(v) => set('joinCardShowMemberCount', v)} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {draft.joinCardShowMemberCount ? 'Ja' : 'Nein'}
                      </span>
                    </div>
                  </Field>
                  <ColorField label="Ring-Farbe" value={draft.joinCardRingColor} onChange={(v) => set('joinCardRingColor', v)} />
                  <ColorField label="Subtitle-Farbe" value={draft.joinCardFontColor} onChange={(v) => set('joinCardFontColor', v)} />
                  <ColorField label="Username-Farbe" value={draft.joinCardFontUsernameColor} onChange={(v) => set('joinCardFontUsernameColor', v)} />
                </>
              )}

              {tab === 'leave' && (
                <>
                  <Field label="Leave Card aktiv">
                    <div className="flex items-center gap-3">
                      <Toggle value={draft.leaveCardEnabled} onChange={(v) => set('leaveCardEnabled', v)} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {draft.leaveCardEnabled ? 'Aktiviert' : 'Deaktiviert'}
                      </span>
                    </div>
                  </Field>
                  <Field label="Leave Channel ID" hint="Leer lassen = Join Channel wird verwendet">
                    <TextInput value={draft.leaveCardChannelId} onChange={(v) => set('leaveCardChannelId', v)} placeholder="leer = Join Channel" />
                  </Field>
                  <Field label="Preset">
                    <SelectInput
                      value={draft.leaveCardPreset}
                      onChange={(v) => set('leaveCardPreset', v)}
                      options={PRESETS.map((p) => ({ value: p, label: p || '— Standard —' }))}
                    />
                  </Field>
                  <Field label="Hintergrund" hint="Hex-Farbe (#1e1e2e) oder Bild-URL">
                    <TextInput value={draft.leaveCardBackground} onChange={(v) => set('leaveCardBackground', v)} placeholder="#1e1e2e oder https://…" />
                  </Field>
                  <Field label="Theme">
                    <SelectInput
                      value={draft.leaveCardTheme}
                      onChange={(v) => set('leaveCardTheme', v)}
                      options={THEMES.map((t) => ({ value: t, label: t || '— Standard —' }))}
                    />
                  </Field>
                  <Field label="Subtitle" hint="Text beim normalen Verlassen">
                    <TextInput value={draft.leaveCardSubtitle} onChange={(v) => set('leaveCardSubtitle', v)} placeholder="Auf Wiedersehen!" />
                  </Field>
                  <Field label="Ban-Subtitle" hint="Text wenn der User gebannt wurde">
                    <TextInput value={draft.leaveCardBanSubtitle} onChange={(v) => set('leaveCardBanSubtitle', v)} placeholder="Wurde gebannt" />
                  </Field>
                  <Field label="Nachricht" hint="Text über dem Bild · Platzhalter: {user} {username} {server}">
                    <textarea
                      className={inputCls}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                      value={draft.leaveCardMessage}
                      onChange={(e) => set('leaveCardMessage', e.target.value)}
                      placeholder="{username} hat den Server verlassen."
                      rows={2}
                    />
                  </Field>
                  <ColorField label="Ring-Farbe" value={draft.leaveCardRingColor} onChange={(v) => set('leaveCardRingColor', v)} />
                  <ColorField label="Subtitle-Farbe" value={draft.leaveCardFontColor} onChange={(v) => set('leaveCardFontColor', v)} />
                  <ColorField label="Username-Farbe" value={draft.leaveCardFontUsernameColor} onChange={(v) => set('leaveCardFontUsernameColor', v)} />
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="xl:w-96 shrink-0">
            <div className="sticky top-6 rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Vorschau
                </h3>
                <button
                  onClick={() => loadPreview(draft, tab)}
                  disabled={previewLoading}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    opacity: previewLoading ? 0.6 : 1,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  {previewLoading ? 'Lädt…' : 'Aktualisieren'}
                </button>
              </div>

              {(tab === 'join' ? draft.joinCardMessage : draft.leaveCardMessage).trim() && (
                <div
                  className="rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                >
                  {renderMessagePreview(tab === 'join' ? draft.joinCardMessage : draft.leaveCardMessage, previewUsername, previewServerName)}
                </div>
              )}

              {previewSrc ? (
                <div className="relative">
                  <img
                    src={previewSrc}
                    alt="Welcome Card Vorschau"
                    className="w-full rounded-lg"
                    style={{ imageRendering: 'auto' }}
                  />
                  {previewLoading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <span className="text-xs text-white">Aktualisiere…</span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="flex items-center justify-center rounded-lg text-xs text-center px-4"
                  style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-default)', color: 'var(--text-muted)', height: '120px' }}
                >
                  {previewLoading ? 'Vorschau wird generiert…' : 'Vorschau wird nach kurzer Pause automatisch geladen.'}
                </div>
              )}

              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Vorschau nutzt deinen Discord-Avatar. Mitgliederzahl = 42 (Beispiel).
              </p>
            </div>
          </div>
        </div>
      )}

      {toastElement}
    </div>
  );
}
