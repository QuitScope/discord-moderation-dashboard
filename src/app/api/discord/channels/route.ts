import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { listChannels } from '@/lib/mock-discord';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const canAccessChannels = canRead(session, 'channels') || canRead(session, 'reaction-roles') || canRead(session, 'webhooks') || canRead(session, 'embeds') || canRead(session, 'threads') || canRead(session, 'tempvoice');
  if (!canAccessChannels) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listChannels());
}
