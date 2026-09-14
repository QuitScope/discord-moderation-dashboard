import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { type DashboardSession } from '@/lib/permissions';

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(session as DashboardSession).isGuildAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ error: 'Not available in this demo yet' }, { status: 501 });
}
