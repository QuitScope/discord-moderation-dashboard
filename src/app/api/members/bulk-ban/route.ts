import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { deleteMember, getMemberById } from '@/lib/mock-discord';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'members')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userIds } = (await request.json()) as { userIds: string[] };
  const banned: string[] = [];
  const failed: string[] = [];
  for (const id of userIds ?? []) {
    if (getMemberById(id)) {
      deleteMember(id);
      banned.push(id);
    } else {
      failed.push(id);
    }
  }
  return NextResponse.json({ banned_users: banned, failed_users: failed });
}
