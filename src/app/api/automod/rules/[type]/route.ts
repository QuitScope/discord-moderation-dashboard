import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { updateAutomodRuleByType, type AutoModRule, type AutoModRuleType } from '@/lib/mock-automod';

type Ctx = { params: Promise<{ type: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'automod')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { type } = await params;
  const body = (await request.json()) as Partial<AutoModRule>;
  const updated = updateAutomodRuleByType(type as AutoModRuleType, body);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}
