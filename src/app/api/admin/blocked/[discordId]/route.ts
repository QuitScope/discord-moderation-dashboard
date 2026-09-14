import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { DashboardSession } from '@/lib/permissions';

export async function DELETE() {
  const session = await auth();
  if (!(session as DashboardSession | null)?.isGuildAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ error: 'Not available in this demo yet' }, { status: 501 });
}
