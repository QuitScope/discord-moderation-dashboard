import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canWrite } from '@/lib/permissions';

/**
 * Posting a panel into a public channel is a write, not a read — hence canWrite.
 *
 * The real backend sends a live embed message through the bot's Discord gateway connection.
 * This demo has no real Discord server or bot connection behind it, so this action genuinely
 * cannot succeed — it honestly reports that instead of pretending to post a message. `message`
 * is the field InterfaceEditor reads for its error toast.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'tempvoice')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await request.json().catch(() => ({}));
  return NextResponse.json(
    { message: 'Nachrichtenversand ist in dieser Demo nicht möglich (kein echter Discord-Server verbunden).' },
    { status: 501 },
  );
}
