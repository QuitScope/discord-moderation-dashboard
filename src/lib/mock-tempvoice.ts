// Fake data backing the TempVoice domain (creator channels, global settings, the owner-panel
// embed/interface config, and the button/placeholder vocabulary). Same globalThis-singleton
// pattern as src/lib/mock-store.ts and src/lib/mock-discord.ts, kept in its own file/key so
// this domain's seed work never touches those files.
//
// IDs referenced here (channels, categories, roles) are deliberately their own fake namespace —
// they are not guaranteed to resolve against src/lib/mock-discord.ts's guild data. The TempVoice
// pages fall back to showing the raw id when a name can't be resolved, which is an acceptable
// seam in a demo that intentionally keeps these two mock domains decoupled.

export interface PlaceholderConfig {
  privacy?: { locked?: string; hidden?: string; public?: string };
  randomWords?: string[];
  roleHighestFallback?: string;
  roleHoistFallback?: string;
}

export interface CreatorChannel {
  id: string;
  triggerChannelId: string;
  categoryId: string;
  nameTemplate: string;
  waitingRoomNameTemplate: string;
  userLimit: number;
  bitrate: number | null;
  bitrateMode: 'fixed' | 'max';
  position: 'top' | 'below_creator' | 'bottom';
  fallbackCategoryIds: string[];
  privacyMode: 'public' | 'locked' | 'hidden';
  accessRoleIds: string[];
  accessRoleMode: 'hide' | 'no_join';
  permissionSyncMode: 'none' | 'category' | 'creator';
  ownerPermissions: string[];
  enabledActions: string[];
  featureRoleGates: Record<string, string>;
  restoreOwnerSettings: string[];
  moderationWebhookUrl: string | null;
  chatLogEnabled: boolean;
  censorEnabled: boolean;
  censorWords: string[];
  censorReplacement: string;
  censorPreset: boolean;
  censorHomoglyphs: boolean;
  ageRestricted: boolean;
  greetingMessage: string | null;
  greetingSilent: boolean;
  voiceRoleId: string | null;
  interfaceInVoiceChat: boolean;
  placeholderConfig: PlaceholderConfig | null;
}

export interface GlobalSettings {
  tempvoiceEnabled: boolean;
  tempvoiceLogChannelId: string | null;
  tempvoiceEmojiConfig: string | null;
  tempvoiceCensorEnabled: boolean;
  tempvoiceCensoredWords: string[];
}

export interface InterfaceConfig {
  id: string;
  embedTitle: string | null;
  embedDescription: string | null;
  embedColor: string | null;
  embedFooter: string | null;
  embedImageUrl: string | null;
  webhookName: string | null;
  webhookAvatarUrl: string | null;
  buttonOrder: string[];
}

export interface ActionMeta { key: string; label: string; previewIcon: string }
export interface FeatureMeta { key: string; label: string }
export interface OwnerPermissionMeta { name: string; label: string; warning?: boolean }
export interface PlaceholderMeta {
  token: string;
  label: string;
  group: 'owner' | 'role' | 'counter' | 'activity' | 'ids' | 'other';
  configurable?: boolean;
}

export interface Vocabularies {
  actions: ActionMeta[];
  maxActions: number;
  features: FeatureMeta[];
  ownerPermissions: OwnerPermissionMeta[];
  placeholders: PlaceholderMeta[];
}

interface TempvoiceStoreState {
  creatorChannels: Map<string, CreatorChannel>;
  globalSettings: GlobalSettings;
  interfaceConfig: InterfaceConfig;
}

// Fake snowflakes for this domain's channels/categories/roles/webhooks, kept in a distinct
// numeric range from mock-discord.ts's guild data on purpose (see file header).
function fakeId(seed: number): string {
  return `2000000000000${String(seed).padStart(5, '0')}`;
}

export const TEMPVOICE_ACTIONS: ActionMeta[] = [
  { key: 'lock', label: 'Sperren', previewIcon: '🔒' },
  { key: 'unlock', label: 'Entsperren', previewIcon: '🔓' },
  { key: 'ghost', label: 'Verstecken', previewIcon: '🙈' },
  { key: 'unghost', label: 'Sichtbar', previewIcon: '👁️' },
  { key: 'name', label: 'Umbenennen', previewIcon: '✏️' },
  { key: 'limit', label: 'Limit', previewIcon: '👥' },
  { key: 'claim', label: 'Beanspruchen', previewIcon: '👑' },
  { key: 'transfer', label: 'Übertragen', previewIcon: '🔁' },
  { key: 'permit', label: 'Erlauben', previewIcon: '✅' },
  { key: 'reject', label: 'Ablehnen', previewIcon: '⛔' },
  { key: 'kick', label: 'Kick', previewIcon: '🥾' },
  { key: 'invite', label: 'Einladen', previewIcon: '✉️' },
  { key: 'trust', label: 'Vertrauen', previewIcon: '🤝' },
  { key: 'region', label: 'Region', previewIcon: '🌍' },
  { key: 'bitrate', label: 'Bitrate', previewIcon: '🎚️' },
];

