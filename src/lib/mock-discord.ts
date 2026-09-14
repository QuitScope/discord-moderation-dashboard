// Fake Discord guild data backing the "server management" surface (channels,
// roles, members, threads, watchlist) and the generic /api/discord/* metadata
// proxies. Same globalThis-singleton pattern as src/lib/mock-store.ts, kept
// in its own file/key so this domain's seed work never touches that file.

export interface GuildChannel {
  id: string;
  type: number;
  name: string;
  guild_id: string;
  position: number;
  rate_limit_per_user: number;
  permission_overwrites: { id: string; type: 0 | 1; allow: string; deny: string }[];
}

export interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
  hoist: boolean;
  permissions: string;
}

export interface GuildMemberUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

export interface GuildMemberRecord {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  roleIds: string[];
  joinedAt: string;
  activePoints: number;
  caseCount: number;
  activeTimeoutUntil: string | null;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  reason: string;
  createdById: string;
  createdAt: string;
}

export interface GuildThread {
  id: string;
  name: string;
  type: number;
  parent_id: string | null;
  owner_id: string | null;
  message_count: number;
  member_count: number;
  thread_metadata: { archived: boolean; locked: boolean; create_timestamp: string | null };
}

export interface DiscordEmoji {
  id: string;
  name: string;
  animated: boolean;
}

export const GUILD_ID = '1000000000000000001';

interface DiscordStoreState {
  channels: Map<string, GuildChannel>;
  roles: Map<string, GuildRole>;
  members: Map<string, GuildMemberRecord>;
  watchlist: Map<string, WatchlistEntry>;
  threads: Map<string, GuildThread>;
  emojis: DiscordEmoji[];
}

function genId(seed: number): string {
  return `10000000000000${String(seed).padStart(5, '0')}`;
}

