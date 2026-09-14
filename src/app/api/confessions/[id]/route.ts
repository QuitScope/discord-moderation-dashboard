import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { updateConfessionStatus, type ConfessionStatus } from '@/lib/mock-community';

const VALID_STATUSES: ConfessionStatus[] = ['pending_review', 'published', 'rejected'];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'confessions')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = (await request.json()) as { status?: string };
  if (!body.status || !VALID_STATUSES.includes(body.status as ConfessionStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updated = updateConfessionStatus(id, body.status as ConfessionStatus);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}