const TEMPVOICE_FEATURES: FeatureMeta[] = [
  { key: 'claim', label: 'Kanal beanspruchen' },
  { key: 'transfer', label: 'Besitz übertragen' },
  { key: 'kick', label: 'Mitglieder kicken' },
  { key: 'name', label: 'Kanal umbenennen' },
  { key: 'limit', label: 'Nutzerlimit ändern' },
  { key: 'region', label: 'Region ändern' },
  { key: 'bitrate', label: 'Bitrate ändern' },
  { key: 'trust', label: 'Vertraute verwalten' },
];

const TEMPVOICE_OWNER_PERMISSIONS: OwnerPermissionMeta[] = [
  { name: 'ManageChannels', label: 'Kanal verwalten' },
  { name: 'MoveMembers', label: 'Mitglieder verschieben' },
  { name: 'MuteMembers', label: 'Stummschalten' },
  { name: 'DeafenMembers', label: 'Taubschalten' },
  { name: 'PrioritySpeaker', label: 'Vorrangredner' },
  { name: 'ManageRoles', label: 'Rollen verwalten', warning: true },
];

const TEMPVOICE_PLACEHOLDERS: PlaceholderMeta[] = [
  { token: '{OWNER}', label: 'Besitzer (Mention)', group: 'owner' },
  { token: '{OWNER_NICKNAME}', label: 'Besitzer (Nickname)', group: 'owner' },
  { token: '{OWNER_USERNAME}', label: 'Besitzer (Benutzername)', group: 'owner' },
  { token: '{OWNER_ID}', label: 'Besitzer-ID', group: 'ids' },
  { token: '{CHANNEL_ID}', label: 'Kanal-ID', group: 'ids' },
  { token: '{ROLE_HIGHEST}', label: 'Höchste Rolle', group: 'role', configurable: true },
  { token: '{ROLE_HOIST}', label: 'Angezeigte Rolle', group: 'role', configurable: true },
  { token: '{PRIVACY}', label: 'Privatsphäre-Status', group: 'other', configurable: true },
  { token: '{RANDOM}', label: 'Zufallswort', group: 'other', configurable: true },
  { token: '{COUNT}', label: 'Anzahl aktiver Temp-Channels', group: 'counter' },
  { token: '{MEMBER_COUNT}', label: 'Mitglieder im Kanal', group: 'counter' },
  { token: '{JOIN_POSITION}', label: 'Beitritts-Nummer', group: 'counter' },
  { token: '{ACTIVITY}', label: 'Aktivität des Besitzers', group: 'activity' },
];

