import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { membersWithRole, addRoleToMember, getMemberById, toGuildMemberUser } from '@/lib/mock-discord';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'roles')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const members = membersWithRole(id).map((m) => ({
    user: toGuildMemberUser(m),
    nick: null,
    roles: m.roleIds,
  }));
  return NextResponse.json(members);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'roles')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { targetUserId } = await request.json();
  if (!getMemberById(targetUserId)) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  const updated = addRoleToMember(targetUserId, id);
  return NextResponse.json(updated);
}
