import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { resetWortketteChain } from '@/lib/mock-wortkette';

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'wortkette-admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(resetWortketteChain());
}