function createInitialState(): TempvoiceStoreState {
  const state: TempvoiceStoreState = {
    creatorChannels: new Map(),
    globalSettings: {
      tempvoiceEnabled: true,
      tempvoiceLogChannelId: fakeId(108),
      tempvoiceEmojiConfig: JSON.stringify({ lock: '🔒', unlock: '🔓', claim: '👑' }, null, 2),
      tempvoiceCensorEnabled: true,
      tempvoiceCensoredWords: ['spam', 'werbung', 'discord.gg'],
    },
    interfaceConfig: {
      id: 'default',
      embedTitle: 'Voice-Interface',
      embedDescription: 'Besitzer: {OWNER}\nNutze die Buttons unten, um deinen Kanal zu steuern.',
      embedColor: '#a72d4d',
      embedFooter: 'ModGuard TempVoice',
      embedImageUrl: null,
      webhookName: 'Voice-Interface',
      webhookAvatarUrl: null,
      buttonOrder: ['lock', 'unlock', 'ghost', 'unghost', 'name', 'limit', 'claim', 'transfer', 'permit', 'reject', 'kick', 'invite'],
    },
  };

  const cc1: CreatorChannel = {
    id: fakeId(1),
    triggerChannelId: fakeId(101),
    categoryId: fakeId(102),
    nameTemplate: "🔊 {OWNER_NICKNAME}'s Channel",
    waitingRoomNameTemplate: '🚪 Warteraum von {OWNER_NICKNAME}',
    userLimit: 6,
    bitrate: null,
    bitrateMode: 'max',
    position: 'top',
    fallbackCategoryIds: [],
    privacyMode: 'public',
    accessRoleIds: [],
    accessRoleMode: 'hide',
    permissionSyncMode: 'category',
    ownerPermissions: ['ManageChannels', 'MoveMembers', 'MuteMembers'],
    enabledActions: ['lock', 'unlock', 'ghost', 'unghost', 'name', 'limit', 'claim', 'transfer', 'permit', 'reject', 'kick', 'invite'],
    featureRoleGates: { kick: fakeId(201) },
    restoreOwnerSettings: ['name', 'limit', 'lists', 'privacy', 'region'],
    moderationWebhookUrl: null,
    chatLogEnabled: true,
    censorEnabled: true,
    censorWords: ['spam', 'werbung', 'nsfw'],
    censorReplacement: '*',
    censorPreset: true,
    censorHomoglyphs: true,
    ageRestricted: false,
    greetingMessage: 'Willkommen in deinem Kanal, {OWNER_NICKNAME}! Nutze die Buttons unten, um ihn anzupassen.',
    greetingSilent: false,
    voiceRoleId: fakeId(202),
    interfaceInVoiceChat: true,
    placeholderConfig: {
      privacy: { public: 'Offen', locked: 'Gesperrt', hidden: 'Geheim' },
      randomWords: ['Zocken', 'Chillen', 'Quatschen'],
      roleHighestFallback: 'Mitglied',
      roleHoistFallback: 'Gast',
    },
  };

  const cc2: CreatorChannel = {
    id: fakeId(2),
    triggerChannelId: fakeId(103),
    categoryId: fakeId(104),
    nameTemplate: '🎮 {OWNER_NICKNAME} zockt',
    waitingRoomNameTemplate: '⏳ Warten auf {OWNER_NICKNAME}',
    userLimit: 4,
    bitrate: 96000,
    bitrateMode: 'fixed',
    position: 'below_creator',
    fallbackCategoryIds: [fakeId(105)],
    privacyMode: 'locked',
    accessRoleIds: [fakeId(203)],
    accessRoleMode: 'no_join',
    permissionSyncMode: 'none',
    ownerPermissions: ['ManageChannels', 'MoveMembers'],
    enabledActions: ['lock', 'unlock', 'ghost', 'unghost', 'limit', 'claim', 'kick', 'region', 'bitrate'],
    featureRoleGates: { region: fakeId(204), bitrate: fakeId(204) },
    restoreOwnerSettings: ['name', 'limit', 'privacy'],
    moderationWebhookUrl: `https://discord.com/api/webhooks/${fakeId(999)}/demo-webhook-token-gaming`,
    chatLogEnabled: false,
    censorEnabled: false,
    censorWords: [],
    censorReplacement: '#',
    censorPreset: false,
    censorHomoglyphs: false,
    ageRestricted: false,
    greetingMessage: null,
    greetingSilent: false,
    voiceRoleId: null,
    interfaceInVoiceChat: false,
    placeholderConfig: null,
  };

  const cc3: CreatorChannel = {
    id: fakeId(3),
    triggerChannelId: fakeId(106),
    categoryId: fakeId(107),
    nameTemplate: "🔥 {OWNER_NICKNAME}'s Lounge {PRIVACY}",
    waitingRoomNameTemplate: '🚪 Klopfen bei {OWNER_NICKNAME}',
    userLimit: 0,
    bitrate: null,
    bitrateMode: 'max',
    position: 'bottom',
    fallbackCategoryIds: [],
    privacyMode: 'hidden',
    accessRoleIds: [fakeId(205)],
    accessRoleMode: 'hide',
    permissionSyncMode: 'creator',
    ownerPermissions: ['ManageChannels', 'MuteMembers', 'DeafenMembers'],
    enabledActions: ['lock', 'unlock', 'ghost', 'unghost', 'name', 'permit', 'reject', 'trust'],
    featureRoleGates: {},
    restoreOwnerSettings: ['name', 'privacy', 'lists'],
    moderationWebhookUrl: null,
    chatLogEnabled: true,
    censorEnabled: true,
    censorWords: ['spam', 'discord.gg'],
    censorReplacement: '>',
    censorPreset: true,
    censorHomoglyphs: true,
    ageRestricted: true,
    greetingMessage: "Bitte an die Serverregeln halten. Viel Spaß in {OWNER_NICKNAME}'s Lounge!",
    greetingSilent: true,
    voiceRoleId: null,
    interfaceInVoiceChat: true,
    placeholderConfig: { privacy: { hidden: 'Privat' } },
  };

  for (const cc of [cc1, cc2, cc3]) state.creatorChannels.set(cc.id, cc);

  return state;
}

