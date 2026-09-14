import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { listEmbeds, addEmbed } from '@/lib/mock-community';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'embeds')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(listEmbeds());
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'embeds')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  const created = addEmbed({
    name: body.name,
    title: body.title ?? null,
    url: body.url ?? null,
    description: body.description ?? null,
    color: body.color ?? null,
    authorName: body.authorName ?? null,
    authorIcon: body.authorIcon ?? null,
    footerText: body.footerText ?? null,
    footerIcon: body.footerIcon ?? null,
    imageUrl: body.imageUrl ?? null,
    thumbnailUrl: body.thumbnailUrl ?? null,
    timestamp: Boolean(body.timestamp),
    fields: Array.isArray(body.fields) ? body.fields : [],
  });
  return NextResponse.json(created, { status: 201 });
}
