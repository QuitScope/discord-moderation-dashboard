// Discord API utilities for fetching user information

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  globalName: string | null;
  avatar: string | null;
}

// This demo has no real backend to resolve Discord user profiles from — a
// real fetch here would either hit a dead API (dev) or throw on a missing
// API_URL (production), so callers already treat a missing entry as "no
// profile data available" and fall back to showing the raw id. Returning an
// empty map immediately avoids a guaranteed-to-fail network attempt (and the
// log noise it produces) on every render. See Plan 2 for real mock profile
// data.
export async function fetchMultipleDiscordUsers(_userIds: string[]): Promise<Map<string, DiscordUser>> {
  return new Map();
}

/**
 * Fetch a single Discord user (uses the bulk fetch internally)
 */
export async function fetchDiscordUser(userId: string): Promise<DiscordUser | null> {
  const result = await fetchMultipleDiscordUsers([userId]);
  return result.get(userId) || null;
}

export function getAvatarUrl(user: DiscordUser, size: number = 128): string | null {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${
    user.avatar.startsWith('a_') ? 'gif' : 'png'
  }?size=${size}`;
}

export function getDisplayName(user: DiscordUser): string {
  return user.globalName || user.username;
}

export function getDefaultAvatarUrl(userId: string): string {
  const index = (BigInt(userId) >> 22n) % 6n;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export interface DiscordRole {
  id: string;
  name: string;
}

// This demo never talks to a real Discord server. These two used to call
// discord.com/api directly with a bot token; that path is removed entirely
// (not just left unconfigured) so no outbound request to Discord can ever
// happen here, regardless of what env vars get set later.
export async function fetchGuildName(_guildId?: string): Promise<string | null> {
  return null;
}

export async function fetchGuildRoles(_guildId?: string): Promise<DiscordRole[]> {
  return [];
}
