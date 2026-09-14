import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { removeRoleFromMember } from '@/lib/mock-discord';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'roles')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, userId } = await params;
  const updated = removeRoleFromMember(userId, id);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}
