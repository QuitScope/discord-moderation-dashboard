import type { Case, Violation, JoinLeaveEvent, AppConfig, EmbedTemplate, Paginated } from './types';

export function genMockId(): string {
  return crypto.randomUUID();
}

export function paginate<T>(items: T[], page: number, pageSize = 25): Paginated<T> {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(Math.max(1, page), pages);
  const start = (clamped - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total, page: clamped, pages };
}

interface StoreUser {
  id: string;
  currentPoints: number;
  lastViolationAt: string | null;
  createdAt: string;
}

interface MockStoreState {
  cases: Map<string, Case>;
  violations: Map<string, Violation>;
  joinLeaveEvents: Map<string, JoinLeaveEvent>;
  templates: Map<string, EmbedTemplate>;
  users: Map<string, StoreUser>;
  config: AppConfig;
}

export const DEMO_USER_ID = '100000000000000001';

function createInitialState(): MockStoreState {
  const initial: MockStoreState = {
    cases: new Map(),
    violations: new Map(),
    joinLeaveEvents: new Map(),
    templates: new Map(),
    users: new Map(),
    config: {
      pointsThreshold: 10,
      decayDays: 30,
      rejoinLimit: 3,
      rejoinWindowDays: 7,
      rejoinTempbanDays: 7,
      allowedRoleIds: [],
    },
  };
  seed(initial);
  return initial;
}

// Next.js bundles each route handler and page into its own server-side chunk;
// a plain module-level singleton gets a separate copy baked into every chunk
// instead of one instance shared per process. Attaching the state to
// globalThis is the standard workaround (the same pattern Prisma Client's
// Next.js docs recommend) so every chunk reads and writes the same object.
const globalForStore = globalThis as unknown as { __mockStore?: MockStoreState };
const state: MockStoreState = globalForStore.__mockStore ?? (globalForStore.__mockStore = createInitialState());

