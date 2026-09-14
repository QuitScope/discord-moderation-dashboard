import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { getMemberById, toProfile } from '@/lib/mock-discord';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, { area: 'moderation', action: 'read' })) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ids = request.nextUrl.searchParams.get('ids') ?? '';
  if (!ids) return NextResponse.json([], { status: 200 });

  const users = ids
    .split(',')
    .map((id) => getMemberById(id.trim()))
    .filter((m): m is NonNullable<typeof m> => !!m)
    .map(toProfile);

  return NextResponse.json(users);
}
