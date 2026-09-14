import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { setMemberTimeout, getMemberById } from '@/lib/mock-discord';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'members')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId } = await params;
  if (!getMemberById(userId)) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  const updated = setMemberTimeout(userId, null);
  return NextResponse.json(updated);
}
