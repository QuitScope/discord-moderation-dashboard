import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { listReactionRoleGroups, addReactionRoleGroup } from '@/lib/mock-community';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'reaction-roles')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listReactionRoleGroups());
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'reaction-roles')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  const created = addReactionRoleGroup(body);
  return NextResponse.json(created, { status: 201 });
}
