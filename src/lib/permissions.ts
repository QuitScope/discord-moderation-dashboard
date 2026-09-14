import type { Session } from 'next-auth';
import type { PermissionGroup } from './types';
import {
  type AreaKey, type PageKey, type PermissionsPayload, type ResolvedPermissions,
  PAGE_TO_AREA, emptyPermissions,
} from './permission-constants';

export type { AreaKey, PageKey, ResolvedPermissions };

// Semantic alias: Session with RBAC fields populated (after auth.ts Task 4 lands)
export interface DashboardSession extends Session {
  userId?: string;
  discordId?: string;
  discordRoleIds?: string[];
  isGuildAdmin?: boolean;
  permissions?: ResolvedPermissions;
}

export function resolvePermissions(groups: PermissionGroup[]): ResolvedPermissions {
  const result = emptyPermissions();

  for (const group of groups) {
    const p = group.permissions as unknown as PermissionsPayload;
    if (!p || typeof p !== 'object' || !('areas' in p)) continue;

    for (const [page, area] of Object.entries(PAGE_TO_AREA) as [PageKey, AreaKey][]) {
      const override = (p.overrides ?? {})[page];
      const source = override ?? p.areas[area];
      if (source) {
        result.pages[page].read  ||= source.read;
        result.pages[page].write ||= source.write;
      }
    }

    for (const [area, rights] of Object.entries(p.areas) as [AreaKey, { read: boolean; write: boolean }][]) {
      result.areas[area].read  ||= rights.read;
      result.areas[area].write ||= rights.write;
    }
  }

  return result;
}

export function hasPermission(
  session: Session | null,
  check: { page?: PageKey; area?: AreaKey; action: 'read' | 'write' },
): boolean {
  if (!session) return false;
  const s = session as DashboardSession;
  if (s.isGuildAdmin) return true;
  if (!s.permissions) return false;

  if (check.page) return s.permissions.pages[check.page]?.[check.action] ?? false;
  if (check.area) return s.permissions.areas[check.area]?.[check.action] ?? false;
  return false;
}

export const canRead  = (s: Session | null, page: PageKey) => hasPermission(s, { page, action: 'read' });
export const canWrite = (s: Session | null, page: PageKey) => hasPermission(s, { page, action: 'write' });

export function hasAnyAccess(session: Session | null): boolean {
  if (!session) return false;
  const s = session as DashboardSession;
  if (s.isGuildAdmin) return true;
  if (!s.permissions) return false;
  return Object.values(s.permissions.pages).some((p) => p.read);
}
