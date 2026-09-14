import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { getReactionRoleGroupById } from '@/lib/mock-community';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'reaction-roles')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const group = getReactionRoleGroupById(id);
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // There is no real Discord gateway connection in this demo, so a message
  // can never actually be posted or updated in a channel. Respond honestly
  // instead of pretending to succeed (status 200 so the client's `data.error`
  // branch — rather than its generic HTTP-failure branch — renders this).
  return NextResponse.json({
    ok: false,
    error: 'Versand ist in dieser Demo nicht möglich (kein echter Discord-Server verbunden).',
  });
}
