import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { listBirthdays } from '@/lib/mock-community';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'birthdays')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10) || 1);
  return NextResponse.json(listBirthdays(page));
}
