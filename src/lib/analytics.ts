import type { Case } from './api';

// ─── Types ─────────────────────────────────────────────────────────────────

export type DateRange = '7d' | '30d' | '90d' | 'custom';
export type ThreatLevel = 'niedrig' | 'mittel' | 'hoch' | 'kritisch';

export interface TimeSeriesPoint {
  date: string;   // YYYY-MM-DD
  total: number;
  warnings: number;
  bans: number;
  points: number;
}

export interface TypeBreakdown {
  warning: number;
  points: number;
  instant_ban: number;
  rejoin_ban: number;
}

export interface UserStat {
  userId: string;
  totalPoints: number;
  caseCount: number;
  banCount: number;
  threatLevel: ThreatLevel;
  lastCaseAt: string;
}

export interface ModStat {
  modId: string;
  total: number;
  warnings: number;
  bans: number;
  pointsCases: number;
  lastActionAt: string;
}

export interface UserInfo {
  name: string;
  avatarUrl: string;
}

// Chart color constants — hex required by recharts (CSS vars not supported)
export const CHART_COLORS = {
  indigo:  '#6366F1',
  yellow:  '#FBBF24',
  red:     '#F87171',
  blue:    '#60A5FA',
  emerald: '#34D399',
  purple:  '#A78BFA',
  grid:    'rgba(255,255,255,0.05)',
  axis:    '#4D5E7A',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function computeThreatLevel(points: number, type: string): ThreatLevel {
  if (type === 'instant_ban' || type === 'rejoin_ban') return 'kritisch';
  if (points >= 7) return 'kritisch';
  if (points >= 4) return 'hoch';
  if (points >= 2) return 'mittel';
  return 'niedrig';
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Filtering ──────────────────────────────────────────────────────────────

export function filterByRange(
  cases: Case[],
  range: DateRange,
  customFrom?: Date,
  customTo?: Date,
): Case[] {
  const now = new Date();
  let from: Date;
  let to: Date = now;

  if (range === 'custom' && customFrom && customTo) {
    from = customFrom;
    to = customTo;
  } else {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    from = new Date(now);
    from.setDate(from.getDate() - days);
  }

  return cases.filter((c) => {
    const t = new Date(c.createdAt).getTime();
    return t >= from.getTime() && t <= to.getTime();
  });
}

// ─── Aggregations ───────────────────────────────────────────────────────────

export function groupByDate(cases: Case[]): TimeSeriesPoint[] {
  const map = new Map<string, TimeSeriesPoint>();

  for (const c of cases) {
    const date = toDateStr(new Date(c.createdAt));
    const existing = map.get(date) ?? { date, total: 0, warnings: 0, bans: 0, points: 0 };
    existing.total += 1;
    if (c.type === 'warning') existing.warnings += 1;
    else if (c.type === 'instant_ban' || c.type === 'rejoin_ban') existing.bans += 1;
    else if (c.type === 'points') existing.points += 1;
    map.set(date, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function groupByType(cases: Case[]): TypeBreakdown {
  return cases.reduce<TypeBreakdown>(
    (acc, c) => {
      if (c.type === 'warning')     acc.warning += 1;
      else if (c.type === 'points') acc.points += 1;
      else if (c.type === 'instant_ban') acc.instant_ban += 1;
      else if (c.type === 'rejoin_ban')  acc.rejoin_ban += 1;
      return acc;
    },
    { warning: 0, points: 0, instant_ban: 0, rejoin_ban: 0 },
  );
}

export function groupByUser(cases: Case[]): UserStat[] {
  const map = new Map<string, UserStat>();

  for (const c of cases) {
    const existing = map.get(c.userId) ?? {
      userId: c.userId,
      totalPoints: 0,
      caseCount: 0,
      banCount: 0,
      threatLevel: 'niedrig' as ThreatLevel,
      lastCaseAt: c.createdAt,
    };
    existing.caseCount += 1;
    existing.totalPoints += c.points;
    if (c.type === 'instant_ban' || c.type === 'rejoin_ban') existing.banCount += 1;
    if (new Date(c.createdAt) > new Date(existing.lastCaseAt)) {
      existing.lastCaseAt = c.createdAt;
    }
    existing.threatLevel = computeThreatLevel(existing.totalPoints, c.type);
    map.set(c.userId, existing);
  }

  return Array.from(map.values());
}

export function groupByModerator(cases: Case[]): ModStat[] {
  const map = new Map<string, ModStat>();

  for (const c of cases) {
    const modId = (c as any).createdById as string;
    if (!modId) continue;

    const existing = map.get(modId) ?? {
      modId,
      total: 0,
      warnings: 0,
      bans: 0,
      pointsCases: 0,
      lastActionAt: c.createdAt,
    };
    existing.total += 1;
    if (c.type === 'warning') existing.warnings += 1;
    else if (c.type === 'instant_ban' || c.type === 'rejoin_ban') existing.bans += 1;
    else if (c.type === 'points') existing.pointsCases += 1;
    if (new Date(c.createdAt) > new Date(existing.lastActionAt)) {
      existing.lastActionAt = c.createdAt;
    }
    map.set(modId, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

// KPI summary from a filtered case array
export interface KpiSummary {
  total: number;
  bans: number;
  warnings: number;
  avgPointsPerUser: number;
}

export function computeKpis(cases: Case[]): KpiSummary {
  const bans = cases.filter((c) => c.type === 'instant_ban' || c.type === 'rejoin_ban').length;
  const warnings = cases.filter((c) => c.type === 'warning').length;
  const userPoints = groupByUser(cases);
  const avgPointsPerUser =
    userPoints.length > 0
      ? Math.round(userPoints.reduce((s, u) => s + u.totalPoints, 0) / userPoints.length)
      : 0;
  return { total: cases.length, bans, warnings, avgPointsPerUser };
}