// --- Cases ---
export function listCases(filter?: { userId?: string }): Case[] {
  let all = Array.from(state.cases.values());
  if (filter?.userId) all = all.filter((c) => c.userId === filter.userId);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function getCaseById(id: string): Case | undefined {
  return state.cases.get(id);
}
export function addCase(c: Case): void {
  state.cases.set(c.id, c);
}

// --- Users ---
export function listStoreUsers(): StoreUser[] {
  return Array.from(state.users.values());
}
export function getStoreUser(id: string): StoreUser | undefined {
  return state.users.get(id);
}
export function upsertStoreUser(u: StoreUser): void {
  state.users.set(u.id, u);
}

// --- Violations ---
export function listViolations(): Violation[] {
  return Array.from(state.violations.values()).sort((a, b) => a.name.localeCompare(b.name));
}
export function getViolationByKey(key: string): Violation | undefined {
  return Array.from(state.violations.values()).find((v) => v.key === key);
}
export function addViolation(v: Violation): void {
  state.violations.set(v.id, v);
}
export function updateViolationByKey(key: string, patch: Partial<Violation>): Violation | null {
  const existing = getViolationByKey(key);
  if (!existing) return null;
  const updated: Violation = { ...existing, ...patch, key: existing.key, updatedAt: new Date().toISOString() };
  state.violations.set(existing.id, updated);
  return updated;
}
export function deleteViolationByKey(key: string): Violation | null {
  const existing = getViolationByKey(key);
  if (!existing) return null;
  state.violations.delete(existing.id);
  return existing;
}

// --- Join/leave events ---
export function listJoinLeaveEvents(): JoinLeaveEvent[] {
  return Array.from(state.joinLeaveEvents.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
export function addJoinLeaveEvent(e: JoinLeaveEvent): void {
  state.joinLeaveEvents.set(e.id, e);
}

// --- Templates ---
export function listTemplates(): EmbedTemplate[] {
  return Array.from(state.templates.values()).sort((a, b) => a.type.localeCompare(b.type));
}
export function getTemplateByType(type: string): EmbedTemplate | undefined {
  return state.templates.get(type);
}
export function addTemplate(t: EmbedTemplate): void {
  state.templates.set(t.type, t);
}
export function updateTemplateByType(type: string, patch: Partial<EmbedTemplate>): EmbedTemplate | null {
  const existing = state.templates.get(type);
  if (!existing) return null;
  const updated: EmbedTemplate = { ...existing, ...patch, type: existing.type, updatedAt: new Date().toISOString() };
  state.templates.set(type, updated);
  return updated;
}
export function deleteTemplateByType(type: string): EmbedTemplate | null {
  const existing = state.templates.get(type);
  if (!existing) return null;
  state.templates.delete(type);
  return existing;
}

// --- Config ---
export function getStoreConfig(): AppConfig {
  return state.config;
}

// --- Seed ---
function seed(target: MockStoreState) {
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const daysAgo = (d: number) => new Date(nowMs - d * 86400000).toISOString();
  const hoursAgo = (h: number) => new Date(nowMs - h * 3600000).toISOString();
  const hoursFromNow = (h: number) => new Date(nowMs + h * 3600000).toISOString();

  target.users.set(DEMO_USER_ID, {
    id: DEMO_USER_ID,
    currentPoints: 2,
    lastViolationAt: now,
    createdAt: now,
  });

  const caseId = genMockId();
  target.cases.set(caseId, {
    id: caseId,
    userId: DEMO_USER_ID,
    type: 'warning',
    points: 1,
    reasonKey: 'spam',
    reasonText: 'Spam in #general',
    evidence: [],
    status: 'final',
    createdById: 'demo-admin',
    createdAt: now,
    violationId: null,
    wasEscalated: false,
    appliedActions: null,
    expiresAt: null,
    triggerRoleId: null,
  });

  // --- Violation catalog (spam is the original seed; these add coverage for
  // the auto-ban case types below, matching real /verstoss entries an
  // instant-ban or escalation would reference) ---
  const violationId = genMockId();
  target.violations.set(violationId, {
    id: violationId,
    key: 'spam',
    name: 'Spam',
    description: 'Wiederholtes Posten irrelevanter Nachrichten',
    category: ['chat'],
    basePoints: 1,
    isInstantBan: false,
    escalateAfter: 2,
    escalatePoints: 1,
    autoTimeout: null,
    autoTempban: null,
    requireEvidence: false,
    ticketTemplate: null,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const extraViolations: Array<[string, string, string, boolean, number]> = [
    ['nsfw', 'NSFW-Inhalt außerhalb des NSFW-Bereichs', 'nsfw', true, 0],
    ['raid', 'Serverraid / koordinierter Angriff', 'sicherheit', true, 0],
    ['toxicity', 'Beleidigung / toxisches Verhalten', 'verhalten', false, 2],
  ];
  for (const [key, description, category, isInstantBan, basePoints] of extraViolations) {
    const id = genMockId();
    target.violations.set(id, {
      id,
      key,
      name: key === 'nsfw' ? 'NSFW' : key === 'raid' ? 'Raid' : 'Toxizität',
      description,
      category: [category],
      basePoints,
      isInstantBan,
      escalateAfter: 2,
      escalatePoints: 1,
      autoTimeout: null,
      autoTempban: null,
      requireEvidence: isInstantBan,
      ticketTemplate: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // --- Additional cases: every CaseType and CaseStatus at least once,
  // spread across several seeded members (src/lib/mock-discord.ts), so the
  // Cases/Audit/User-detail pages show real variety instead of one record.
  // Member ids below are src/lib/mock-discord.ts's genId(202..215) — kept as
  // literals here rather than importing that module, so this file's seed
  // stays self-contained and independent of the other mock store.
  const PETERLE = '1000000000000000203';
  const MIRA = '1000000000000000204';
  const JULES = '1000000000000000206';
  const NINA = '1000000000000000207';
  const KEVIN = '1000000000000000208';
  const SARA = '1000000000000000209';
  const MAX = '1000000000000000210';
  const FINN = '1000000000000000211';
  const ANNIKA = '1000000000000000212';
  const DOMI = '1000000000000000213';
  const LISA = '1000000000000000214';

  interface CaseSeed {
    userId: string;
    type: Case['type'];
    status: Case['status'];
    points: number;
    reasonKey: string | null;
    reasonText: string;
    createdAt: string;
    wasEscalated?: boolean;
    appliedActions?: unknown;
    expiresAt?: string | null;
  }

  const caseSeeds: CaseSeed[] = [
    { userId: PETERLE, type: 'warning', status: 'final', points: 1, reasonKey: 'spam', reasonText: 'Werbung für Fremdserver in #allgemein', createdAt: daysAgo(12) },
    { userId: PETERLE, type: 'timeout', status: 'final', points: 0, reasonKey: 'toxicity', reasonText: 'Beleidigung eines anderen Mitglieds', createdAt: daysAgo(3), appliedActions: { timeout: { duration: '1h', applied: true } } },

    { userId: MIRA, type: 'warning', status: 'revoked', points: 1, reasonKey: 'spam', reasonText: 'Falschmeldung — nach Prüfung zurückgenommen', createdAt: daysAgo(20) },

    { userId: JULES, type: 'points', status: 'final', points: 2, reasonKey: 'nsfw', reasonText: 'NSFW-Bild in #memes gepostet', createdAt: daysAgo(8) },
    { userId: JULES, type: 'warning', status: 'dry_run', points: 1, reasonKey: 'spam', reasonText: 'AutoMod-Testlauf (Dry-Run) — Spam-Erkennung', createdAt: hoursAgo(6) },

    // Automatic ban: an isInstantBan violation fires and the bot bans immediately, no manual review.
    { userId: KEVIN, type: 'instant_ban', status: 'final', points: 0, reasonKey: 'raid', reasonText: 'Massenerwähnung + Einladungslinks kurz nach Beitritt — automatisch als Raid erkannt', createdAt: daysAgo(15) },
    { userId: KEVIN, type: 'timeout', status: 'final', points: 1, reasonKey: 'spam', reasonText: 'Wiederholtes Posten desselben Links', createdAt: daysAgo(5), appliedActions: { timeout: { duration: '10m', applied: true } } },
    { userId: KEVIN, type: 'warning', status: 'expired', points: 1, reasonKey: 'toxicity', reasonText: 'Beleidigung im Voice-Textchat', createdAt: daysAgo(45), expiresAt: daysAgo(15) },

    // Automatic ban: bot enforces the server's rejoin-protection limit (see AppConfig.rejoinLimit).
    { userId: SARA, type: 'rejoin_ban', status: 'final', points: 0, reasonKey: null, reasonText: `Beitrittslimit überschritten (${3}x innerhalb von 7 Tagen) — automatischer Tempban`, createdAt: daysAgo(9) },

    { userId: MAX, type: 'timeout', status: 'final', points: 1, reasonKey: 'toxicity', reasonText: 'Beleidigung in #allgemein', createdAt: hoursAgo(2), appliedActions: { timeout: { duration: '1h', applied: true } } },
    { userId: MAX, type: 'warning', status: 'final', points: 1, reasonKey: 'spam', reasonText: 'Werbung im DM-Bereich gemeldet', createdAt: daysAgo(6) },
    { userId: MAX, type: 'points', status: 'final', points: 2, reasonKey: 'toxicity', reasonText: 'Wiederholte Beleidigungen — eskaliert nach 2. Verstoß', createdAt: daysAgo(2), wasEscalated: true },
    { userId: MAX, type: 'manual_ban', status: 'pending', points: 0, reasonKey: null, reasonText: 'Bann-Antrag wartet auf zweite Bestätigung (Vier-Augen-Prinzip)', createdAt: hoursAgo(1) },

    { userId: FINN, type: 'mass_message_delete', status: 'final', points: 0, reasonKey: null, reasonText: 'Massenlöschung: 47 Nachrichten nach Spam-Welle entfernt', createdAt: daysAgo(1) },

    // Automatic ban: the bot matched the user against a Watchlist entry on join (see mock-discord.ts watchlist).
    { userId: DOMI, type: 'watchlist_ban', status: 'final', points: 0, reasonKey: null, reasonText: 'Beim Beitritt gegen Watchlist-Eintrag abgeglichen — automatisch gebannt', createdAt: daysAgo(10) },

    { userId: NINA, type: 'welcome_greeting', status: 'final', points: 0, reasonKey: null, reasonText: 'Willkommensnachricht gesendet', createdAt: daysAgo(200) },
    { userId: LISA, type: 'rule_verification', status: 'final', points: 0, reasonKey: null, reasonText: 'Regeln bestätigt', createdAt: daysAgo(20) },
    { userId: ANNIKA, type: 'role_ban', status: 'draft', points: 0, reasonKey: null, reasonText: 'Entwurf: Ban-Rolle manuell vergeben, noch nicht abgeschickt', createdAt: hoursAgo(1) },
  ];

  for (const c of caseSeeds) {
    const id = genMockId();
    target.cases.set(id, {
      id,
      userId: c.userId,
      type: c.type,
      points: c.points,
      reasonKey: c.reasonKey,
      reasonText: c.reasonText,
      evidence: [],
      status: c.status,
      createdById: 'demo-admin',
      createdAt: c.createdAt,
      violationId: null,
      wasEscalated: c.wasEscalated ?? false,
      appliedActions: c.appliedActions ?? null,
      expiresAt: c.expiresAt ?? null,
      triggerRoleId: null,
    });
  }

  // `getUser()` (src/lib/api.ts) looks users up by this store's `users` map,
  // not src/lib/mock-discord.ts's member list — every user id referenced
  // above needs an entry here too, or /dashboard/users/[id] 404s for them.
  // currentPoints/lastViolationAt are derived from the case seeds so a
  // visitor can't spot a mismatch between the two.
  const byUser = new Map<string, { totalPoints: number; lastAt: string }>();
  for (const c of caseSeeds) {
    const prev = byUser.get(c.userId);
    const total = (prev?.totalPoints ?? 0) + c.points;
    const lastAt = !prev || c.createdAt > prev.lastAt ? c.createdAt : prev.lastAt;
    byUser.set(c.userId, { totalPoints: total, lastAt });
  }
  for (const [userId, { totalPoints, lastAt }] of byUser) {
    target.users.set(userId, {
      id: userId,
      currentPoints: totalPoints,
      lastViolationAt: lastAt,
      createdAt: daysAgo(180),
    });
  }

  const eventId = genMockId();
  target.joinLeaveEvents.set(eventId, {
    id: eventId,
    userId: DEMO_USER_ID,
    event: 'join',
    timestamp: now,
  });
  target.joinLeaveEvents.set(genMockId(), { id: genMockId(), userId: DOMI, event: 'join', timestamp: daysAgo(10) });
  target.joinLeaveEvents.set(genMockId(), { id: genMockId(), userId: SARA, event: 'join', timestamp: daysAgo(9) });
  target.joinLeaveEvents.set(genMockId(), { id: genMockId(), userId: KEVIN, event: 'leave', timestamp: daysAgo(4) });
  target.joinLeaveEvents.set(genMockId(), { id: genMockId(), userId: LISA, event: 'join', timestamp: daysAgo(20) });

  target.templates.set('ban', {
    id: 1,
    type: 'ban',
    enabled: true,
    title: 'Du wurdest gebannt',
    description: 'Grund: {reason}',
    color: '#f87171',
    authorName: null,
    authorIcon: null,
    footerText: null,
    footerIcon: null,
    imageUrl: null,
    thumbnailUrl: null,
    timestamp: true,
    createdAt: now,
    updatedAt: now,
  });
}
