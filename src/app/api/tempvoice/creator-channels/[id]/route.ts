import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { getCreatorChannelById, updateCreatorChannelById, deleteCreatorChannelById, type CreatorChannel } from '@/lib/mock-tempvoice';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const existing = getCreatorChannelById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(existing);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = (await request.json()) as Partial<CreatorChannel>;
  const updated = updateCreatorChannelById(id, body);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const deleted = deleteCreatorChannelById(id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
