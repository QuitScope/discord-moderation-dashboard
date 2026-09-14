import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead } from '@/lib/permissions';
import { renderInterfaceLegendSvg } from '@/lib/mock-tempvoice';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { enabledActions?: string[] };
  const svg = renderInterfaceLegendSvg(Array.isArray(body.enabledActions) ? body.enabledActions : []);
  return new NextResponse(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } });
}
