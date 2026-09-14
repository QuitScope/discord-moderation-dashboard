import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { setLeaveCardRoleAssignment, removeLeaveCardRoleAssignment } from '@/lib/mock-community';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'welcome-card')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { roleId } = await params;
  const body = (await request.json()) as { tagId?: string };
  if (!body.tagId) return NextResponse.json({ error: 'tagId is required' }, { status: 400 });

  const assignment = setLeaveCardRoleAssignment(roleId, body.tagId);
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(assignment);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'welcome-card')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { roleId } = await params;
  if (!removeLeaveCardRoleAssignment(roleId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
