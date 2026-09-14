import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { listAutomodRules } from '@/lib/mock-automod';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'automod')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listAutomodRules());
}
