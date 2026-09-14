import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { removeConfessionBan } from '@/lib/mock-community';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'confessions')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId } = await params;
  if (!removeConfessionBan(userId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