function createInitialState(): DiscordStoreState {
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

  const state: DiscordStoreState = {
    channels: new Map(),
    roles: new Map(),
    members: new Map(),
    watchlist: new Map(),
    threads: new Map(),
    emojis: [],
  };

  // --- Roles (position: higher = higher in the role list) ---
  const roles: GuildRole[] = [
    { id: GUILD_ID, name: '@everyone', color: 0, position: 0, managed: false, hoist: false, permissions: '104324673' },
    { id: genId(2), name: 'Owner', color: 0xf1c40f, position: 6, managed: false, hoist: true, permissions: '8' },
    { id: genId(3), name: 'Admin', color: 0xe74c3c, position: 5, managed: false, hoist: true, permissions: '8' },
    { id: genId(4), name: 'Moderator', color: 0x3498db, position: 4, managed: false, hoist: true, permissions: '1099511627775' },
    { id: genId(5), name: 'Trusted', color: 0x2ecc71, position: 3, managed: false, hoist: false, permissions: '104324673' },
    { id: genId(6), name: 'Server Booster', color: 0xe91e8c, position: 2, managed: false, hoist: true, permissions: '104324673' },
    { id: genId(7), name: 'Mitglied', color: 0x99aab5, position: 1, managed: false, hoist: false, permissions: '104324673' },
    { id: genId(8), name: 'MEE6', color: 0, position: 1, managed: true, hoist: false, permissions: '104324673' },
  ];
  for (const r of roles) state.roles.set(r.id, r);

  const [, ownerRole, adminRole, modRole, trustedRole, boosterRole, memberRole] = roles;

  // --- Channels ---
  const channels: GuildChannel[] = [
    { id: genId(101), type: 4, name: 'Willkommen', guild_id: GUILD_ID, position: 0, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(102), type: 0, name: 'regeln', guild_id: GUILD_ID, position: 1, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(103), type: 5, name: 'ankündigungen', guild_id: GUILD_ID, position: 2, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(104), type: 4, name: 'Community', guild_id: GUILD_ID, position: 3, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(105), type: 0, name: 'allgemein', guild_id: GUILD_ID, position: 4, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(106), type: 0, name: 'off-topic', guild_id: GUILD_ID, position: 5, rate_limit_per_user: 5, permission_overwrites: [] },
    { id: genId(107), type: 0, name: 'memes', guild_id: GUILD_ID, position: 6, rate_limit_per_user: 10, permission_overwrites: [] },
    { id: genId(108), type: 0, name: 'bot-commands', guild_id: GUILD_ID, position: 7, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(109), type: 15, name: 'support-tickets', guild_id: GUILD_ID, position: 8, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(110), type: 4, name: 'Moderation', guild_id: GUILD_ID, position: 9, rate_limit_per_user: 0, permission_overwrites: [] },
    {
      id: genId(111), type: 0, name: 'mod-log', guild_id: GUILD_ID, position: 10, rate_limit_per_user: 0,
      permission_overwrites: [{ id: GUILD_ID, type: 0, allow: '0', deny: '1024' }],
    },
    { id: genId(112), type: 0, name: 'spam-test', guild_id: GUILD_ID, position: 11, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(113), type: 4, name: 'Voice', guild_id: GUILD_ID, position: 12, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(114), type: 2, name: 'Lounge', guild_id: GUILD_ID, position: 13, rate_limit_per_user: 0, permission_overwrites: [] },
    { id: genId(115), type: 2, name: 'AFK', guild_id: GUILD_ID, position: 14, rate_limit_per_user: 0, permission_overwrites: [] },
  ];
  for (const c of channels) state.channels.set(c.id, c);

  // --- Members ---
  const memberSeed: Array<[string, string, string | null, string[], number, number, number, string | null]> = [
    // id, username, globalName, roleIds, daysAgoJoined, activePoints, caseCount, timeoutOffsetMs(null|future)
    ['100000000000000001', 'quitscope', 'Quit', [ownerRole.id], 400, 2, 1, null],
    [genId(202), 'lena_k', 'Lena', [adminRole.id], 380, 0, 0, null],
    [genId(203), 'peterle99', 'Peter', [modRole.id], 350, 0, 2, null],
    [genId(204), 'mira.schmidt', 'Mira', [modRole.id], 300, 1, 1, null],
    [genId(205), 'tobi_der_bär', 'Tobi', [trustedRole.id], 250, 0, 0, null],
    [genId(206), 'jules98', null, [boosterRole.id, memberRole.id], 220, 3, 2, null],
    [genId(207), 'nina.m', 'Nina', [memberRole.id], 200, 0, 1, null],
    [genId(208), 'kevin_o', null, [memberRole.id], 180, 6, 3, null],
    [genId(209), 'sara_w', 'Sara', [memberRole.id], 150, 0, 1, null],
    [genId(210), 'max_mustermann', 'Max', [memberRole.id], 120, 8, 4, new Date(now + 3600_000).toISOString()],
    [genId(211), 'finn.k', 'Finn', [memberRole.id], 90, 0, 1, null],
    [genId(212), 'annika_b', 'Annika', [trustedRole.id, memberRole.id], 60, 0, 1, null],
    [genId(213), 'domi_2003', null, [memberRole.id], 45, 2, 1, null],
    [genId(214), 'lisa.p', 'Lisa', [memberRole.id], 20, 0, 1, null],
    [genId(215), 'neuling_2026', null, [memberRole.id], 2, 0, 0, null],
  ];
  for (const [id, username, globalName, roleIds, joinedDaysAgo, activePoints, caseCount, timeoutAt] of memberSeed) {
    state.members.set(id, {
      id,
      username,
      globalName,
      avatar: null,
      roleIds,
      joinedAt: daysAgo(joinedDaysAgo),
      activePoints,
      caseCount,
      activeTimeoutUntil: timeoutAt,
    });
  }

  // --- Watchlist ---
  state.watchlist.set(genId(301), { id: genId(301), userId: genId(401), reason: 'Alt-Account eines gebannten Nutzers', createdById: '100000000000000001', createdAt: daysAgo(30) });
  state.watchlist.set(genId(302), { id: genId(302), userId: genId(402), reason: 'Mehrfachaccount, gleiche IP wie #' + genId(210), createdById: genId(203), createdAt: daysAgo(10) });

  // --- Threads ---
  state.threads.set(genId(501), {
    id: genId(501), name: 'Bug: Bot antwortet nicht auf /verstoss', type: 11,
    parent_id: genId(109), owner_id: genId(208), message_count: 12, member_count: 3,
    thread_metadata: { archived: false, locked: false, create_timestamp: daysAgo(2) },
  });
  state.threads.set(genId(502), {
    id: genId(502), name: 'Server-Event Planung Dezember', type: 11,
    parent_id: genId(105), owner_id: '100000000000000001', message_count: 34, member_count: 8,
    thread_metadata: { archived: false, locked: false, create_timestamp: daysAgo(5) },
  });
  state.threads.set(genId(503), {
    id: genId(503), name: 'Meme des Tages 🏆', type: 11,
    parent_id: genId(107), owner_id: genId(206), message_count: 87, member_count: 15,
    thread_metadata: { archived: false, locked: false, create_timestamp: daysAgo(1) },
  });
  state.threads.set(genId(504), {
    id: genId(504), name: 'Ticket: Ban-Einspruch #4821', type: 15,
    parent_id: genId(109), owner_id: genId(210), message_count: 6, member_count: 2,
    thread_metadata: { archived: false, locked: true, create_timestamp: daysAgo(0.5) },
  });

  // --- Custom emojis ---
  state.emojis = [
    { id: genId(601), name: 'pepe_love', animated: false },
    { id: genId(602), name: 'kekw', animated: false },
    { id: genId(603), name: 'pog', animated: false },
    { id: genId(604), name: 'sadge', animated: false },
    { id: genId(605), name: 'party_parrot', animated: true },
  ];

  return state;
}

