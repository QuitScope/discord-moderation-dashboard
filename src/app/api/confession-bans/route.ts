import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { listConfessionBans, addConfessionBan } from '@/lib/mock-community';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'confessions')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(listConfessionBans());
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'confessions')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const userId = (session as any).userId as string | undefined;
  const body = (await request.json()) as { userId?: string; reason?: string };
  if (!body.userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  const ban = addConfessionBan({ userId: body.userId, reason: body.reason ?? null, createdById: userId ?? 'demo-admin' });
  return NextResponse.json(ban, { status: 201 });
}
