import { getCasesPaged } from '@/lib/api';
import { fetchMultipleDiscordUsers, getDisplayName, getAvatarUrl, fetchGuildRoles } from '@/lib/discord';
import { CasesClient } from './CasesClient';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; page?: string; dry?: string }>;
}) {
  const { userId, page, dry } = await searchParams;
  const parsed = page ? parseInt(page, 10) : 1;
  const pageNum = parsed && !isNaN(parsed) && parsed > 0 ? parsed : 1;
  const hideDryRun = dry === '1';

  let result: Awaited<ReturnType<typeof getCasesPaged>> | null = null;
  let error = '';

  try {
    result = await getCasesPaged({ userId, page: pageNum, hideDryRun });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load cases.';
  }

  const cases = result?.data ?? [];

  // Fetch Discord user info for all unique user IDs (target users + moderators)
  const userIds = new Set<string>();
  cases.forEach(c => {
    userIds.add(c.userId);
    if (c.createdById && c.createdById !== 'system') {
      userIds.add(c.createdById);
    }
  });

  const discordUsers = await fetchMultipleDiscordUsers([...userIds]);
  const userMapping: Record<string, { displayName: string; avatarUrl: string | null }> = {};
  
  discordUsers.forEach((user, id) => {
    userMapping[id] = {
      displayName: getDisplayName(user),
      avatarUrl: getAvatarUrl(user, 128),
    };
  });

  // Fetch guild roles for role name mapping
  const guildRoles = await fetchGuildRoles();
  const roleMapping: Record<string, string> = {};
  guildRoles.forEach((role) => {
    roleMapping[role.id] = role.name;
  });

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Cases"
        subtitle="Maßnahmen und Moderationseinträge"
        actions={
          <div
            className="rounded-lg px-4 py-3 text-center md:text-right w-full md:w-auto"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
          >
            <div className="text-display text-2xl font-bold" style={{ color: 'var(--amber)' }}>
              {result?.total ?? 0}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Einträge
            </div>
          </div>
        }
      />

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-lg p-4"
          style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--red)', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Cases table with filter */}
      {!error && (
        <CasesClient
          cases={cases}
          userMapping={userMapping}
          roleMapping={roleMapping}
          total={result?.total ?? 0}
          page={result?.page ?? 1}
          pages={result?.pages ?? 1}
          hideDryRun={hideDryRun}
        />
      )}
    </div>
  );
}
