'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { CyberModal } from '@/components/CyberModal';

type AutoModRuleType = 'banned_words' | 'anti_spam' | 'anti_invites' | 'anti_links' | 'anti_caps' | 'mentions_spam' | 'anti_scam';
type AutoModPunishment = 'none' | 'timeout' | 'kick' | 'ban';
type AutoModDurationUnit = 'minutes' | 'hours' | 'days' | 'permanent';

interface AutoModRule {
  id: string;
  type: AutoModRuleType;
  enabled: boolean;
  punishment: AutoModPunishment;
  durationValue: number | null;
  durationUnit: AutoModDurationUnit | null;
  exemptChannelIds: string[];
  exemptRoleIds: string[];
  words: string[];
  maxCount: number | null;
  intervalSeconds: number | null;
  allowedDomains: string[];
}

interface AutoModConfig {
  autoModEnabled: boolean;
  autoModLogChannelId: string | null;
  autoModWhitelistChannelIds: string[];
  autoModWhitelistRoleIds: string[];
}

interface GuildChannel { id: string; name: string; type: number }
interface GuildRole { id: string; name: string; color: number }

const RULE_ORDER: AutoModRuleType[] = [
  'banned_words', 'anti_spam', 'anti_invites', 'anti_links', 'anti_caps', 'mentions_spam', 'anti_scam',
];

const RULE_META: Record<AutoModRuleType, { icon: string; label: string; description: string }> = {
  banned_words: { icon: '🚫', label: 'Verbotene Wörter', description: 'Blockiert Nachrichten mit bestimmten Wörtern oder Phrasen.' },
  anti_spam: { icon: '💬', label: 'Anti Spam', description: 'Verhindert das Senden zu vieler Nachrichten in kurzer Zeit.' },
  anti_invites: { icon: '✉️', label: 'Anti Invites', description: 'Verhindert das Senden von Discord-Einladungen.' },
  anti_links: { icon: '🔗', label: 'Anti Links', description: 'Verhindert das Senden von Links.' },
  anti_caps: { icon: '🔠', label: 'Anti Caps', description: 'Verhindert Nachrichten mit übermäßig vielen Großbuchstaben.' },
  mentions_spam: { icon: '📣', label: 'Erwähnungen-Spam', description: 'Verhindert Nachrichten mit zu vielen Erwähnungen.' },
  anti_scam: { icon: '🎣', label: 'Anti-Betrug', description: 'Erkennt und blockiert gängige Betrugsmuster.' },
};

const cardStyle: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border-default)' };
const fieldStyle: React.CSSProperties = { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' };
const fieldClass = 'px-3 py-2 rounded-lg text-sm outline-none';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0 cursor-pointer"
      style={{ background: checked ? 'var(--emerald)' : 'var(--border-default)' }}
    >
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: checked ? '18px' : '2px' }} />
    </div>
  );
}

