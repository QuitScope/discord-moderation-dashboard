import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import type { DashboardSession } from '@/lib/permissions';

function isGuildAdmin(session: Session | null): boolean {
  return !!(session as DashboardSession | null)?.isGuildAdmin;
}

export async function PUT() {
  const session = await auth();
  if (!session || !isGuildAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ error: 'Not available in this demo yet' }, { status: 501 });
}

export async function DELETE() {
  const session = await auth();
  if (!session || !isGuildAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ error: 'Not available in this demo yet' }, { status: 501 });
}
