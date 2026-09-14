import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { listRoles } from '@/lib/mock-discord';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'roles')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listRoles());
}