const globalForTempvoice = globalThis as unknown as { __mockTempvoiceStore?: TempvoiceStoreState };
const state: TempvoiceStoreState =
  globalForTempvoice.__mockTempvoiceStore ?? (globalForTempvoice.__mockTempvoiceStore = createInitialState());

// --- Creator channels ---
export function listCreatorChannels(): CreatorChannel[] {
  return Array.from(state.creatorChannels.values());
}
export function getCreatorChannelById(id: string): CreatorChannel | undefined {
  return state.creatorChannels.get(id);
}
export function createCreatorChannel(input: Omit<CreatorChannel, 'id'>): CreatorChannel {
  const created: CreatorChannel = { ...input, id: crypto.randomUUID() };
  state.creatorChannels.set(created.id, created);
  return created;
}
export function updateCreatorChannelById(id: string, patch: Partial<CreatorChannel>): CreatorChannel | null {
  const existing = state.creatorChannels.get(id);
  if (!existing) return null;
  const updated: CreatorChannel = { ...existing, ...patch, id: existing.id };
  state.creatorChannels.set(id, updated);
  return updated;
}
export function deleteCreatorChannelById(id: string): boolean {
  return state.creatorChannels.delete(id);
}

// --- Global settings ---
export function getGlobalSettings(): GlobalSettings {
  return state.globalSettings;
}
export function updateGlobalSettings(patch: Partial<GlobalSettings>): GlobalSettings {
  state.globalSettings = { ...state.globalSettings, ...patch };
  return state.globalSettings;
}

// --- Interface (owner-panel embed) config ---
export function getInterfaceConfig(): InterfaceConfig {
  return state.interfaceConfig;
}
export function updateInterfaceConfig(patch: Partial<InterfaceConfig>): InterfaceConfig {
  state.interfaceConfig = { ...state.interfaceConfig, ...patch, id: state.interfaceConfig.id };
  return state.interfaceConfig;
}

// --- Vocabulary (buttons, features, owner permissions, template placeholders) ---
export function getVocabularies(): Vocabularies {
  return {
    actions: TEMPVOICE_ACTIONS,
    maxActions: TEMPVOICE_ACTIONS.length,
    features: TEMPVOICE_FEATURES,
    ownerPermissions: TEMPVOICE_OWNER_PERMISSIONS,
    placeholders: TEMPVOICE_PLACEHOLDERS,
  };
}

// --- Legend image preview ---
// The real backend renders the "so sieht's in Discord aus" legend server-side (button icon +
// label grid) so the editor preview can never drift from what the bot actually posts. There is
// no canvas/image-rendering backend in this demo, so this renders the same grid as a small,
// deterministic SVG instead of faking a PNG — it's a real render of the given input, not a stub,
// and browsers happily display SVG through an <img> tag fed a blob: URL.
export function renderInterfaceLegendSvg(enabledActions: string[]): string {
  const metaByKey = new Map(TEMPVOICE_ACTIONS.map((a) => [a.key, a]));
  const known = enabledActions.filter((a) => metaByKey.has(a));

  const cols = 5;
  const tileSize = 72;
  const gap = 8;
  const padding = 16;
  const rows = Math.max(1, Math.ceil(known.length / cols));
  const width = padding * 2 + cols * tileSize + (cols - 1) * gap;
  const height = padding * 2 + rows * tileSize + (rows - 1) * gap;

  const tiles = known.map((key, i) => {
    const meta = metaByKey.get(key)!;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + col * (tileSize + gap);
    const y = padding + row * (tileSize + gap);
    const label = escapeXml(meta.label.toUpperCase());
    return `
      <g>
        <rect x="${x}" y="${y}" width="${tileSize}" height="${tileSize}" rx="8" fill="#383a40" stroke="#4e5058" />
        <text x="${x + tileSize / 2}" y="${y + tileSize / 2 - 6}" font-size="22" text-anchor="middle" dominant-baseline="middle">${escapeXml(meta.previewIcon)}</text>
        <text x="${x + tileSize / 2}" y="${y + tileSize - 14}" font-size="8" font-weight="700" fill="#dbdee1" text-anchor="middle" font-family="sans-serif">${label}</text>
      </g>`;
  }).join('');

  const emptyNotice = known.length === 0
    ? `<text x="${width / 2}" y="${height / 2}" font-size="11" fill="#949ba4" text-anchor="middle" font-family="sans-serif">Keine Buttons aktiv</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.max(height, padding * 2 + tileSize)}" viewBox="0 0 ${width} ${Math.max(height, padding * 2 + tileSize)}">
  <rect width="100%" height="100%" fill="#2b2d31" />
  ${tiles}
  ${emptyNotice}
</svg>`;
}

function escapeXml(input: string): string {
  return input.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}
