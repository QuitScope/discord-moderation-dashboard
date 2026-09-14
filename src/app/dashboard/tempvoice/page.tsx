'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/useToast';
import { InterfaceEditor } from './InterfaceEditor';
import { useCanWrite, ReadOnlyNotice } from './WriteAccess';
import { FieldCard, Toggle, SaveBar, fieldClass, fieldStyle } from './ui';
import {
  EMPTY_VOCABULARIES, isDirty,
  type CreatorChannel, type GlobalSettings, type GuildChannel, type InterfaceConfig, type Vocabularies,
} from './types';

const emptyGlobalSettings = (): GlobalSettings => ({
  tempvoiceEnabled: false,
  tempvoiceLogChannelId: null,
  tempvoiceEmojiConfig: null,
  tempvoiceCensorEnabled: false,
  tempvoiceCensoredWords: [],
});

export default function TempVoicePage() {
  const canWrite = useCanWrite();
  const { showToast, toastElement } = useToast(3000);

  const [creatorChannels, setCreatorChannels] = useState<CreatorChannel[]>([]);
  const [loadedGlobal, setLoadedGlobal] = useState<GlobalSettings>(emptyGlobalSettings());
  const [globalForm, setGlobalForm] = useState<GlobalSettings>(emptyGlobalSettings());
  const [interfaceConfig, setInterfaceConfig] = useState<InterfaceConfig | null>(null);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [vocab, setVocab] = useState<Vocabularies>(EMPTY_VOCABULARIES);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ccRes, gsRes, chRes, ifRes, vocabRes] = await Promise.all([
        fetch('/api/tempvoice/creator-channels', { cache: 'no-store' }),
        fetch('/api/tempvoice/global-settings', { cache: 'no-store' }),
        fetch('/api/channels', { cache: 'no-store' }),
        fetch('/api/tempvoice/interface', { cache: 'no-store' }),
        fetch('/api/tempvoice/actions', { cache: 'no-store' }),
      ]);
      if (ccRes.ok) setCreatorChannels((await ccRes.json()) as CreatorChannel[]);
      if (gsRes.ok) {
        const gs = (await gsRes.json()) as GlobalSettings;
        setLoadedGlobal(gs);
        setGlobalForm(gs);
      }
      if (chRes.ok) setChannels((await chRes.json()) as GuildChannel[]);
      if (ifRes.ok) setInterfaceConfig((await ifRes.json()) as InterfaceConfig);
      if (vocabRes.ok) setVocab((await vocabRes.json()) as Vocabularies);
    } catch {
      showToast('Fehler beim Laden', 'error');
    } finally {
      setLoading(false);
    }
    // showToast is stable for the lifetime of the hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveGlobalSettings() {
    setSavingGlobal(true);
    try {
      const res = await fetch('/api/tempvoice/global-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalForm),
      });
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as GlobalSettings;
      setLoadedGlobal(saved);
      setGlobalForm(saved);
      showToast('Globale Einstellungen gespeichert');
    } catch {
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSavingGlobal(false);
    }
  }

  async function deleteCreatorChannel(id: string) {
    if (!confirm('Creator-Channel löschen? Bereits erstellte Temp-Channels bleiben unberührt.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/tempvoice/creator-channels/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Gelöscht');
      await load();
    } catch {
      showToast('Fehler beim Löschen', 'error');
    } finally {
      setDeleting(null);
    }
  }

  function channelName(id: string): string {
    return channels.find((c) => c.id === id)?.name ?? id;
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Lädt…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {toastElement}

      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>TempVoice</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Temporäre Voice-Channels mit Creator-Channels, Berechtigungen &amp; Interface
        </p>
      </div>

      <ReadOnlyNotice />

      {/* ─── Globale Einstellungen ─── */}
      <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'var(--indigo)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Globale Einstellungen</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FieldCard icon="🔊" label="TempVoice">
            <Toggle
              checked={globalForm.tempvoiceEnabled}
              onChange={(v) => setGlobalForm((s) => ({ ...s, tempvoiceEnabled: v }))}
              label={globalForm.tempvoiceEnabled ? 'Aktiviert' : 'Deaktiviert'}
            />
          </FieldCard>

          <FieldCard icon="📋" label="Moderations-Log-Channel" hint="Fallback, wenn ein Creator keinen eigenen Webhook hat.">
            <select className={fieldClass} style={fieldStyle} disabled={!canWrite}
              value={globalForm.tempvoiceLogChannelId ?? ''}
              onChange={(e) => setGlobalForm((s) => ({ ...s, tempvoiceLogChannelId: e.target.value || null }))}>
              <option value="">— kein Log-Channel —</option>
              {channels.filter((c) => c.type === 0).map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </FieldCard>

          <FieldCard icon="🚫" label="Namenszensur (global)" hint="Gilt zusätzlich zur Wortliste jedes Creators.">
            <Toggle
              checked={globalForm.tempvoiceCensorEnabled}
              onChange={(v) => setGlobalForm((s) => ({ ...s, tempvoiceCensorEnabled: v }))}
              label={globalForm.tempvoiceCensorEnabled ? 'Aktiviert' : 'Deaktiviert'}
            />
          </FieldCard>

          <FieldCard icon="✍️" label="Zensierte Wörter" hint="Kommagetrennt.">
            <input className={fieldClass} style={fieldStyle} disabled={!canWrite}
              value={globalForm.tempvoiceCensoredWords.join(', ')}
              onChange={(e) => setGlobalForm((s) => ({
                ...s,
                tempvoiceCensoredWords: e.target.value.split(',').map((w) => w.trim()).filter(Boolean),
              }))} />
          </FieldCard>

          <FieldCard icon="😀" label="Emoji-Config (JSON)" full hint="Passt die Emojis der Interface-Buttons an.">
            <textarea className={`${fieldClass} font-mono text-xs resize-none`} style={fieldStyle} rows={3} disabled={!canWrite}
              value={globalForm.tempvoiceEmojiConfig ?? ''}
              onChange={(e) => setGlobalForm((s) => ({ ...s, tempvoiceEmojiConfig: e.target.value || null }))} />
          </FieldCard>
        </div>

        <SaveBar
          dirty={isDirty(globalForm, loadedGlobal)}
          saving={savingGlobal}
          onSave={saveGlobalSettings}
          onReset={() => setGlobalForm(loadedGlobal)}
        />
      </div>

      {/* ─── Interface ─── */}
      {interfaceConfig && (
        <InterfaceEditor
          loaded={interfaceConfig}
          actions={vocab.actions}
          channels={channels}
          onSaved={setInterfaceConfig}
        />
      )}

      {/* ─── Creator-Channel-Liste ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Creator-Channels</h2>
          {canWrite && (
            <Link href="/dashboard/tempvoice/new" className="px-4 py-1.5 rounded-md text-xs font-bold"
              style={{ background: 'var(--indigo)', color: '#fff' }}>
              + Neu
            </Link>
          )}
        </div>

        {creatorChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="text-3xl">🔊</div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Noch keine Creator-Channels</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Erstelle einen Creator-Channel, damit Mitglieder Temp-Channels erhalten können.
            </div>
          </div>
        ) : (
          creatorChannels.map((cc) => (
            <div key={cc.id} className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: 'var(--indigo-bg)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  🔊
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{channelName(cc.triggerChannelId)}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    → {channelName(cc.categoryId)} · {cc.enabledActions.length} Buttons
                    {cc.censorEnabled ? ' · Zensur an' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/dashboard/tempvoice/${cc.id}`} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                    {canWrite ? 'Bearbeiten' : 'Ansehen'}
                  </Link>
                  {canWrite && (
                    <button onClick={() => deleteCreatorChannel(cc.id)} disabled={deleting === cc.id}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium"
                      style={{ color: 'var(--red)', opacity: deleting === cc.id ? 0.4 : 1 }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
