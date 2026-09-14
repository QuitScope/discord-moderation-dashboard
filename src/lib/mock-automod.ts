// Fake AutoMod / Points / Counting-Fail-Tiers config backing the moderation
// config surface (src/app/api/automod/*, /api/points/config,
// /api/counting-fail-tiers/*). Same globalThis-singleton pattern as
// src/lib/mock-store.ts and src/lib/mock-discord.ts, kept in its own
// file/key so this domain's seed work never touches those files.

import { listChannels, listRoles } from './mock-discord';

export type AutoModRuleType =
  | 'banned_words'
  | 'anti_spam'
  | 'anti_invites'
  | 'anti_links'
  | 'anti_caps'
  | 'mentions_spam'
  | 'anti_scam';

export type AutoModPunishment = 'none' | 'timeout' | 'kick' | 'ban';
export type AutoModDurationUnit = 'minutes' | 'hours' | 'days' | 'permanent';

export interface AutoModRule {
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

export interface AutoModConfig {
  autoModEnabled: boolean;
  autoModLogChannelId: string | null;
  autoModWhitelistChannelIds: string[];
  autoModWhitelistRoleIds: string[];
}

export interface PointsConfig {
  pointsPerBump: number;
  countingRescueEnabled: boolean;
  countingRescueCost: number;
  countingRescueMessage: string | null;
  failTierRedeemEnabled: boolean;
  failTierRedeemCost: number;
  failTierRedeemMessage: string | null;
  pointsPerWortketteWord: number;
  wortketteDailyPointsCap: number;
}

export interface FailTier {
  id: string;
  order: number;
  roleId: string;
  emoji: string;
}

interface AutomodStoreState {
  automodConfig: AutoModConfig;
  automodRules: Map<AutoModRuleType, AutoModRule>;
  pointsConfig: PointsConfig;
  failTiers: Map<string, FailTier>;
  nextRuleId: number;
  nextTierId: number;
}

// Looked up by name from the shared mock-discord guild data so the config
// surface points at real, resolvable channels/roles. Falls back to a
// snowflake in a numeric range mock-discord.ts never generates (its genId()
// only ever produces `10000000000000xxxxx`) if a name isn't found, so IDs
// here can never collide with one seeded there.
function findChannelIdByName(name: string): string | null {
  return listChannels().find((c) => c.name === name)?.id ?? null;
}
function findRoleIdByName(name: string): string | null {
  return listRoles().find((r) => r.name === name)?.id ?? null;
}
function fallbackId(seed: number): string {
  return `20000000000000${String(seed).padStart(5, '0')}`;
}

function createInitialState(): AutomodStoreState {
  const modRoleId = findRoleIdByName('Moderator') ?? fallbackId(1);
  const adminRoleId = findRoleIdByName('Admin') ?? fallbackId(2);
  const ownerRoleId = findRoleIdByName('Owner') ?? fallbackId(3);
  const trustedRoleId = findRoleIdByName('Trusted') ?? fallbackId(4);
  const logChannelId = findChannelIdByName('mod-log') ?? fallbackId(5);
  const botCommandsChannelId = findChannelIdByName('bot-commands') ?? fallbackId(6);
  const spamTestChannelId = findChannelIdByName('spam-test') ?? fallbackId(7);

  let ruleIdSeq = 1;
  const rules: AutoModRule[] = [
    {
      id: String(ruleIdSeq++),
      type: 'banned_words',
      enabled: true,
      punishment: 'timeout',
      durationValue: 10,
      durationUnit: 'minutes',
      exemptChannelIds: [],
      exemptRoleIds: [modRoleId, adminRoleId, ownerRoleId],
      words: ['wichser', '*hurensohn*', 'missgeburt', 'opfer'],
      maxCount: null,
      intervalSeconds: null,
      allowedDomains: [],
    },
    {
      id: String(ruleIdSeq++),
      type: 'anti_spam',
      enabled: true,
      punishment: 'timeout',
      durationValue: 5,
      durationUnit: 'minutes',
      exemptChannelIds: [botCommandsChannelId, spamTestChannelId],
      exemptRoleIds: [modRoleId, adminRoleId, ownerRoleId],
      words: [],
      maxCount: 5,
      intervalSeconds: 7,
      allowedDomains: [],
    },
    {
      id: String(ruleIdSeq++),
      type: 'anti_invites',
      enabled: true,
      punishment: 'kick',
      durationValue: null,
      durationUnit: null,
      exemptChannelIds: [],
      exemptRoleIds: [modRoleId, adminRoleId, ownerRoleId, trustedRoleId],
      words: [],
      maxCount: null,
      intervalSeconds: null,
      allowedDomains: [],
    },
    {
      id: String(ruleIdSeq++),
      type: 'anti_links',
      enabled: false,
      punishment: 'none',
      durationValue: null,
      durationUnit: null,
      exemptChannelIds: [botCommandsChannelId],
      exemptRoleIds: [modRoleId, adminRoleId, ownerRoleId],
      words: [],
      maxCount: null,
      intervalSeconds: null,
      allowedDomains: ['*tenor.com', 'youtube.com', 'youtu.be', 'open.spotify.com', 'twitter.com', 'x.com'],
    },
    {
      id: String(ruleIdSeq++),
      type: 'anti_caps',
      enabled: true,
      punishment: 'none',
      durationValue: null,
      durationUnit: null,
      exemptChannelIds: [],
      exemptRoleIds: [modRoleId, adminRoleId, ownerRoleId],
      words: [],
      maxCount: null,
      intervalSeconds: null,
      allowedDomains: [],
    },
    {
      id: String(ruleIdSeq++),
      type: 'mentions_spam',
      enabled: true,
      punishment: 'timeout',
      durationValue: 30,
      durationUnit: 'minutes',
      exemptChannelIds: [],
      exemptRoleIds: [modRoleId, adminRoleId, ownerRoleId],
      words: [],
      maxCount: 5,
      intervalSeconds: null,
      allowedDomains: [],
    },
    {
      id: String(ruleIdSeq++),
      type: 'anti_scam',
      enabled: true,
      punishment: 'ban',
      durationValue: null,
      durationUnit: 'permanent',
      exemptChannelIds: [],
      exemptRoleIds: [modRoleId, adminRoleId, ownerRoleId],
      words: ['*free nitro*', '*steam gift*', '*discord.gg/nitro*', '*airdrop claim*', '*your account has been reported*'],
      maxCount: null,
      intervalSeconds: null,
      allowedDomains: [],
    },
  ];

  const automodRules = new Map<AutoModRuleType, AutoModRule>();
  for (const r of rules) automodRules.set(r.type, r);

  const automodConfig: AutoModConfig = {
    autoModEnabled: true,
    autoModLogChannelId: logChannelId,
    autoModWhitelistChannelIds: [botCommandsChannelId, spamTestChannelId],
    autoModWhitelistRoleIds: [modRoleId, adminRoleId, ownerRoleId],
  };

  const pointsConfig: PointsConfig = {
    pointsPerBump: 5,
    countingRescueEnabled: true,
    countingRescueCost: 10,
    countingRescueMessage:
      '{{usermention}} hat sich für {{cost}} Punkte freigekauft und die Zählkette gerettet! Nächste Zahl: **{{nextnumber}}**. Verbleibendes Guthaben: {{balance}}.',
    failTierRedeemEnabled: true,
    failTierRedeemCost: 15,
    failTierRedeemMessage: 'Deine Fail-Stufe wurde für {{cost}} Punkte zurückgesetzt. Verbleibendes Guthaben: {{balance}}.',
    pointsPerWortketteWord: 0.5,
    wortketteDailyPointsCap: 20,
  };

  // Cosmetic "shame badge" roles the bot assigns as a member's counting-fail
  // streak climbs (and removes again after 24h without a fail). These are a
  // dedicated role set that only this feature would use, so — unlike the
  // exempt-role references above — there's nothing appropriate to look up by
  // name in the shared guild seed; the frontend's own "Unbekannte Rolle"
  // fallback (src/app/dashboard/counting-fail-tiers/page.tsx) is there for
  // exactly this kind of role that isn't part of the general role list.
  const failTierRoleIds = [fallbackId(801), fallbackId(802), fallbackId(803), fallbackId(804)];
  const failTierEmojis = ['🐣', '😵‍💫', '🤡', '💀'];
  let tierIdSeq = 1;
  const failTiers = new Map<string, FailTier>();
  failTierRoleIds.forEach((roleId, i) => {
    const id = String(tierIdSeq++);
    failTiers.set(id, { id, order: i + 1, roleId, emoji: failTierEmojis[i] });
  });

  return {
    automodConfig,
    automodRules,
    pointsConfig,
    failTiers,
    nextRuleId: ruleIdSeq,
    nextTierId: tierIdSeq,
  };
}

const globalForAutomod = globalThis as unknown as { __mockAutomodStore?: AutomodStoreState };
const state: AutomodStoreState = globalForAutomod.__mockAutomodStore ?? (globalForAutomod.__mockAutomodStore = createInitialState());

// --- AutoMod config ---
export function getAutomodConfig(): AutoModConfig {
  return state.automodConfig;
}
export function updateAutomodConfig(patch: Partial<AutoModConfig>): AutoModConfig {
  state.automodConfig = { ...state.automodConfig, ...patch };
  return state.automodConfig;
}

// --- AutoMod rules ---
export function listAutomodRules(): AutoModRule[] {
  return Array.from(state.automodRules.values());
}
export function getAutomodRuleByType(type: AutoModRuleType): AutoModRule | undefined {
  return state.automodRules.get(type);
}
export function updateAutomodRuleByType(type: AutoModRuleType, patch: Partial<AutoModRule>): AutoModRule | null {
  const existing = state.automodRules.get(type);
  if (!existing) return null;
  const updated: AutoModRule = { ...existing, ...patch, id: existing.id, type: existing.type };
  state.automodRules.set(type, updated);
  return updated;
}

// --- Points config ---
export function getPointsConfig(): PointsConfig {
  return state.pointsConfig;
}
export function updatePointsConfig(patch: Partial<PointsConfig>): PointsConfig {
  state.pointsConfig = { ...state.pointsConfig, ...patch };
  return state.pointsConfig;
}

// --- Counting fail tiers ---
export function listFailTiers(): FailTier[] {
  return Array.from(state.failTiers.values()).sort((a, b) => a.order - b.order);
}
export function getFailTierById(id: string): FailTier | undefined {
  return state.failTiers.get(id);
}
export function addFailTier(data: { roleId: string; emoji: string }): FailTier {
  const id = String(state.nextTierId++);
  const order = state.failTiers.size + 1;
  const tier: FailTier = { id, order, roleId: data.roleId, emoji: data.emoji };
  state.failTiers.set(id, tier);
  return tier;
}
export function updateFailTier(id: string, patch: { roleId?: string; emoji?: string }): FailTier | null {
  const existing = state.failTiers.get(id);
  if (!existing) return null;
  const updated: FailTier = { ...existing, ...patch, id: existing.id, order: existing.order };
  state.failTiers.set(id, updated);
  return updated;
}
export function deleteFailTier(id: string): FailTier | null {
  const existing = state.failTiers.get(id);
  if (!existing) return null;
  state.failTiers.delete(id);
  // Re-number the remaining tiers so `order` stays a dense 1..n sequence.
  const remaining = listFailTiers();
  remaining.forEach((tier, i) => {
    state.failTiers.set(tier.id, { ...tier, order: i + 1 });
  });
  return existing;
}
export function reorderFailTiers(orderedIds: string[]): FailTier[] {
  orderedIds.forEach((id, i) => {
    const existing = state.failTiers.get(id);
    if (existing) state.failTiers.set(id, { ...existing, order: i + 1 });
  });
  return listFailTiers();
}