function TagInput({ label, hint, values, onChange, placeholder }: {
  label: string; hint?: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  }
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className={`flex-1 ${fieldClass}`}
          style={fieldStyle}
        />
        <button onClick={add} className="px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0" style={fieldStyle}>+ Hinzufügen</button>
      </div>
      {hint && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={fieldStyle}>
              {v}
              <button onClick={() => onChange(values.filter((x) => x !== v))} className="ml-1" style={{ color: 'var(--text-muted)' }}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: { id: string; name: string }[]; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const [pick, setPick] = useState('');
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="flex gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={`flex-1 ${fieldClass}`} style={fieldStyle}>
          <option value="">Auswählen…</option>
          {options.filter((o) => !selected.includes(o.id)).map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <button
          onClick={() => { if (pick && !selected.includes(pick)) { onChange([...selected, pick]); setPick(''); } }}
          className="px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0"
          style={fieldStyle}
        >
          + Hinzufügen
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const opt = options.find((o) => o.id === id);
            return (
              <span key={id} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={fieldStyle}>
                {opt?.name ?? id}
                <button onClick={() => onChange(selected.filter((x) => x !== id))} className="ml-1" style={{ color: 'var(--text-muted)' }}>✕</button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DURATION_UNITS_BY_PUNISHMENT: Record<AutoModPunishment, AutoModDurationUnit[]> = {
  none: [],
  kick: [],
  timeout: ['minutes', 'hours', 'days'],
  ban: ['minutes', 'hours', 'days', 'permanent'],
};

const UNIT_LABELS: Record<AutoModDurationUnit, string> = {
  minutes: 'Minuten', hours: 'Stunden', days: 'Tage', permanent: 'Permanent',
};

function PunishmentFields({ rule, onChange }: { rule: AutoModRule; onChange: (patch: Partial<AutoModRule>) => void }) {
  const units = DURATION_UNITS_BY_PUNISHMENT[rule.punishment];
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Bestrafung</label>
      <select
        value={rule.punishment}
        onChange={(e) => {
          const punishment = e.target.value as AutoModPunishment;
          const nextUnits = DURATION_UNITS_BY_PUNISHMENT[punishment];
          onChange({
            punishment,
            durationValue: nextUnits.length === 0 ? null : rule.durationValue,
            durationUnit: nextUnits.length === 0 ? null : (nextUnits.includes(rule.durationUnit as AutoModDurationUnit) ? rule.durationUnit : nextUnits[0]),
          });
        }}
        className={`w-full ${fieldClass}`}
        style={fieldStyle}
      >
        <option value="none">Keine</option>
        <option value="timeout">Timeout</option>
        <option value="kick">Kick</option>
        <option value="ban">Ban</option>
      </select>
      {units.length > 0 && (
        <div className="flex gap-2">
          {rule.durationUnit !== 'permanent' && (
            <input
              type="number"
              min={1}
              value={rule.durationValue ?? ''}
              onChange={(e) => onChange({ durationValue: e.target.value === '' ? null : Number(e.target.value) })}
              className={`w-24 ${fieldClass}`}
              style={fieldStyle}
            />
          )}
          <select
            value={rule.durationUnit ?? units[0]}
            onChange={(e) => onChange({ durationUnit: e.target.value as AutoModDurationUnit })}
            className={`flex-1 ${fieldClass}`}
            style={fieldStyle}
          >
            {units.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
          </select>
        </div>
      )}
      {rule.punishment === 'timeout' && (
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Discord erlaubt max. 28 Tage Timeout.</p>
      )}
      {rule.punishment === 'ban' && (
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Discord-Bans sind immer permanent — die Dauer wird nur gespeichert/angezeigt, aber nicht automatisch aufgehoben.</p>
      )}
    </div>
  );
}

function RuleTypeFields({ rule, onChange }: { rule: AutoModRule; onChange: (patch: Partial<AutoModRule>) => void }) {
  switch (rule.type) {
    case 'banned_words':
      return (
        <TagInput label="Verbotene Wörter" hint="Nutze * am Anfang, Ende oder beides für Teilübereinstimmungen (z.B. *wort*)."
          values={rule.words} onChange={(words) => onChange({ words })} placeholder="wort eingeben…" />
      );
    case 'anti_scam':
      return (
        <TagInput label="Scam-Schlüsselwörter" hint="Gleiche Wildcard-Syntax wie Verbotene Wörter."
          values={rule.words} onChange={(words) => onChange({ words })} placeholder="stichwort eingeben…" />
      );
    case 'anti_links':
      return (
        <TagInput label="Erlaubte Domains" hint="Nutze * am Anfang/Ende für Teilübereinstimmungen (z.B. *tenor.com)."
          values={rule.allowedDomains} onChange={(allowedDomains) => onChange({ allowedDomains })} placeholder="domain.com" />
      );
    case 'anti_spam':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Nachrichtenanzahl</label>
            <input type="number" min={1} value={rule.maxCount ?? ''} onChange={(e) => onChange({ maxCount: e.target.value === '' ? null : Number(e.target.value) })} className={`w-full ${fieldClass}`} style={fieldStyle} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Zeitfenster (Sekunden)</label>
            <input type="number" min={1} value={rule.intervalSeconds ?? ''} onChange={(e) => onChange({ intervalSeconds: e.target.value === '' ? null : Number(e.target.value) })} className={`w-full ${fieldClass}`} style={fieldStyle} />
          </div>
        </div>
      );
    case 'mentions_spam':
      return (
        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Maximal erlaubte Erwähnungen</label>
          <input type="number" min={1} value={rule.maxCount ?? ''} onChange={(e) => onChange({ maxCount: e.target.value === '' ? null : Number(e.target.value) })} className={`w-full ${fieldClass}`} style={fieldStyle} />
        </div>
      );
    case 'anti_invites':
    case 'anti_caps':
      return null;
  }
}

export default function AutoModPage() {
  const [config, setConfig] = useState<AutoModConfig | null>(null);
  const [rules, setRules] = useState<AutoModRule[]>([]);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<AutoModRuleType | null>(null);
  const [form, setForm] = useState<AutoModRule | null>(null);
  const [savingRule, setSavingRule] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState<AutoModConfig | null>(null);
  const { showToast: show, toastElement } = useToast();

  const load = useCallback(async () => {
    const [configRes, rulesRes, channelsRes, rolesRes] = await Promise.all([
      fetch('/api/automod/config', { cache: 'no-store' }),
      fetch('/api/automod/rules', { cache: 'no-store' }),
      fetch('/api/channels', { cache: 'no-store' }),
      fetch('/api/roles', { cache: 'no-store' }),
    ]);
    if (configRes.ok) {
      const c = await configRes.json();
      setConfig(c);
      setConfigDraft(c);
    } else {
      show('AutoMod-Konfiguration konnte nicht geladen werden.', 'error');
    }
    if (rulesRes.ok) {
      setRules(await rulesRes.json());
    } else {
      show('AutoMod-Regeln konnten nicht geladen werden.', 'error');
    }
    if (channelsRes.ok) {
      const raw: { id: string; name: string; type: number }[] = await channelsRes.json();
      setChannels(raw.filter((c) => c.type === 0));
    }
    if (rolesRes.ok) {
      const raw: { id: string; name: string; color: number }[] = await rolesRes.json();
      setRoles(raw.filter((r) => r.name !== '@everyone').sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [show]);

  useEffect(() => {
    load().catch(() => show('Konnte AutoMod-Daten nicht laden.', 'error')).finally(() => setLoading(false));
  }, [load, show]);

  async function toggleModule(enabled: boolean) {
    if (!configDraft) return;
    const previous = configDraft;
    const next = { ...configDraft, autoModEnabled: enabled };
    setConfigDraft(next);
    setConfig(next);
    try {
      const res = await fetch('/api/automod/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoModEnabled: enabled }),
      });
      if (!res.ok) throw new Error();
      const updated: AutoModConfig = await res.json();
      setConfig(updated);
      setConfigDraft(updated);
    } catch {
      show('Fehler beim Umschalten.', 'error');
      setConfig(previous);
      setConfigDraft(previous);
    }
  }

  async function saveGlobalSettings() {
    if (!configDraft) return;
    setSavingConfig(true);
    try {
      const res = await fetch('/api/automod/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoModLogChannelId: configDraft.autoModLogChannelId,
          autoModWhitelistChannelIds: configDraft.autoModWhitelistChannelIds,
          autoModWhitelistRoleIds: configDraft.autoModWhitelistRoleIds,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setConfig(updated);
      setConfigDraft(updated);
      show('Globale Einstellungen gespeichert');
    } catch {
      show('Fehler beim Speichern.', 'error');
    } finally {
      setSavingConfig(false);
    }
  }

  function openEdit(type: AutoModRuleType) {
    const rule = rules.find((r) => r.type === type);
    if (!rule) return;
    setEditingType(type);
    setForm(rule);
  }

  async function saveRule() {
    if (!form) return;
    setSavingRule(true);
    try {
      const res = await fetch(`/api/automod/rules/${form.type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: form.enabled,
          punishment: form.punishment,
          durationValue: form.durationValue,
          durationUnit: form.durationUnit,
          exemptChannelIds: form.exemptChannelIds,
          exemptRoleIds: form.exemptRoleIds,
          words: form.words,
          maxCount: form.maxCount,
          intervalSeconds: form.intervalSeconds,
          allowedDomains: form.allowedDomains,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Fehler beim Speichern.');
      }
      const updated: AutoModRule = await res.json();
      setRules((rs) => rs.map((r) => (r.type === updated.type ? updated : r)));
      show('Regel gespeichert');
      setEditingType(null);
      setForm(null);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Fehler beim Speichern.', 'error');
    } finally {
      setSavingRule(false);
    }
  }

  async function toggleRuleEnabled(type: AutoModRuleType, enabled: boolean) {
    setRules((rs) => rs.map((r) => (r.type === type ? { ...r, enabled } : r)));
    try {
      const res = await fetch(`/api/automod/rules/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error();
      const updated: AutoModRule = await res.json();
      setRules((rs) => rs.map((r) => (r.type === type ? updated : r)));
    } catch {
      show('Fehler beim Umschalten.', 'error');
      setRules((rs) => rs.map((r) => (r.type === type ? { ...r, enabled: !enabled } : r)));
    }
  }

  const channelOptions = channels.map((c) => ({ id: c.id, name: c.name }));
  const roleOptions = roles.map((r) => ({ id: r.id, name: r.name }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade AutoMod…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in">
      {toastElement}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-display text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>AutoMod</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Automatische Text-Moderation — 7 Regeln, unabhängig konfigurierbar</p>
        </div>
        {configDraft && <Toggle checked={configDraft.autoModEnabled} onChange={toggleModule} />}
      </div>

      <div className="rounded-lg p-4 space-y-4" style={cardStyle}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Globale Einstellungen</h2>
        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Log-Channel</label>
          <select
            value={configDraft?.autoModLogChannelId ?? ''}
            onChange={(e) => setConfigDraft((c) => c && { ...c, autoModLogChannelId: e.target.value || null })}
            className={`w-full ${fieldClass}`}
            style={fieldStyle}
          >
            <option value="">Kein Log-Channel</option>
            {channelOptions.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
        </div>
        <MultiSelect label="Globale Kanal-Whitelist" options={channelOptions}
          selected={configDraft?.autoModWhitelistChannelIds ?? []}
          onChange={(ids) => setConfigDraft((c) => c && { ...c, autoModWhitelistChannelIds: ids })} />
        <MultiSelect label="Globale Rollen-Whitelist" options={roleOptions}
          selected={configDraft?.autoModWhitelistRoleIds ?? []}
          onChange={(ids) => setConfigDraft((c) => c && { ...c, autoModWhitelistRoleIds: ids })} />
        <button
          onClick={saveGlobalSettings}
          disabled={savingConfig}
          className="px-4 py-2 rounded-lg text-xs font-bold"
          style={{ background: 'var(--emerald-bg)', color: 'var(--emerald)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          {savingConfig ? 'Speichert…' : 'Speichern'}
        </button>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>AutoMod-Regeln</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RULE_ORDER.map((type) => {
            const rule = rules.find((r) => r.type === type);
            if (!rule) return null;
            const meta = RULE_META[type];
            return (
              <div key={type} className="rounded-lg p-4 space-y-3" style={cardStyle}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{meta.label}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{meta.description}</div>
                    </div>
                  </div>
                  <Toggle checked={rule.enabled} onChange={(v) => toggleRuleEnabled(type, v)} />
                </div>
                <button
                  onClick={() => openEdit(type)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ background: 'var(--indigo-bg)', color: 'var(--indigo-bright)', border: '1px solid var(--indigo)' }}
                >
                  Regel bearbeiten
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {editingType && form && (
        <CyberModal isOpen onClose={() => { setEditingType(null); setForm(null); }} title={RULE_META[editingType].label} maxWidth="md">
          <div className="space-y-4">
            <RuleTypeFields rule={form} onChange={(patch) => setForm((f) => f && { ...f, ...patch })} />
            <PunishmentFields rule={form} onChange={(patch) => setForm((f) => f && { ...f, ...patch })} />
            <MultiSelect label="Kanäle zulassen" options={channelOptions} selected={form.exemptChannelIds}
              onChange={(exemptChannelIds) => setForm((f) => f && { ...f, exemptChannelIds })} />
            <MultiSelect label="Rollen zulassen" options={roleOptions} selected={form.exemptRoleIds}
              onChange={(exemptRoleIds) => setForm((f) => f && { ...f, exemptRoleIds })} />
            <button
              onClick={saveRule}
              disabled={savingRule}
              className="w-full px-4 py-2 rounded-lg text-sm font-bold"
              style={{ background: 'var(--emerald-bg)', color: 'var(--emerald)', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              {savingRule ? 'Speichert…' : 'Änderungen speichern'}
            </button>
          </div>
        </CyberModal>
      )}
    </div>
  );
}
