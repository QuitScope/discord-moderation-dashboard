import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { getAutomodConfig, updateAutomodConfig, type AutoModConfig } from '@/lib/mock-automod';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'automod')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(getAutomodConfig());
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'automod')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json()) as Partial<AutoModConfig>;
  return NextResponse.json(updateAutomodConfig(body));
}
