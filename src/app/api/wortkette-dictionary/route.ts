import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { searchDictionary } from '@/lib/mock-wortkette';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'wortkette-dictionary')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') ?? '';
  const topic = searchParams.get('topic') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  return NextResponse.json(searchDictionary(query, topic, page));
}
