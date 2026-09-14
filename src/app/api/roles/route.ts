import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { listRoles } from '@/lib/mock-discord';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const canAccessRoles = canRead(session, 'roles') || canRead(session, 'reaction-roles') || canRead(session, 'members') || canRead(session, 'automod') || canRead(session, 'tempvoice');
  if (!canAccessRoles) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listRoles());
}
