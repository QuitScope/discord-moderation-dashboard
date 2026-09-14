import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';

// This mirrors a much larger config surface on the real backend. In this
// portfolio demo, the only remaining consumer (src/app/dashboard/ban-tags)
// reads just `banRoleIds`, so that's all this mock returns — building out the
// full config schema is explicitly out of scope here.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'config')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ banRoleIds: [] });
}
