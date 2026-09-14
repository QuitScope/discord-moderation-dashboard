import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { getInterfaceConfig, updateInterfaceConfig, type InterfaceConfig } from '@/lib/mock-tempvoice';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(getInterfaceConfig());
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json()) as Partial<InterfaceConfig>;
  // No real, already-posted Discord panels exist in this demo to refresh, so `refresh` is
  // omitted rather than faking a message-edit result the frontend would otherwise report.
  return NextResponse.json(updateInterfaceConfig(body));
}
