import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { listSpecialLines, addSpecialLine } from '@/lib/mock-wortkette';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'wortkette-special-lines')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const page = Math.max(1, parseInt(new URL(request.url).searchParams.get('page') ?? '1', 10) || 1);
  return NextResponse.json(listSpecialLines(page));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'wortkette-special-lines')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json()) as { word?: string; lines?: string[] };
  if (!body.word?.trim()) return NextResponse.json({ message: 'word is required' }, { status: 400 });
  const entry = addSpecialLine(body.word.trim(), Array.isArray(body.lines) ? body.lines : []);
  return NextResponse.json(entry, { status: 201 });
}
