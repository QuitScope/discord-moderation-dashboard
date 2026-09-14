import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { listConfessions, type ConfessionStatus } from '@/lib/mock-community';

const VALID_STATUSES: ConfessionStatus[] = ['pending_review', 'published', 'rejected'];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'confessions')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const statusParam = request.nextUrl.searchParams.get('status');
  const status: ConfessionStatus = VALID_STATUSES.includes(statusParam as ConfessionStatus)
    ? (statusParam as ConfessionStatus)
    : 'pending_review';
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10) || 1);

  const { data, total, page: clampedPage, pages } = listConfessions(status, page);
  return NextResponse.json({ confessions: data, total, page: clampedPage, pages });
}
