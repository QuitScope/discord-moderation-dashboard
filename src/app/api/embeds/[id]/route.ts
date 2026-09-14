import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { getEmbedById, updateEmbed, deleteEmbed } from '@/lib/mock-community';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'embeds')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const embed = getEmbedById(id);
  if (!embed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(embed);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'embeds')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const updated = updateEmbed(id, {
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
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'embeds')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  if (!deleteEmbed(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
