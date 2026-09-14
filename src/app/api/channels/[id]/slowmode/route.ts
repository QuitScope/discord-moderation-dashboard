import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { updateChannel } from '@/lib/mock-discord';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'channels')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { seconds } = (await request.json()) as { seconds: number };
  const updated = updateChannel(id, { rate_limit_per_user: seconds });
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}
