import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { getChannelById, updateChannel, GUILD_ID } from '@/lib/mock-discord';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'channels')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { locked } = (await request.json()) as { locked: boolean };
  const existing = getChannelById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const withoutEveryOverwrite = existing.permission_overwrites.filter(
    (o) => !(o.id === GUILD_ID && o.type === 0),
  );
  const updated = updateChannel(id, {
    permission_overwrites: [
      ...withoutEveryOverwrite,
      { id: GUILD_ID, type: 0, allow: '0', deny: locked ? '2048' : '0' },
    ],
  });
  return NextResponse.json(updated);
}
