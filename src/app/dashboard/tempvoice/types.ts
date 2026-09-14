/**
 * Shapes shared by the creator list and the creator detail page.
 *
 * The vocabularies (actions, features, owner permissions, placeholders) are
 * fetched from `/api/tempvoice/actions` rather than hardcoded here, so the
 * client and the mock store stay in sync.
 */

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

/** Sub-settings for the placeholders that carry their own configuration. */
export interface PlaceholderConfig {
  privacy?: { locked?: string; hidden?: string; public?: string };
  randomWords?: string[];
  roleHighestFallback?: string;
  roleHoistFallback?: string;
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

export interface GuildChannel { id: string; name: string; type: number }
export interface GuildRole { id: string; name: string; color: number }

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

export const EMPTY_VOCABULARIES: Vocabularies = {
  actions: [],
  maxActions: 15,
  features: [],
  ownerPermissions: [],
  placeholders: [],
};

export const PLACEHOLDER_GROUP_LABELS: Record<PlaceholderMeta['group'], string> = {
  owner: 'Besitzer',
  role: 'Rolle',
  counter: 'Zähler',
  activity: 'Aktivität',
  ids: 'IDs',
  other: 'Sonstiges',
};

/** What "Besitzereinstellungen wiederherstellen" can restore when a member returns. */
export const RESTORE_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'limit', label: 'Benutzerlimit' },
  { value: 'lists', label: 'Vertraute & blockierte Benutzer' },
  { value: 'privacy', label: 'Privatsphäre-Modus' },
  { value: 'region', label: 'Kanalregion' },
] as const;

/** Discord's own choices, matching what the reference product offers. */
export const CENSOR_REPLACEMENTS = ['*', '#', '>', '<', '@', '+', '—'] as const;

export function emptyCreatorChannel(): CreatorChannel {
  return {
    id: '',
    triggerChannelId: '',
    categoryId: '',
    nameTemplate: "{OWNER_NICKNAME}'s Channel",
    waitingRoomNameTemplate: 'Frag {OWNER_NICKNAME} nach Zutritt',
    userLimit: 0,
    bitrate: null,
    bitrateMode: 'fixed',
    position: 'bottom',
    fallbackCategoryIds: [],
    privacyMode: 'public',
    accessRoleIds: [],
    accessRoleMode: 'hide',
    permissionSyncMode: 'none',
    ownerPermissions: ['ManageChannels'],
    enabledActions: [],
    featureRoleGates: {},
    restoreOwnerSettings: ['name', 'limit', 'lists', 'privacy', 'region'],
    moderationWebhookUrl: null,
    chatLogEnabled: false,
    censorEnabled: false,
    censorWords: [],
    censorReplacement: '*',
    censorPreset: true,
    censorHomoglyphs: true,
    ageRestricted: false,
    greetingMessage: null,
    greetingSilent: false,
    voiceRoleId: null,
    interfaceInVoiceChat: true,
    placeholderConfig: null,
  };
}

/** Deep enough for the shapes above, and it keeps the dirty check honest about arrays. */
export function isDirty(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
