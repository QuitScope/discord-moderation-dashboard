import { getCases } from '@/lib/api';
import { fetchMultipleDiscordUsers, getDisplayName, getAvatarUrl, getDefaultAvatarUrl } from '@/lib/discord';
import type { UserInfo } from '@/lib/analytics';
import type { Case } from '@/lib/api';
import { ModeratorsClient } from './ModeratorsClient';

async function buildUserMap(cases: Case[]): Promise<Record<string, UserInfo>> {
  const ids = [...new Set(
    cases.map((c) => (c as any).createdById as string | undefined).filter(Boolean) as string[]
  )].slice(0, 50);
  const discordUsers = await fetchMultipleDiscordUsers(ids);
  const map: Record<string, UserInfo> = {};
  for (const [id, u] of discordUsers) {
    map[id] = { name: getDisplayName(u), avatarUrl: getAvatarUrl(u, 64) ?? getDefaultAvatarUrl(id) };
  }
  return map;
}

export default async function ModeratorsPage() {
  const cases = await getCases() ?? [];
  const userMap = await buildUserMap(cases);
  return <ModeratorsClient cases={cases} userMap={userMap} />;
}
