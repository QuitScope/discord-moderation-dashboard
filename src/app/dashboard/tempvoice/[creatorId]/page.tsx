'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/useToast';
import { InterfacePreview } from '../InterfacePreview';
import { DiscordImagePreview } from '../DiscordImagePreview';
import { useCanWrite, ReadOnlyNotice } from '../WriteAccess';
import {
  FieldCard, Toggle, PillGroup, IdMultiSelect, SaveBar, TemplateInput, fieldClass, fieldStyle,
} from '../ui';
import {
  emptyCreatorChannel, isDirty, EMPTY_VOCABULARIES, RESTORE_OPTIONS, CENSOR_REPLACEMENTS,
  type CreatorChannel, type GuildChannel, type GuildRole, type Vocabularies, type PlaceholderConfig,
} from '../types';

type Tab = 'overview' | 'permissions' | 'moderation' | 'others';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Übersicht', icon: '🧭' },
  { key: 'permissions', label: 'Berechtigungen', icon: '🛡️' },
  { key: 'moderation', label: 'Moderation', icon: '🔨' },
  { key: 'others', label: 'Sonstiges', icon: '✋' },
];

export default function CreatorChannelPage() {
  const params = useParams<{ creatorId: string }>();
  const creatorId = params.creatorId;
  const isNew = creatorId === 'new';
  const router = useRouter();
  const canWrite = useCanWrite();
  const { showToast, toastElement } = useToast(3000);

  const [loaded, setLoaded] = useState<CreatorChannel | null>(null);
  const [form, setForm] = useState<CreatorChannel>(emptyCreatorChannel());
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [vocab, setVocab] = useState<Vocabularies>(EMPTY_VOCABULARIES);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ccRes, chRes, roRes, vocabRes] = await Promise.all([
        isNew ? null : fetch(`/api/tempvoice/creator-channels/${creatorId}`, { cache: 'no-store' }),
        fetch('/api/channels', { cache: 'no-store' }),
        fetch('/api/roles', { cache: 'no-store' }),
        fetch('/api/tempvoice/actions', { cache: 'no-store' }),
      ]);

      if (vocabRes?.ok) {
        const v = (await vocabRes.json()) as Vocabularies;
        setVocab(v);
        // A new creator starts with every action enabled, which is only knowable once the
        // registry has arrived.
        if (isNew) {
          setForm((f) => (f.enabledActions.length === 0 ? { ...f, enabledActions: v.actions.map((a) => a.key) } : f));
        }
      }
      if (chRes.ok) setChannels((await chRes.json()) as GuildChannel[]);
      if (roRes.ok) {
        const ro = (await roRes.json()) as GuildRole[];
        setRoles(ro.filter((r) => r.name !== '@everyone').sort((a, b) => a.name.localeCompare(b.name)));
      }

      if (ccRes) {
        if (!ccRes.ok) { setNotFound(true); return; }
        const cc = (await ccRes.json()) as CreatorChannel;
        setLoaded(cc);
        setForm(cc);
      }
    } catch {
      showToast('Fehler beim Laden', 'error');
    } finally {
      setLoading(false);
    }
    // showToast is stable for the lifetime of the hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorId, isNew]);

  useEffect(() => { load(); }, [load]);

  const voiceChannels = useMemo(
    () => channels.filter((c) => c.type === 2).sort((a, b) => a.name.localeCompare(b.name)),
    [channels],
  );
  const categories = useMemo(
    () => channels.filter((c) => c.type === 4).sort((a, b) => a.name.localeCompare(b.name)),
    [channels],
  );

  const baseline = loaded ?? emptyCreatorChannel();
  const dirty = isNew ? true : isDirty(form, baseline);
  const incomplete = !form.triggerChannelId || !form.categoryId;

  function set<K extends keyof CreatorChannel>(key: K, value: CreatorChannel[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPlaceholderConfig(patch: Partial<PlaceholderConfig>) {
    setForm((f) => ({ ...f, placeholderConfig: { ...(f.placeholderConfig ?? {}), ...patch } }));
  }

  async function save() {
    setSaving(true);
    try {
      const { id: _id, ...payload } = form;
      const res = await fetch(
        isNew ? '/api/tempvoice/creator-channels' : `/api/tempvoice/creator-channels/${creatorId}`,
        { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        showToast(err.message ?? 'Fehler beim Speichern', 'error');
        return;
      }
      if (isNew) {
        const created = (await res.json()) as CreatorChannel;
        showToast('Erstellt');
        router.replace(`/dashboard/tempvoice/${created.id}`);
        return;
      }
      const saved = (await res.json()) as CreatorChannel;
      setLoaded(saved);
      setForm(saved);
      showToast('Gespeichert');
    } catch {
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Lädt…</div>;
  }

  if (notFound) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Dieser Creator-Channel existiert nicht (mehr).</p>
        <Link href="/dashboard/tempvoice" className="text-xs underline" style={{ color: 'var(--indigo-bright)' }}>
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const triggerName = channels.find((c) => c.id === form.triggerChannelId)?.name;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
      {toastElement}

      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/tempvoice" className="text-xs" style={{ color: 'var(--text-muted)' }}>← TempVoice</Link>
          <h1 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {isNew ? 'Neuer Creator-Channel' : (triggerName ?? 'Creator-Channel')}
          </h1>
        </div>
      </div>

      <ReadOnlyNotice />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 space-y-4">
          <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
                style={{ background: tab === t.key ? 'var(--indigo)' : 'transparent', color: tab === t.key ? '#fff' : 'var(--text-muted)' }}
              >
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldCard icon="🔊" label="Name des temporären Kanals" full>
                <TemplateInput
                  value={form.nameTemplate}
                  onChange={(v) => set('nameTemplate', v)}
                  placeholders={vocab.placeholders}
                />
              </FieldCard>

              <FieldCard icon="🚪" label="Warteraumname" full hint="Name des zweiten Kanals, in dem Gäste anklopfen.">
                <TemplateInput
                  value={form.waitingRoomNameTemplate}
                  onChange={(v) => set('waitingRoomNameTemplate', v)}
                  placeholders={vocab.placeholders}
                />
              </FieldCard>

              <FieldCard icon="➡️" label="Trigger-Channel">
                <select className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  value={form.triggerChannelId} onChange={(e) => set('triggerChannelId', e.target.value)}>
                  <option value="">— wählen —</option>
                  {voiceChannels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FieldCard>

              <FieldCard icon="📁" label="Kategorie">
                <select className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  <option value="">— wählen —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FieldCard>

              <FieldCard icon="🗂️" label="Fallback-Kategorien" full
                hint="Greift, sobald die Kategorie Discords Grenze von 50 Kanälen erreicht hat. Reihenfolge = Priorität.">
                <IdMultiSelect
                  options={categories}
                  selected={form.fallbackCategoryIds}
                  onChange={(v) => set('fallbackCategoryIds', v)}
                  placeholder="Kategorie hinzufügen…"
                />
              </FieldCard>

              <FieldCard icon="👥" label="Benutzerlimit" hint="0 = unbegrenzt"
                badge={<span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--indigo-bg)', color: 'var(--indigo-bright)' }}>{form.userLimit || '∞'}</span>}>
                <input type="range" className="cyber-range" min={0} max={99} disabled={!canWrite}
                  value={form.userLimit} onChange={(e) => set('userLimit', Number(e.target.value))} />
              </FieldCard>

              <FieldCard icon="📍" label="Position" hint="Wo der neue Kanal in der Kategorie landet.">
                <select className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  value={form.position} onChange={(e) => set('position', e.target.value as CreatorChannel['position'])}>
                  <option value="top">Ganz oben</option>
                  <option value="below_creator">Direkt unter dem Creator</option>
                  <option value="bottom">Ganz unten</option>
                </select>
              </FieldCard>

              <FieldCard icon="🎚️" label="Bitrate" full>
                <select className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  value={form.bitrateMode} onChange={(e) => set('bitrateMode', e.target.value as CreatorChannel['bitrateMode'])}>
                  <option value="max">Höchstmöglich</option>
                  <option value="fixed">Fester Wert</option>
                </select>
                {form.bitrateMode === 'fixed' && (
                  <input type="number" className={fieldClass} style={fieldStyle} disabled={!canWrite}
                    placeholder="64000" min={8000} max={384000} value={form.bitrate ?? ''}
                    onChange={(e) => set('bitrate', e.target.value ? Number(e.target.value) : null)} />
                )}
              </FieldCard>
            </div>
          )}

          {tab === 'permissions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldCard icon="👤" label="Zugriffsrollen" full hint="Leer = alle dürfen rein.">
                <IdMultiSelect
                  options={roles}
                  selected={form.accessRoleIds}
                  onChange={(v) => set('accessRoleIds', v)}
                  placeholder="Rolle hinzufügen…"
                />
              </FieldCard>

              <FieldCard icon="🙈" label="Ohne Zugriffsrolle" full hint="Was jemand sieht, der keine der Rollen hat.">
                <select className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  value={form.accessRoleMode} onChange={(e) => set('accessRoleMode', e.target.value as CreatorChannel['accessRoleMode'])}>
                  <option value="hide">Kanal ist nicht sichtbar</option>
                  <option value="no_join">Sichtbar, aber nicht beitretbar</option>
                </select>
              </FieldCard>

              <FieldCard icon="🛡️" label="Privatsphärenmodus" hint="Startzustand; der Besitzer kann ihn jederzeit umstellen.">
                <select className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  value={form.privacyMode} onChange={(e) => set('privacyMode', e.target.value as CreatorChannel['privacyMode'])}>
                  <option value="public">Öffentlich</option>
                  <option value="locked">Gesperrt</option>
                  <option value="hidden">Versteckt</option>
                </select>
              </FieldCard>

              <FieldCard icon="🔗" label="Berechtigungen synchronisieren">
                <select className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  value={form.permissionSyncMode} onChange={(e) => set('permissionSyncMode', e.target.value as CreatorChannel['permissionSyncMode'])}>
                  <option value="none">Nicht synchronisieren</option>
                  <option value="category">Von Kategorie</option>
                  <option value="creator">Vom Creator</option>
                </select>
              </FieldCard>

              <FieldCard icon="👑" label="Owner-Berechtigungen" full
                hint="Rechte, die der Besitzer in seinem Kanal bekommt.">
                <PillGroup
                  options={vocab.ownerPermissions.map((p) => ({ value: p.name, label: p.label, warning: p.warning }))}
                  selected={form.ownerPermissions}
                  onChange={(v) => set('ownerPermissions', v)}
                />
              </FieldCard>
            </div>
          )}

          {tab === 'moderation' && (
            <div className="space-y-3">
              <FieldCard icon="🎛️" label="Funktionen ein-/ausschalten"
                hint="Mindest-Rolle pro Funktion. „Alle“ heißt: jeder Besitzer darf sie nutzen. Höhere Rollen kommen automatisch durch.">
                <div className="space-y-1">
                  {vocab.features.map((f) => (
                    <div key={f.key} className="flex items-center gap-3">
                      <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                      <select
                        className="px-2 py-1 rounded-md text-xs outline-none w-48"
                        style={fieldStyle}
                        disabled={!canWrite}
                        value={form.featureRoleGates[f.key] ?? ''}
                        onChange={(e) => {
                          const next = { ...form.featureRoleGates };
                          if (e.target.value) next[f.key] = e.target.value; else delete next[f.key];
                          set('featureRoleGates', next);
                        }}
                      >
                        <option value="">Alle</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </FieldCard>

              <FieldCard icon="♻️" label="Besitzereinstellungen wiederherstellen"
                hint="Was zurückkommt, wenn derselbe Besitzer wieder einen Kanal über diesen Creator erstellt. Nicht Angehaktes kommt aus den Creator-Einstellungen.">
                <PillGroup
                  options={RESTORE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  selected={form.restoreOwnerSettings as ('name' | 'limit' | 'lists' | 'privacy' | 'region')[]}
                  onChange={(v) => set('restoreOwnerSettings', v)}
                />
              </FieldCard>

              <FieldCard icon="🚫" label="Kanalnamen zensieren">
                <Toggle checked={form.censorEnabled} onChange={(v) => set('censorEnabled', v)}
                  label={form.censorEnabled ? 'Aktiviert' : 'Deaktiviert'} />
                {form.censorEnabled && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Eigene Wörter (kommagetrennt). `*` am Anfang oder Ende trifft auch Wortteile.
                      </span>
                      <input className={fieldClass} style={fieldStyle} disabled={!canWrite}
                        value={form.censorWords.join(', ')}
                        onChange={(e) => set('censorWords', e.target.value.split(',').map((w) => w.trim()).filter(Boolean))} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Ersatzzeichen</span>
                      <div className="flex gap-1.5">
                        {CENSOR_REPLACEMENTS.map((ch) => (
                          <button key={ch} disabled={!canWrite} onClick={() => set('censorReplacement', ch)}
                            className="w-8 h-8 rounded-lg text-sm font-bold"
                            style={{
                              background: form.censorReplacement === ch ? 'var(--indigo-bg)' : 'var(--bg-elevated)',
                              border: `1px solid ${form.censorReplacement === ch ? 'var(--indigo)' : 'var(--border-default)'}`,
                              color: form.censorReplacement === ch ? 'var(--indigo-bright)' : 'var(--text-muted)',
                            }}>
                            {ch}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Toggle checked={form.censorPreset} onChange={(v) => set('censorPreset', v)} label="Häufig auffällige Wörter mitzählen" />
                    <Toggle checked={form.censorHomoglyphs} onChange={(v) => set('censorHomoglyphs', v)} label="Umgehungsschutz (Leetspeak, kyrillische Zwillinge, Trenner)" />
                  </div>
                )}
              </FieldCard>

              <FieldCard icon="📋" label="Moderations-Log (Webhook)" full
                hint="Discord-Webhook-URL. Leer = der globale Log-Channel wird verwendet.">
                <input className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  placeholder="https://discord.com/api/webhooks/…"
                  value={form.moderationWebhookUrl ?? ''}
                  onChange={(e) => set('moderationWebhookUrl', e.target.value || null)} />
              </FieldCard>

              <FieldCard icon="💬" label="Chat-Verlauf sichern"
                hint="Beim Löschen des Kanals wird der Textchat als Datei in den Moderations-Log geschickt. Ohne das ist der Chat mit dem Kanal weg.">
                <Toggle checked={form.chatLogEnabled} onChange={(v) => set('chatLogEnabled', v)}
                  label={form.chatLogEnabled ? 'Wird gesichert' : 'Wird nicht gesichert'} />
              </FieldCard>

              <FieldCard icon="🔞" label="Altersbeschränkung" hint="Markiert den Temp-Channel als NSFW.">
                <Toggle checked={form.ageRestricted} onChange={(v) => set('ageRestricted', v)}
                  label={form.ageRestricted ? 'Aktiviert' : 'Deaktiviert'} />
              </FieldCard>
            </div>
          )}

          {tab === 'others' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldCard icon="✋" label="Begrüßungstext" full hint="Wird beim Erstellen in den In-Voice-Chat gesendet.">
                <TemplateInput
                  value={form.greetingMessage ?? ''}
                  onChange={(v) => set('greetingMessage', v || null)}
                  placeholders={vocab.placeholders}
                  rows={3}
                />
                <Toggle checked={form.greetingSilent} onChange={(v) => set('greetingSilent', v)} label="Ohne Ping senden" />
              </FieldCard>

              <FieldCard icon="🎛️" label="Interface im In-Voice-Chat" full
                hint="Postet die Bedienelemente beim Erstellen in den Textchat des Kanals.">
                <Toggle checked={form.interfaceInVoiceChat} onChange={(v) => set('interfaceInVoiceChat', v)}
                  label={form.interfaceInVoiceChat ? 'Wird gesendet' : 'Wird nicht gesendet'} />
              </FieldCard>

              <FieldCard icon="👑" label="Temporäre Voice-Rolle" full
                hint="Bekommt jeder, solange er in einem Temp-Channel dieses Creators ist.">
                <select className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  value={form.voiceRoleId ?? ''} onChange={(e) => set('voiceRoleId', e.target.value || null)}>
                  <option value="">— keine —</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </FieldCard>

              <FieldCard icon="🔒" label="{PRIVACY}" full hint="Was der Platzhalter je nach Zustand in den Namen schreibt.">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['public', 'Offen', '🔓'],
                    ['locked', 'Gesperrt', '🔒'],
                    ['hidden', 'Versteckt', '🙈'],
                  ] as const).map(([key, label, fallback]) => (
                    <div key={key} className="space-y-1">
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <input className={fieldClass} style={fieldStyle} disabled={!canWrite} placeholder={fallback}
                        value={form.placeholderConfig?.privacy?.[key] ?? ''}
                        onChange={(e) => setPlaceholderConfig({
                          privacy: { ...(form.placeholderConfig?.privacy ?? {}), [key]: e.target.value || undefined },
                        })} />
                    </div>
                  ))}
                </div>
              </FieldCard>

              <FieldCard icon="🎲" label="{RANDOM}" full hint="Kommagetrennte Wortliste, aus der zufällig gezogen wird.">
                <input className={fieldClass} style={fieldStyle} disabled={!canWrite}
                  value={(form.placeholderConfig?.randomWords ?? []).join(', ')}
                  onChange={(e) => setPlaceholderConfig({
                    randomWords: e.target.value.split(',').map((w) => w.trim()).filter(Boolean),
                  })} />
              </FieldCard>

              <FieldCard icon="🏷️" label="Rollen-Platzhalter" full
                hint="Ersatztext, wenn der Besitzer keine passende Rolle hat.">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{'{ROLE_HIGHEST}'}</span>
                    <input className={fieldClass} style={fieldStyle} disabled={!canWrite}
                      value={form.placeholderConfig?.roleHighestFallback ?? ''}
                      onChange={(e) => setPlaceholderConfig({ roleHighestFallback: e.target.value || undefined })} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{'{ROLE_HOIST}'}</span>
                    <input className={fieldClass} style={fieldStyle} disabled={!canWrite}
                      value={form.placeholderConfig?.roleHoistFallback ?? ''}
                      onChange={(e) => setPlaceholderConfig({ roleHoistFallback: e.target.value || undefined })} />
                  </div>
                </div>
              </FieldCard>
            </div>
          )}
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Buttons dieses Creators
              </p>
              <InterfacePreview
                key={vocab.actions.length}
                enabledActions={form.enabledActions}
                actions={vocab.actions}
                onChange={(next) => set('enabledActions', next)}
              />
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Ist im Interface-Editor eine Reihenfolge gesetzt, gewinnt diese — dann zeigt jedes Panel dieselben Buttons.
              </p>
            </div>

            <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>So sieht&apos;s in Discord aus</p>
              <DiscordImagePreview enabledActions={form.enabledActions} />
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        dirty={dirty && (isNew ? !incomplete : true)}
        saving={saving}
        disabled={incomplete}
        onSave={save}
        onReset={() => (isNew ? router.push('/dashboard/tempvoice') : setForm(baseline))}
      />
    </div>
  );
}
