import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { updateTemplateByType, deleteTemplateByType } from '@/lib/mock-store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canWrite(session, 'templates')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { type } = await params;
  const body = await request.json();
  const updated = updateTemplateByType(type, body);
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canWrite(session, 'templates')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { type } = await params;
  const deleted = deleteTemplateByType(type);
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(deleted);
}
