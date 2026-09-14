import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { clearReactionRoleGroupMessage } from '@/lib/mock-community';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'reaction-roles')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const updated = clearReactionRoleGroupMessage(id);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}
