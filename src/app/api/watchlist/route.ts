import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { listWatchlist, addWatchlistEntry } from '@/lib/mock-discord';
import { genMockId } from '@/lib/mock-store';

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'watchlist')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10) || 1);
  const all = listWatchlist();
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const clamped = Math.min(page, pages);
  const start = (clamped - 1) * PAGE_SIZE;
  return NextResponse.json({ data: all.slice(start, start + PAGE_SIZE), total: all.length, page: clamped, pages });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'watchlist')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const createdById = (session as any).userId as string | undefined;
  const body = (await request.json()) as { userId?: string; reason?: string };
  if (!body.userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  const entry = {
    id: genMockId(),
    userId: body.userId,
    reason: body.reason ?? 'Mehrfachaccount',
    createdById: createdById ?? 'demo-admin',
    createdAt: new Date().toISOString(),
  };
  addWatchlistEntry(entry);
  return NextResponse.json(entry, { status: 201 });
}
