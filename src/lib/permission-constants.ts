export type AreaKey = 'moderation' | 'statistics' | 'features' | 'server' | 'config' | 'admin';

export type PageKey =
  | 'cases' | 'users' | 'members' | 'watchlist' | 'automod'
  | 'analytics' | 'moderators' | 'leaderboard'
  | 'confessions' | 'birthdays' | 'reaction-roles' | 'embeds' | 'welcome-card' | 'counting-fail-tiers' | 'wortkette-dictionary' | 'wortkette-special-lines' | 'wortkette-admin' | 'tempvoice' | 'points'
  | 'channels' | 'roles' | 'threads' | 'webhooks'
  | 'config' | 'templates' | 'violations' | 'audit'
  | 'admin-status' | 'admin-config' | 'admin-logging';

export interface PermissionsPayload {
  areas: Record<AreaKey, { read: boolean; write: boolean }>;
  overrides: Partial<Record<PageKey, { read: boolean; write: boolean }>>;
}

export interface ResolvedPermissions {
  areas: Record<AreaKey, { read: boolean; write: boolean }>;
  pages: Record<PageKey, { read: boolean; write: boolean }>;
}

export const PAGE_TO_AREA: Record<PageKey, AreaKey> = {
  cases: 'moderation', users: 'moderation', members: 'moderation', watchlist: 'moderation', automod: 'moderation',
  analytics: 'statistics', moderators: 'statistics', leaderboard: 'statistics',
  confessions: 'features', birthdays: 'features', 'reaction-roles': 'features', embeds: 'features', 'welcome-card': 'features', 'counting-fail-tiers': 'features', 'wortkette-dictionary': 'features', 'wortkette-special-lines': 'features', 'wortkette-admin': 'features', tempvoice: 'features', points: 'features',
  channels: 'server', roles: 'server', threads: 'server', webhooks: 'server',
  config: 'config', templates: 'config', violations: 'config', audit: 'config',
  'admin-status': 'admin', 'admin-config': 'admin', 'admin-logging': 'admin',
};

export const AREA_LABELS: Record<AreaKey, string> = {
  moderation: 'Moderation',
  statistics: 'Statistiken',
  features: 'Features',
  server: 'Server',
  config: 'Konfiguration',
  admin: 'Admin',
};

export const PAGE_LABELS: Record<PageKey, string> = {
  cases: 'Cases', users: 'Nutzer', members: 'Mitglieder', watchlist: 'Watchlist', automod: 'AutoMod',
  analytics: 'Analytics', moderators: 'Moderatoren', leaderboard: 'Leaderboard',
  confessions: 'Geständnisse', birthdays: 'Geburtstage', 'reaction-roles': 'Reaction Roles', embeds: 'Embeds', 'welcome-card': 'Welcome Card', 'counting-fail-tiers': 'Counting Fail-Stufen', 'wortkette-dictionary': 'Wortkette-Wörterbuch', 'wortkette-special-lines': 'Wortkette-Sprüche', 'wortkette-admin': 'Wortkette-Admin', tempvoice: 'TempVoice', points: 'Punkte-System',
  channels: 'Kanäle', roles: 'Rollen', threads: 'Threads', webhooks: 'Webhooks',
  config: 'Konfiguration', templates: 'Vorlagen', violations: 'Verstöße', audit: 'Audit',
  'admin-status': 'Status', 'admin-config': 'Admin Config', 'admin-logging': 'Logging',
};

const noAccess = { read: false, write: false };

export function emptyPermissions(): ResolvedPermissions {
  return {
    areas: {
      moderation: { ...noAccess }, statistics: { ...noAccess },
      features: { ...noAccess }, server: { ...noAccess },
      config: { ...noAccess }, admin: { ...noAccess },
    },
    pages: Object.fromEntries(
      (Object.keys(PAGE_TO_AREA) as PageKey[]).map((p) => [p, { ...noAccess }])
    ) as Record<PageKey, { read: boolean; write: boolean }>,
  };
}

export function defaultPermissionsPayload(): PermissionsPayload {
  return {
    areas: {
      moderation: { ...noAccess }, statistics: { ...noAccess },
      features: { ...noAccess }, server: { ...noAccess },
      config: { ...noAccess }, admin: { ...noAccess },
    },
    overrides: {},
  };
}
