import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { setWortketteTheme } from '@/lib/mock-wortkette';

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'wortkette-admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json()) as { theme?: string | null; expiresAt?: string | null; announce?: boolean };
  const updated = setWortketteTheme(body.theme ?? null, body.expiresAt ?? null);
  return NextResponse.json({ ...updated, announced: Boolean(body.announce) });
}
