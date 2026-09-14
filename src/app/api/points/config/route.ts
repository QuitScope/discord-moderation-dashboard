import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { getPointsConfig, updatePointsConfig, type PointsConfig } from '@/lib/mock-automod';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'points')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(getPointsConfig());
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'points')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json()) as Partial<PointsConfig>;
  return NextResponse.json(updatePointsConfig(body));
}
