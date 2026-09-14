import {
  listCases, getCaseById,
  getStoreUser,
  listViolations,
  listJoinLeaveEvents,
  listTemplates, getTemplateByType,
  getStoreConfig,
  paginate,
} from './mock-store';
import type { Case, User, Violation, JoinLeaveEvent, AppConfig, EmbedTemplate, Paginated } from './types';

export type { Case, User, Violation, JoinLeaveEvent, AppConfig, EmbedTemplate, Paginated };

export async function getCases(userId?: string): Promise<Case[]> {
  return listCases(userId ? { userId } : undefined);
}

export async function getCasesPaged(
  opts: { userId?: string; page?: number; hideDryRun?: boolean },
): Promise<Paginated<Case>> {
  let items = listCases(opts.userId ? { userId: opts.userId } : undefined);
  if (opts.hideDryRun) items = items.filter((c) => c.status !== 'dry_run');
  return paginate(items, opts.page ?? 1);
}

export async function getCase(id: string): Promise<Case | null> {
  return getCaseById(id) ?? null;
}

export async function getUser(id: string): Promise<User | null> {
  const user = getStoreUser(id);
  if (!user) return null;
  const userCases = listCases({ userId: id });
  const now = Date.now();
  const activePoints = userCases
    .filter((c) => c.status === 'final' && (!c.expiresAt || new Date(c.expiresAt).getTime() > now))
    .reduce((sum, c) => sum + c.points, 0);
  return { ...user, activePoints, cases: userCases };
}

export async function getConfig(): Promise<AppConfig> {
  return getStoreConfig();
}

export async function getAuditCases(page = 1): Promise<Paginated<Case>> {
  return paginate(listCases(), page);
}

export async function getAuditEvents(page = 1): Promise<Paginated<JoinLeaveEvent>> {
  return paginate(listJoinLeaveEvents(), page);
}

export async function getViolations(): Promise<Violation[]> {
  return listViolations();
}

export async function getTemplates(): Promise<EmbedTemplate[]> {
  return listTemplates();
}

export async function getTemplate(type: string): Promise<EmbedTemplate | null> {
  return getTemplateByType(type) ?? null;
}

// Client-side mutations go through Next.js API routes (which have access to session)
export async function createViolation(input: CreateViolationInput): Promise<Violation> {
  const res = await fetch('/api/violations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'Failed to create violation');
  }

  return res.json();
}

export async function updateViolation(key: string, input: UpdateViolationInput): Promise<Violation> {
  const res = await fetch(`/api/violations/${key}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'Failed to update violation');
  }

  return res.json();
}

export async function deleteViolation(key: string): Promise<Violation> {
  const res = await fetch(`/api/violations/${key}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'Failed to delete violation');
  }

  return res.json();
}

export async function createTemplate(input: CreateTemplateInput): Promise<EmbedTemplate> {
  const res = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'Failed to create template');
  }

  return res.json();
}

export async function updateTemplate(type: string, input: UpdateTemplateInput): Promise<EmbedTemplate> {
  const res = await fetch(`/api/templates/${type}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'Failed to update template');
  }

  return res.json();
}

export async function deleteTemplate(type: string): Promise<EmbedTemplate> {
  const res = await fetch(`/api/templates/${type}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'Failed to delete template');
  }

  return res.json();
}

// Input types for API mutations (not in Prisma schema)
export interface CreateViolationInput {
  key: string;
  name: string;
  description?: string;
  category: string[];
  basePoints: number;
  isInstantBan?: boolean;
  escalateAfter?: number;
  escalatePoints?: number;
  autoTimeout?: string;
  autoTempban?: string;
  requireEvidence?: boolean;
  ticketTemplate?: string;
}

export interface UpdateViolationInput {
  name?: string;
  description?: string;
  category?: string[];
  basePoints?: number;
  isInstantBan?: boolean;
  escalateAfter?: number;
  escalatePoints?: number;
  autoTimeout?: string;
  autoTempban?: string;
  requireEvidence?: boolean;
  ticketTemplate?: string;
}

export interface CreateTemplateInput {
  type: string;
  enabled?: boolean;
  title?: string | null;
  description?: string | null;
  color?: string | null;
  authorName?: string | null;
  authorIcon?: string | null;
  footerText?: string | null;
  footerIcon?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  timestamp?: boolean;
}

export interface UpdateTemplateInput {
  enabled?: boolean;
  title?: string | null;
  description?: string | null;
  color?: string | null;
  authorName?: string | null;
  authorIcon?: string | null;
  footerText?: string | null;
  footerIcon?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  timestamp?: boolean;
}
