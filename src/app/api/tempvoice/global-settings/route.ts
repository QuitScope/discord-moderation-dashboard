import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { getGlobalSettings, updateGlobalSettings, type GlobalSettings } from '@/lib/mock-tempvoice';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(getGlobalSettings());
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json()) as Partial<GlobalSettings>;
  return NextResponse.json(updateGlobalSettings(body));
}
