import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canRead, canWrite } from '@/lib/permissions';
import { getWelcomeCardConfig, updateWelcomeCardConfig, type WelcomeCardConfig } from '@/lib/mock-community';

const WELCOME_CARD_FIELDS = [
  'joinCardEnabled', 'joinCardChannelId', 'joinCardPreset', 'joinCardBackground',
  'joinCardTheme', 'joinCardSubtitle', 'joinCardMessage', 'joinCardShowMemberCount',
  'joinCardRingColor', 'joinCardFontColor', 'joinCardFontUsernameColor',
  'leaveCardEnabled', 'leaveCardChannelId', 'leaveCardPreset', 'leaveCardBackground',
  'leaveCardTheme', 'leaveCardSubtitle', 'leaveCardBanSubtitle', 'leaveCardMessage',
  'leaveCardRingColor', 'leaveCardFontColor', 'leaveCardFontUsernameColor',
] as const;

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canRead(session, 'welcome-card')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(getWelcomeCardConfig());
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canWrite(session, 'welcome-card')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const safe = Object.fromEntries(
    WELCOME_CARD_FIELDS.filter((k) => k in body).map((k) => [k, body[k]]),
  ) as Partial<WelcomeCardConfig>;

  return NextResponse.json(updateWelcomeCardConfig(safe));
}
