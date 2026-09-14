import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { listLeaveCardTags, addLeaveCardTag } from '@/lib/mock-community';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'welcome-card')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(listLeaveCardTags());
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'welcome-card')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as { name?: string; leaveText?: string };
  if (!body.name || !body.leaveText) {
    return NextResponse.json({ error: 'name und leaveText sind erforderlich' }, { status: 400 });
  }

  const created = addLeaveCardTag({ name: body.name, leaveText: body.leaveText });
  return NextResponse.json(created, { status: 201 });
}
