export type CaseType =
  | 'warning' | 'points' | 'instant_ban' | 'rejoin_ban' | 'role_ban'
  | 'welcome_greeting' | 'rule_verification' | 'watchlist_ban' | 'timeout'
  | 'manual_ban' | 'mass_message_delete';

export type CaseStatus = 'draft' | 'pending' | 'final' | 'revoked' | 'expired' | 'dry_run';

export type EventType = 'join' | 'leave';

export interface Case {
  id: string;
  userId: string;
  type: CaseType;
  points: number;
  reasonKey: string | null;
  reasonText: string;
  evidence: string[];
  status: CaseStatus;
  createdById: string;
  createdAt: string;
  violationId: string | null;
  wasEscalated: boolean;
  appliedActions: unknown;
  expiresAt: string | null;
  triggerRoleId: string | null;
}

export interface User {
  id: string;
  currentPoints: number;
  lastViolationAt: string | null;
  createdAt: string;
  activePoints: number;
  cases: Case[];
}

export interface Violation {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string[];
  basePoints: number;
  isInstantBan: boolean;
  escalateAfter: number;
  escalatePoints: number;
  autoTimeout: string | null;
  autoTempban: string | null;
  requireEvidence: boolean;
  ticketTemplate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JoinLeaveEvent {
  id: string;
  userId: string;
  event: EventType;
  timestamp: string;
}

export interface AppConfig {
  pointsThreshold: number;
  decayDays: number;
  rejoinLimit: number;
  rejoinWindowDays: number;
  rejoinTempbanDays: number;
  allowedRoleIds: string[];
}

export interface PermissionGroup {
  id: string;
  name: string;
  color: string | null;
  permissions: unknown;
}

export interface EmbedTemplate {
  id: number;
  type: string;
  enabled: boolean;
  title: string | null;
  description: string | null;
  color: string | null;
  authorName: string | null;
  authorIcon: string | null;
  footerText: string | null;
  footerIcon: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  timestamp: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
