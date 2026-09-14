// Fake data backing the "Community Features" grab-bag: confessions, reaction
// roles, the embed builder, webhooks, the welcome/leave card config, birthdays
// and leave-card tags. Same globalThis-singleton pattern as
// src/lib/mock-store.ts and src/lib/mock-discord.ts, kept in its own
// file/key so this domain's seed work never touches those files.

import { genMockId, paginate } from './mock-store';
import type { Paginated } from './types';

// ─── Confessions ────────────────────────────────────────────────────────────
export type ConfessionStatus = 'pending_review' | 'published' | 'rejected';

export interface Confession {
  id: string;
  number: number;
  content: string;
  status: ConfessionStatus;
  createdAt: string;
  userId: string;
}

export interface ConfessionBan {
  id: string;
  userId: string;
  reason: string | null;
  createdById: string;
  createdAt: string;
}

// ─── Reaction roles ─────────────────────────────────────────────────────────
export type RRType = 'BUTTON' | 'SELECT' | 'REACTION';
export type RRButtonStyle = 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER';
export type RRBehavior = 'toggle' | 'add' | 'remove';

export interface RRButton {
  id: string;
  label: string;
  emoji: string | null;
  roleId: string;
  style: RRButtonStyle;
  behavior: RRBehavior;
  position: number;
}

export interface RROption {
  id: string;
  label: string;
  description: string | null;
  emoji: string | null;
  roleId: string;
  position: number;
}

export interface RRReaction {
  id: string;
  emoji: string;
  roleId: string;
  selfRemove: boolean;
}

export interface ReactionRoleGroup {
  id: string;
  name: string;
  type: RRType;
  channelId: string;
  messageId: string | null;
  sentAt: string | null;
  messageContent: string | null;
  embedId: string | null;
  exclusive: boolean;
  allowedRoleIds: string[];
  placeholder: string | null;
  buttons: RRButton[];
  options: RROption[];
  reactions: RRReaction[];
  createdAt: string;
}

export interface ReactionRoleGroupDTO extends ReactionRoleGroup {
  embed: SavedEmbedSummary | null;
  _count: { buttons: number; options: number; reactions: number };
}

// ─── Embed builder ("Embeds" / "Embed Builder") ────────────────────────────
export interface EmbedFieldItem {
  name: string;
  value: string;
  inline: boolean;
}

