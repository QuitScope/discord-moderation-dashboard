import { getCases } from '@/lib/api';
import { fetchMultipleDiscordUsers, getDisplayName, getAvatarUrl, getDefaultAvatarUrl } from '@/lib/discord';
import type { UserInfo } from '@/lib/analytics';
import type { Case } from '@/lib/api';
import { LeaderboardClient } from './LeaderboardClient';

async function buildUserMap(cases: Case[]): Promise<Record<string, UserInfo>> {
  const ids = [...new Set(cases.map((c) => c.userId))];
  const discordUsers = await fetchMultipleDiscordUsers(ids);
  const map: Record<string, UserInfo> = {};
  for (const [id, u] of discordUsers) {
    map[id] = { name: getDisplayName(u), avatarUrl: getAvatarUrl(u, 64) ?? getDefaultAvatarUrl(id) };
  }
  return map;
}

export default async function LeaderboardPage() {
  const cases = await getCases() ?? [];
  const userMap = await buildUserMap(cases);
  return <LeaderboardClient cases={cases} userMap={userMap} />;
}
