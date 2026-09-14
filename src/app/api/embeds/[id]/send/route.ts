import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { getEmbedById } from '@/lib/mock-community';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'embeds')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const embed = getEmbedById(id);
  if (!embed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await request.json().catch(() => ({}));

  // No real Discord gateway connection exists in this demo, so an embed can
  // never actually be posted into a channel — say so honestly instead of
  // pretending to succeed.
  return NextResponse.json(
    { ok: false, error: 'Versand ist in dieser Demo nicht möglich (kein echter Discord-Server verbunden).' },
    { status: 501 },
  );
}