export interface SavedEmbed {
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
  fields: EmbedFieldItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedEmbedSummary {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  color: string | null;
}

// ─── Webhooks ───────────────────────────────────────────────────────────────
// Raw Discord REST shape (snake_case), same convention as mock-discord.ts.
export interface StoreWebhookUser {
  id: string;
  username: string;
  global_name: string | null;
}

export interface StoreWebhook {
  id: string;
  type: 1 | 2 | 3;
  channel_id: string;
  name: string;
  avatar: string | null;
  user?: StoreWebhookUser;
}

// ─── Welcome / leave card config ────────────────────────────────────────────
export interface WelcomeCardConfig {
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

// ─── Birthdays ──────────────────────────────────────────────────────────────
export interface Birthday {
  userId: string;
  day: number;
  month: number;
  year: number | null;
}

// ─── Leave-card tags ────────────────────────────────────────────────────────
export interface LeaveCardTagRoleRef {
  id: string;
  roleId: string;
}

export interface LeaveCardTag {
  id: string;
  name: string;
  leaveText: string;
  roles: LeaveCardTagRoleRef[];
  createdAt: string;
}

export interface LeaveCardRoleAssignment {
  id: string;
  roleId: string;
  tagId: string;
}

export interface LeaveCardRoleAssignmentDTO extends LeaveCardRoleAssignment {
  tag: LeaveCardTag;
}

// ─── Store ──────────────────────────────────────────────────────────────────
interface CommunityStoreState {
  confessions: Map<string, Confession>;
  confessionBans: Map<string, ConfessionBan>; // keyed by userId
  reactionRoleGroups: Map<string, ReactionRoleGroup>;
  embeds: Map<string, SavedEmbed>;
  webhooks: Map<string, StoreWebhook>;
  welcomeCard: WelcomeCardConfig;
  birthdays: Map<string, Birthday>; // keyed by userId
  leaveCardTags: Map<string, LeaveCardTag>;
  leaveCardRoleAssignments: Map<string, LeaveCardRoleAssignment>; // keyed by roleId
  nextConfessionNumber: number;
}

function createInitialState(): CommunityStoreState {
  const state: CommunityStoreState = {
    confessions: new Map(),
    confessionBans: new Map(),
    reactionRoleGroups: new Map(),
    embeds: new Map(),
    webhooks: new Map(),
    welcomeCard: {
      joinCardEnabled: true,
      joinCardChannelId: '100000000000000101',
      joinCardPreset: 'centered',
      joinCardBackground: '#1e1e2e',
      joinCardTheme: 'dark',
      joinCardSubtitle: 'Schön, dass du da bist!',
      joinCardMessage: 'Willkommen auf **ModGuard**, {user}! Du bist Mitglied #{count}.',
      joinCardShowMemberCount: true,
      joinCardRingColor: '#f47fff',
      joinCardFontColor: '#c9c9d9',
      joinCardFontUsernameColor: '#ffffff',
      leaveCardEnabled: true,
      leaveCardChannelId: '',
      leaveCardPreset: 'minimal',
      leaveCardBackground: '#1e1e2e',
      leaveCardTheme: 'dark',
      leaveCardSubtitle: 'Bis bald!',
      leaveCardBanSubtitle: 'Wurde gebannt',
      leaveCardMessage: '{username} hat den Server verlassen.',
      leaveCardRingColor: '#7c3aed',
      leaveCardFontColor: '#8b8b9e',
      leaveCardFontUsernameColor: '#dcdce6',
    },
    birthdays: new Map(),
    leaveCardTags: new Map(),
    leaveCardRoleAssignments: new Map(),
    nextConfessionNumber: 1,
  };
  seed(state);
  return state;
}

function seed(target: CommunityStoreState) {
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

  // --- Confessions ---
  const confessionSeed: Array<[string, ConfessionStatus, number, string]> = [
    [
      'Ich habe letzte Woche aus Versehen 20 Minuten lang mit offenem Mikro im Voice gesessen und alle meine Katze anschreien hören. Niemand hat was gesagt. Danke dafür.',
      'pending_review', 2, '100000000000009001',
    ],
    [
      'Ehrlich gesagt finde ich die neuen Server-Emotes ziemlich hässlich, aber ich benutze sie trotzdem ständig weil Gruppenzwang.',
      'published', 5, '100000000000009002',
    ],
    [
      'Ich hatte vor ein paar Monaten einen Alt-Account und habe damit im off-topic Chaos gestiftet. Tut mir leid, Team – ich wollte einfach nur mal ohne meinen Ruf posten können.',
      'rejected', 10, '100000000000009003',
    ],
  ];
  for (const [content, status, daysBack, userId] of confessionSeed) {
    const id = genMockId();
    target.confessions.set(id, {
      id,
      number: target.nextConfessionNumber++,
      content,
      status,
      createdAt: daysAgo(daysBack),
      userId,
    });
  }

  // --- Confession bans ---
  target.confessionBans.set('100000000000009004', {
    id: genMockId(),
    userId: '100000000000009004',
    reason: 'Wiederholt beleidigende Confessions eingereicht',
    createdById: '100000000000000001',
    createdAt: daysAgo(45),
  });
  target.confessionBans.set('100000000000009005', {
    id: genMockId(),
    userId: '100000000000009005',
    reason: 'Spam trotz Verwarnung',
    createdById: '100000000000000001',
    createdAt: daysAgo(12),
  });

  // --- Embeds (Embed Builder) ---
  const rulesEmbedId = genMockId();
  target.embeds.set(rulesEmbedId, {
    id: rulesEmbedId,
    name: 'Serverregeln',
    title: '📜 Serverregeln',
    url: null,
    description: 'Bitte lest euch die Regeln durch, bevor ihr loslegt. Verstöße führen zu Punkten oder direkten Sanktionen.',
    color: '5865F2',
    authorName: null,
    authorIcon: null,
    footerText: 'ModGuard • Zuletzt aktualisiert',
    footerIcon: null,
    imageUrl: null,
    thumbnailUrl: null,
    timestamp: true,
    fields: [
      { name: '1. Respekt', value: 'Behandelt euch gegenseitig mit Anstand. Beleidigungen und Hassrede führen zu sofortigen Konsequenzen.', inline: false },
      { name: '2. Kein Spam', value: 'Keine Werbung, keine Massen-Pings, kein Flooding von Nachrichten oder Emotes.', inline: false },
      { name: '3. NSFW', value: 'Nicht jugendfreie Inhalte gehören ausschließlich in die dafür markierten Kanäle.', inline: false },
    ],
    createdAt: daysAgo(200),
    updatedAt: daysAgo(30),
  });

  const welcomeEmbedId = genMockId();
  target.embeds.set(welcomeEmbedId, {
    id: welcomeEmbedId,
    name: 'Willkommen',
    title: 'Willkommen auf ModGuard! 👋',
    url: null,
    description: 'Schön, dass du da bist, {user}! Schau dir kurz #regeln an und hol dir in #reaktionsrollen deine Rollen ab.',
    color: '57F287',
    authorName: 'ModGuard',
    authorIcon: null,
    footerText: 'Wir sind jetzt {memberCount} Mitglieder stark',
    footerIcon: null,
    imageUrl: null,
    thumbnailUrl: null,
    timestamp: false,
    fields: [],
    createdAt: daysAgo(180),
    updatedAt: daysAgo(180),
  });

  const eventEmbedId = genMockId();
  target.embeds.set(eventEmbedId, {
    id: eventEmbedId,
    name: 'Event-Ankündigung',
    title: '🎉 Community-Movie-Night',
    url: null,
    description: 'Diesen Freitag ab 20 Uhr im Voice "Lounge". Popcorn wird nicht gestellt.',
    color: 'EB459E',
    authorName: null,
    authorIcon: null,
    footerText: null,
    footerIcon: null,
    imageUrl: null,
    thumbnailUrl: null,
    timestamp: true,
    fields: [
      { name: 'Wann', value: 'Freitag, 20:00 Uhr', inline: true },
      { name: 'Wo', value: '#lounge (Voice)', inline: true },
    ],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  });

  // --- Reaction roles ---
  const playerRolesId = genMockId();
  target.reactionRoleGroups.set(playerRolesId, {
    id: playerRolesId,
    name: 'Spielerollen',
    type: 'SELECT',
    channelId: '100000000000000108',
    messageId: '100000000000009101',
    sentAt: daysAgo(60),
    messageContent: 'Wähle deine Spiele aus, um passende Pings zu bekommen:',
    embedId: null,
    exclusive: false,
    allowedRoleIds: [],
    placeholder: 'Wähle ein Spiel…',
    buttons: [],
    options: [
      { id: genMockId(), label: 'Valorant', description: 'Pings für Valorant-Sessions', emoji: '🎯', roleId: '100000000000009201', position: 0 },
      { id: genMockId(), label: 'Minecraft', description: 'Pings für unseren SMP-Server', emoji: '⛏️', roleId: '100000000000009202', position: 1 },
      { id: genMockId(), label: 'Rocket League', description: 'Pings für 2v2/3v3', emoji: '🚀', roleId: '100000000000009203', position: 2 },
    ],
    reactions: [],
    createdAt: daysAgo(60),
  });

  const pronounRolesId = genMockId();
  target.reactionRoleGroups.set(pronounRolesId, {
    id: pronounRolesId,
    name: 'Pronomen',
    type: 'BUTTON',
    channelId: '100000000000000105',
    messageId: '100000000000009102',
    sentAt: daysAgo(90),
    messageContent: 'Klick dir dein(e) Pronomen an:',
    embedId: null,
    exclusive: false,
    allowedRoleIds: [],
    placeholder: null,
    buttons: [
      { id: genMockId(), label: 'er/ihm', emoji: null, roleId: '100000000000009211', style: 'PRIMARY', behavior: 'toggle', position: 0 },
      { id: genMockId(), label: 'sie/ihr', emoji: null, roleId: '100000000000009212', style: 'PRIMARY', behavior: 'toggle', position: 1 },
      { id: genMockId(), label: 'they/them', emoji: null, roleId: '100000000000009213', style: 'PRIMARY', behavior: 'toggle', position: 2 },
    ],
    options: [],
    reactions: [],
    createdAt: daysAgo(90),
  });

  const eventPingId = genMockId();
  target.reactionRoleGroups.set(eventPingId, {
    id: eventPingId,
    name: 'Event-Ping',
    type: 'REACTION',
    channelId: '100000000000000103',
    messageId: null,
    sentAt: null,
    messageContent: null,
    embedId: eventEmbedId,
    exclusive: false,
    allowedRoleIds: [],
    placeholder: null,
    buttons: [],
    options: [],
    reactions: [
      { id: genMockId(), emoji: '🎉', roleId: '100000000000009221', selfRemove: true },
    ],
    createdAt: daysAgo(3),
  });

  // --- Webhooks ---
  target.webhooks.set('100000000000009301', {
    id: '100000000000009301',
    type: 1,
    channel_id: '100000000000000103',
    name: 'Ankündigungs-Bot',
    avatar: null,
  });
  target.webhooks.set('100000000000009302', {
    id: '100000000000009302',
    type: 1,
    channel_id: '100000000000000105',
    name: 'Twitch-Live-Alerts',
    avatar: null,
    user: { id: '100000000000000001', username: 'quitscope', global_name: 'Quit' },
  });

  // --- Birthdays ---
  const birthdaySeed: Array<[string, number, number, number | null]> = [
    ['100000000000009401', 14, 2, 2001],
    ['100000000000009402', 3, 5, 1998],
    ['100000000000009403', 21, 7, null],
    ['100000000000009404', 9, 9, 2003],
    ['100000000000009405', 30, 11, 1995],
  ];
  for (const [userId, day, month, year] of birthdaySeed) {
    target.birthdays.set(userId, { userId, day, month, year });
  }

  // --- Leave-card tags ---
  const cheaterTagId = genMockId();
  target.leaveCardTags.set(cheaterTagId, {
    id: cheaterTagId,
    name: 'Cheater',
    leaveText: 'Wurde wegen Cheatens aus dem Server entfernt.',
    roles: [{ id: genMockId(), roleId: '100000000000009501' }],
    createdAt: daysAgo(100),
  });

  const scammerTagId = genMockId();
  target.leaveCardTags.set(scammerTagId, {
    id: scammerTagId,
    name: 'Scammer',
    leaveText: 'Wurde wegen Betrugsversuchen im Server gebannt.',
    roles: [{ id: genMockId(), roleId: '100000000000009502' }],
    createdAt: daysAgo(70),
  });

  target.leaveCardRoleAssignments.set('100000000000009501', {
    id: genMockId(),
    roleId: '100000000000009501',
    tagId: cheaterTagId,
  });
  target.leaveCardRoleAssignments.set('100000000000009502', {
    id: genMockId(),
    roleId: '100000000000009502',
    tagId: scammerTagId,
  });
}

// Next.js bundles each route handler and page into its own server-side chunk;
// a plain module-level singleton gets a separate copy baked into every chunk
// instead of one instance shared per process. Attaching the state to
// globalThis is the standard workaround (the same pattern Prisma Client's
// Next.js docs recommend) so every chunk reads and writes the same object.
const globalForCommunity = globalThis as unknown as { __mockCommunityStore?: CommunityStoreState };
const state: CommunityStoreState =
  globalForCommunity.__mockCommunityStore ?? (globalForCommunity.__mockCommunityStore = createInitialState());

// ─── Confessions ────────────────────────────────────────────────────────────
export function listConfessions(status: ConfessionStatus, page: number): Paginated<Confession> {
  const filtered = Array.from(state.confessions.values())
    .filter((c) => c.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return paginate(filtered, page);
}

export function getConfessionById(id: string): Confession | undefined {
  return state.confessions.get(id);
}

export function updateConfessionStatus(id: string, status: ConfessionStatus): Confession | null {
  const existing = state.confessions.get(id);
  if (!existing) return null;
  const updated: Confession = { ...existing, status };
  state.confessions.set(id, updated);
  return updated;
}

// ─── Confession bans ────────────────────────────────────────────────────────
export function listConfessionBans(): ConfessionBan[] {
  return Array.from(state.confessionBans.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addConfessionBan(entry: { userId: string; reason: string | null; createdById: string }): ConfessionBan {
  const ban: ConfessionBan = {
    id: genMockId(),
    userId: entry.userId,
    reason: entry.reason,
    createdById: entry.createdById,
    createdAt: new Date().toISOString(),
  };
  state.confessionBans.set(entry.userId, ban);
  return ban;
}

export function removeConfessionBan(userId: string): boolean {
  return state.confessionBans.delete(userId);
}

// ─── Reaction roles ─────────────────────────────────────────────────────────
function toReactionRoleDTO(g: ReactionRoleGroup): ReactionRoleGroupDTO {
  const embed = g.embedId ? getEmbedById(g.embedId) : undefined;
  return {
    ...g,
    embed: embed ? toEmbedSummary(embed) : null,
    _count: { buttons: g.buttons.length, options: g.options.length, reactions: g.reactions.length },
  };
}

export function listReactionRoleGroups(): ReactionRoleGroupDTO[] {
  return Array.from(state.reactionRoleGroups.values())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toReactionRoleDTO);
}

export function getReactionRoleGroupById(id: string): ReactionRoleGroupDTO | undefined {
  const g = state.reactionRoleGroups.get(id);
  return g ? toReactionRoleDTO(g) : undefined;
}

interface ReactionRoleGroupInput {
  name: string;
  type: RRType;
  channelId: string;
  messageContent: string | null;
  embedId: string | null;
  exclusive: boolean;
  allowedRoleIds: string[];
  messageId?: string | null;
  sentAt?: string | null;
  placeholder: string | null;
  buttons: Array<Partial<RRButton> & { label: string; roleId: string }>;
  options: Array<Partial<RROption> & { label: string; roleId: string }>;
  reactions: Array<Partial<RRReaction> & { emoji: string; roleId: string }>;
}

function toButtons(items: ReactionRoleGroupInput['buttons']): RRButton[] {
  return items.map((b, i) => ({
    id: b.id ?? genMockId(),
    label: b.label,
    emoji: b.emoji ?? null,
    roleId: b.roleId,
    style: b.style ?? 'SECONDARY',
    behavior: b.behavior ?? 'toggle',
    position: b.position ?? i,
  }));
}

function toOptions(items: ReactionRoleGroupInput['options']): RROption[] {
  return items.map((o, i) => ({
    id: o.id ?? genMockId(),
    label: o.label,
    description: o.description ?? null,
    emoji: o.emoji ?? null,
    roleId: o.roleId,
    position: o.position ?? i,
  }));
}

function toReactions(items: ReactionRoleGroupInput['reactions']): RRReaction[] {
  return items.map((r) => ({
    id: r.id ?? genMockId(),
    emoji: r.emoji,
    roleId: r.roleId,
    selfRemove: r.selfRemove ?? false,
  }));
}

export function addReactionRoleGroup(input: ReactionRoleGroupInput): ReactionRoleGroupDTO {
  const id = genMockId();
  const group: ReactionRoleGroup = {
    id,
    name: input.name,
    type: input.type,
    channelId: input.channelId,
    messageId: input.messageId ?? null,
    sentAt: input.sentAt ?? null,
    messageContent: input.messageContent,
    embedId: input.embedId,
    exclusive: input.exclusive,
    allowedRoleIds: input.allowedRoleIds,
    placeholder: input.placeholder,
    buttons: toButtons(input.buttons),
    options: toOptions(input.options),
    reactions: toReactions(input.reactions),
    createdAt: new Date().toISOString(),
  };
  state.reactionRoleGroups.set(id, group);
  return toReactionRoleDTO(group);
}

export function updateReactionRoleGroup(id: string, input: ReactionRoleGroupInput): ReactionRoleGroupDTO | null {
  const existing = state.reactionRoleGroups.get(id);
  if (!existing) return null;
  const updated: ReactionRoleGroup = {
    ...existing,
    name: input.name,
    type: input.type,
    channelId: input.channelId,
    messageContent: input.messageContent,
    embedId: input.embedId,
    exclusive: input.exclusive,
    allowedRoleIds: input.allowedRoleIds,
    placeholder: input.placeholder,
    buttons: toButtons(input.buttons),
    options: toOptions(input.options),
    reactions: toReactions(input.reactions),
    messageId: input.messageId !== undefined ? input.messageId : existing.messageId,
    sentAt: input.sentAt !== undefined ? input.sentAt : existing.sentAt,
  };
  state.reactionRoleGroups.set(id, updated);
  return toReactionRoleDTO(updated);
}

export function deleteReactionRoleGroup(id: string): boolean {
  return state.reactionRoleGroups.delete(id);
}

export function clearReactionRoleGroupMessage(id: string): ReactionRoleGroupDTO | null {
  const existing = state.reactionRoleGroups.get(id);
  if (!existing) return null;
  const updated: ReactionRoleGroup = { ...existing, messageId: null, sentAt: null };
  state.reactionRoleGroups.set(id, updated);
  return toReactionRoleDTO(updated);
}

// ─── Embeds (Embed Builder) ─────────────────────────────────────────────────
function toEmbedSummary(e: SavedEmbed): SavedEmbedSummary {
  return { id: e.id, name: e.name, title: e.title, description: e.description, color: e.color };
}

export function listEmbeds(): SavedEmbed[] {
  return Array.from(state.embeds.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getEmbedById(id: string): SavedEmbed | undefined {
  return state.embeds.get(id);
}

type EmbedInput = Omit<SavedEmbed, 'id' | 'createdAt' | 'updatedAt'>;

export function addEmbed(input: EmbedInput): SavedEmbed {
  const id = genMockId();
  const now = new Date().toISOString();
  const embed: SavedEmbed = { ...input, id, createdAt: now, updatedAt: now };
  state.embeds.set(id, embed);
  return embed;
}

export function updateEmbed(id: string, input: EmbedInput): SavedEmbed | null {
  const existing = state.embeds.get(id);
  if (!existing) return null;
  const updated: SavedEmbed = { ...existing, ...input, id, updatedAt: new Date().toISOString() };
  state.embeds.set(id, updated);
  return updated;
}

export function deleteEmbed(id: string): boolean {
  return state.embeds.delete(id);
}

// ─── Webhooks ───────────────────────────────────────────────────────────────
export function listWebhooks(): StoreWebhook[] {
  return Array.from(state.webhooks.values());
}

export function addWebhook(input: { name: string; channelId: string }): StoreWebhook {
  const id = genMockId();
  const webhook: StoreWebhook = {
    id,
    type: 1,
    channel_id: input.channelId,
    name: input.name,
    avatar: null,
  };
  state.webhooks.set(id, webhook);
  return webhook;
}

export function deleteWebhook(id: string): boolean {
  return state.webhooks.delete(id);
}

// ─── Welcome / leave card config ────────────────────────────────────────────
export function getWelcomeCardConfig(): WelcomeCardConfig {
  return state.welcomeCard;
}

export function updateWelcomeCardConfig(patch: Partial<WelcomeCardConfig>): WelcomeCardConfig {
  state.welcomeCard = { ...state.welcomeCard, ...patch };
  return state.welcomeCard;
}

// ─── Birthdays ──────────────────────────────────────────────────────────────
export function listBirthdays(page: number): Paginated<Birthday> {
  const all = Array.from(state.birthdays.values()).sort((a, b) => a.month - b.month || a.day - b.day);
  return paginate(all, page);
}

export function deleteBirthday(userId: string): boolean {
  return state.birthdays.delete(userId);
}

// ─── Leave-card tags ────────────────────────────────────────────────────────
export function listLeaveCardTags(): LeaveCardTag[] {
  return Array.from(state.leaveCardTags.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getLeaveCardTagById(id: string): LeaveCardTag | undefined {
  return state.leaveCardTags.get(id);
}

export function addLeaveCardTag(input: { name: string; leaveText: string }): LeaveCardTag {
  const id = genMockId();
  const tag: LeaveCardTag = { id, name: input.name, leaveText: input.leaveText, roles: [], createdAt: new Date().toISOString() };
  state.leaveCardTags.set(id, tag);
  return tag;
}

export function updateLeaveCardTag(id: string, patch: Partial<Pick<LeaveCardTag, 'name' | 'leaveText'>>): LeaveCardTag | null {
  const existing = state.leaveCardTags.get(id);
  if (!existing) return null;
  const updated: LeaveCardTag = { ...existing, ...patch };
  state.leaveCardTags.set(id, updated);
  return updated;
}

export function deleteLeaveCardTag(id: string): boolean {
  const existed = state.leaveCardTags.delete(id);
  if (existed) {
    for (const [roleId, assignment] of state.leaveCardRoleAssignments) {
      if (assignment.tagId === id) state.leaveCardRoleAssignments.delete(roleId);
    }
  }
  return existed;
}

export function listLeaveCardRoleAssignments(): LeaveCardRoleAssignmentDTO[] {
  const result: LeaveCardRoleAssignmentDTO[] = [];
  for (const assignment of state.leaveCardRoleAssignments.values()) {
    const tag = state.leaveCardTags.get(assignment.tagId);
    if (tag) result.push({ ...assignment, tag });
  }
  return result;
}

export function setLeaveCardRoleAssignment(roleId: string, tagId: string): LeaveCardRoleAssignmentDTO | null {
  const tag = state.leaveCardTags.get(tagId);
  if (!tag) return null;
  const existing = state.leaveCardRoleAssignments.get(roleId);
  const assignment: LeaveCardRoleAssignment = { id: existing?.id ?? genMockId(), roleId, tagId };
  state.leaveCardRoleAssignments.set(roleId, assignment);
  return { ...assignment, tag };
}

export function removeLeaveCardRoleAssignment(roleId: string): boolean {
  return state.leaveCardRoleAssignments.delete(roleId);
}
