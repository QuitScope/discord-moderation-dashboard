import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { listLeaveCardRoleAssignments } from '@/lib/mock-community';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'welcome-card')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(listLeaveCardRoleAssignments());
}
