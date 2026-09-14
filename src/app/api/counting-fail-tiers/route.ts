import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { listFailTiers, addFailTier } from '@/lib/mock-automod';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'counting-fail-tiers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listFailTiers());
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'counting-fail-tiers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json()) as { roleId?: string; emoji?: string };
  if (!body.roleId || !body.emoji) return NextResponse.json({ error: 'roleId and emoji are required' }, { status: 400 });
  const tier = addFailTier({ roleId: body.roleId, emoji: body.emoji });
  return NextResponse.json(tier, { status: 201 });
}
