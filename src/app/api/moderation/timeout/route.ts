import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { setMemberTimeout, getMemberById } from '@/lib/mock-discord';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'members')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as { targetUserId: string; durationMs: number; reason: string };
  if (!getMemberById(body.targetUserId)) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const until = new Date(Date.now() + body.durationMs).toISOString();
  const updated = setMemberTimeout(body.targetUserId, until);
  return NextResponse.json(updated);
}
