import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { listCreatorChannels, createCreatorChannel, type CreatorChannel } from '@/lib/mock-tempvoice';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listCreatorChannels());
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json()) as Omit<CreatorChannel, 'id'>;
  const created = createCreatorChannel(body);
  return NextResponse.json(created, { status: 201 });
}
