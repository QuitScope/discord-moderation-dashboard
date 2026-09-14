import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { listMembers, toProfile } from '@/lib/mock-discord';

const PAGE_SIZE_DEFAULT = 50;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'members')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.max(1, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE_DEFAULT), 10) || PAGE_SIZE_DEFAULT);
  const search = (searchParams.get('search') ?? '').toLowerCase().trim();
  const minPoints = parseInt(searchParams.get('minPoints') ?? '0', 10) || 0;
  const sort = searchParams.get('sort') ?? 'points';

  let members = listMembers().filter((m) => m.activePoints >= minPoints);
  if (search) {
    members = members.filter(
      (m) => m.id.includes(search) || m.username.toLowerCase().includes(search) || (m.globalName ?? '').toLowerCase().includes(search),
    );
  }
  members = members.sort((a, b) => {
    if (sort === 'cases') return b.caseCount - a.caseCount;
    if (sort === 'joinedAt') return b.joinedAt.localeCompare(a.joinedAt);
    return b.activePoints - a.activePoints;
  });

  const total = members.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const clamped = Math.min(page, pages);
  const start = (clamped - 1) * limit;
  const users = members.slice(start, start + limit).map((m) => ({
    ...toProfile(m),
    activePoints: m.activePoints,
    caseCount: m.caseCount,
    createdAt: m.joinedAt,
    activeTimeoutUntil: m.activeTimeoutUntil,
  }));

  return NextResponse.json({ users, total, page: clamped, pages });
}
