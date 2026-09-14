import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';
import { addTemplate, listTemplates, getTemplateByType } from '@/lib/mock-store';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canWrite(session, 'templates')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();

  if (typeof body.type !== 'string' || !body.type) {
    return NextResponse.json({ error: 'type is required' }, { status: 400 });
  }
  if (getTemplateByType(body.type)) {
    return NextResponse.json({ error: `A template with type "${body.type}" already exists` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const nextId = listTemplates().reduce((max, t) => Math.max(max, t.id), 0) + 1;
  const template = {
    id: nextId,
    type: body.type,
    enabled: body.enabled ?? true,
    title: body.title ?? null,
    description: body.description ?? null,
    color: body.color ?? null,
    authorName: body.authorName ?? null,
    authorIcon: body.authorIcon ?? null,
    footerText: body.footerText ?? null,
    footerIcon: body.footerIcon ?? null,
    imageUrl: body.imageUrl ?? null,
    thumbnailUrl: body.thumbnailUrl ?? null,
    timestamp: body.timestamp ?? false,
    createdAt: now,
    updatedAt: now,
  };
  addTemplate(template);
  return NextResponse.json(template);
}
