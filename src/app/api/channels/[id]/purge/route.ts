import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { getChannelById } from '@/lib/mock-discord';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'channels')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { count } = (await request.json()) as { count?: number };
  if (!getChannelById(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // No real message history exists in this demo — report the requested
  // count as "deleted" so the UI's confirmation reads naturally.
  return NextResponse.json({ deleted: count ?? 0 });
}