const globalForDiscord = globalThis as unknown as { __mockDiscordStore?: DiscordStoreState };
const state: DiscordStoreState =
  globalForDiscord.__mockDiscordStore ?? (globalForDiscord.__mockDiscordStore = createInitialState());

// --- Channels ---
export function listChannels(): GuildChannel[] {
  return Array.from(state.channels.values()).sort((a, b) => a.position - b.position);
}
export function getChannelById(id: string): GuildChannel | undefined {
  return state.channels.get(id);
}
export function updateChannel(id: string, patch: Partial<GuildChannel>): GuildChannel | null {
  const existing = state.channels.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, id: existing.id };
  state.channels.set(id, updated);
  return updated;
}

// --- Roles ---
export function listRoles(): GuildRole[] {
  return Array.from(state.roles.values()).sort((a, b) => b.position - a.position);
}
export function getRoleById(id: string): GuildRole | undefined {
  return state.roles.get(id);
}

// --- Members ---
export function listMembers(): GuildMemberRecord[] {
  return Array.from(state.members.values());
}
export function getMemberById(id: string): GuildMemberRecord | undefined {
  return state.members.get(id);
}
export function deleteMember(id: string): boolean {
  return state.members.delete(id);
}
export function setMemberTimeout(id: string, until: string | null): GuildMemberRecord | null {
  const existing = state.members.get(id);
  if (!existing) return null;
  const updated = { ...existing, activeTimeoutUntil: until };
  state.members.set(id, updated);
  return updated;
}
export function membersWithRole(roleId: string): GuildMemberRecord[] {
  return listMembers().filter((m) => m.roleIds.includes(roleId));
}
export function addRoleToMember(memberId: string, roleId: string): GuildMemberRecord | null {
  const existing = state.members.get(memberId);
  if (!existing) return null;
  if (existing.roleIds.includes(roleId)) return existing;
  const updated = { ...existing, roleIds: [...existing.roleIds, roleId] };
  state.members.set(memberId, updated);
  return updated;
}
export function removeRoleFromMember(memberId: string, roleId: string): GuildMemberRecord | null {
  const existing = state.members.get(memberId);
  if (!existing) return null;
  const updated = { ...existing, roleIds: existing.roleIds.filter((r) => r !== roleId) };
  state.members.set(memberId, updated);
  return updated;
}

// --- Watchlist ---
export function listWatchlist(): WatchlistEntry[] {
  return Array.from(state.watchlist.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function addWatchlistEntry(entry: WatchlistEntry): void {
  state.watchlist.set(entry.id, entry);
}
export function deleteWatchlistEntry(id: string): boolean {
  return state.watchlist.delete(id);
}

// --- Threads ---
export function listThreads(): GuildThread[] {
  return Array.from(state.threads.values()).filter((t) => !t.thread_metadata.archived);
}
export function getThreadById(id: string): GuildThread | undefined {
  return state.threads.get(id);
}
export function archiveThread(id: string): GuildThread | null {
  const existing = state.threads.get(id);
  if (!existing) return null;
  const updated = { ...existing, thread_metadata: { ...existing.thread_metadata, archived: true } };
  state.threads.set(id, updated);
  return updated;
}
export function deleteThread(id: string): boolean {
  return state.threads.delete(id);
}

// --- Emojis ---
export function listEmojis(): DiscordEmoji[] {
  return state.emojis;
}

// --- Derived helpers ---
// Raw Discord REST shape (snake_case) — used by endpoints that mirror
// Discord's own API wire format, e.g. role member lists.
export function toGuildMemberUser(m: GuildMemberRecord): GuildMemberUser {
  return { id: m.id, username: m.username, global_name: m.globalName, avatar: m.avatar };
}

// This app's own camelCase profile shape — used by endpoints/components that
// consume `DiscordUser`-style objects (src/lib/discord.ts).
export function toProfile(m: GuildMemberRecord): { id: string; username: string; globalName: string | null; avatar: string | null } {
  return { id: m.id, username: m.username, globalName: m.globalName, avatar: m.avatar };
}
