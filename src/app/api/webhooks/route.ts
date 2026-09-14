import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { listWebhooks, addWebhook } from '@/lib/mock-community';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'webhooks')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listWebhooks());
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'webhooks')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as { channelId?: string; name?: string };
  if (!body.name || !body.channelId) {
    return NextResponse.json({ message: 'name und channelId sind erforderlich' }, { status: 400 });
  }

  const created = addWebhook({ name: body.name, channelId: body.channelId });
  return NextResponse.json(created, { status: 201 });
}
