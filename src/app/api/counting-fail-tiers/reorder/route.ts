import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { reorderFailTiers } from '@/lib/mock-automod';

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'counting-fail-tiers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json()) as { orderedIds?: string[] };
  if (!Array.isArray(body.orderedIds)) return NextResponse.json({ error: 'orderedIds is required' }, { status: 400 });
  return NextResponse.json(reorderFailTiers(body.orderedIds));
}
