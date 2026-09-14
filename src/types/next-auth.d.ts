import type { ResolvedPermissions } from '@/lib/permissions';

declare module 'next-auth' {
  interface Session {
    userId?: string;
    discordId?: string;
    discordRoleIds?: string[];
    isGuildAdmin?: boolean;
    permissions?: ResolvedPermissions;
  }
}
