import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { listEmojis } from '@/lib/mock-discord';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const canAccessEmojis = canRead(session, 'reaction-roles') || canRead(session, 'embeds');
  if (!canAccessEmojis) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listEmojis());
}
