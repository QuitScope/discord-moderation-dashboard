import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { addViolation, genMockId, getViolationByKey } from '@/lib/mock-store';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canWrite(session, 'violations')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();

  if (typeof body.key !== 'string' || !body.key) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 });
  }
  if (typeof body.name !== 'string' || !body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!Array.isArray(body.category)) {
    return NextResponse.json({ error: 'category must be an array' }, { status: 400 });
  }
  if (typeof body.basePoints !== 'number') {
    return NextResponse.json({ error: 'basePoints must be a number' }, { status: 400 });
  }
  if (getViolationByKey(body.key)) {
    return NextResponse.json({ error: `A violation with key "${body.key}" already exists` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const violation = {
    id: genMockId(),
    key: body.key,
    name: body.name,
    description: body.description ?? null,
    category: body.category,
    basePoints: body.basePoints,
    isInstantBan: body.isInstantBan ?? false,
    escalateAfter: body.escalateAfter ?? 2,
    escalatePoints: body.escalatePoints ?? 1,
    autoTimeout: body.autoTimeout ?? null,
    autoTempban: body.autoTempban ?? null,
    requireEvidence: body.requireEvidence ?? false,
    ticketTemplate: body.ticketTemplate ?? null,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  addViolation(violation);
  return NextResponse.json(violation);
}
