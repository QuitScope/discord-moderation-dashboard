import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { updateViolationByKey, deleteViolationByKey } from '@/lib/mock-store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canWrite(session, 'violations')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key } = await params;
  const body = await request.json();
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name)) {
    return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 });
  }
  const updated = updateViolationByKey(key, body);
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canWrite(session, 'violations')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key } = await params;
  const deleted = deleteViolationByKey(key);
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(deleted);
}
