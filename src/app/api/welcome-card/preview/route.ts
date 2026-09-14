import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { WelcomeCard } from '@quitscope/discord-welcomecard';
import type { PresetName, Theme } from '@quitscope/discord-welcomecard';
import { logger } from '@/lib/logger';

interface PreviewBody {
  type: 'join' | 'leave';
  joinCardPreset?: string | null;
  joinCardBackground?: string | null;
  joinCardTheme?: string | null;
  joinCardSubtitle?: string | null;
  joinCardShowMemberCount?: boolean;
  joinCardRingColor?: string | null;
  joinCardFontColor?: string | null;
  joinCardFontUsernameColor?: string | null;
  leaveCardPreset?: string | null;
  leaveCardBackground?: string | null;
  leaveCardTheme?: string | null;
  leaveCardSubtitle?: string | null;
  leaveCardRingColor?: string | null;
  leaveCardFontColor?: string | null;
  leaveCardFontUsernameColor?: string | null;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as PreviewBody;
  const { type, ...config } = body;

  const avatarUrl = session.user?.image ?? null;
  const username = session.user?.name ?? 'Vorschau';

  const card = new WelcomeCard();
  card.setUsername(username);
  if (avatarUrl) card.setAvatar(avatarUrl);

  if (type === 'join') {
    if (config.joinCardPreset) card.setPreset(config.joinCardPreset as PresetName);
    if (config.joinCardBackground) card.setBackground(config.joinCardBackground);
    if (config.joinCardTheme) card.setTheme(config.joinCardTheme as Theme);
    card.setSubtitle(config.joinCardSubtitle || 'Willkommen');
    if (config.joinCardShowMemberCount) card.setMemberCount(42);
    if (config.joinCardRingColor) card.setRingColor(config.joinCardRingColor);
    const font: Record<string, string> = {};
    if (config.joinCardFontColor) font.color = config.joinCardFontColor;
    if (config.joinCardFontUsernameColor) font.usernameColor = config.joinCardFontUsernameColor;
    if (Object.keys(font).length > 0) card.setFont(font);
  } else {
    if (config.leaveCardPreset) card.setPreset(config.leaveCardPreset as PresetName);
    if (config.leaveCardBackground) card.setBackground(config.leaveCardBackground);
    if (config.leaveCardTheme) card.setTheme(config.leaveCardTheme as Theme);
    card.setSubtitle(config.leaveCardSubtitle || 'Auf Wiedersehen');
    if (config.leaveCardRingColor) card.setRingColor(config.leaveCardRingColor);
    const font: Record<string, string> = {};
    if (config.leaveCardFontColor) font.color = config.leaveCardFontColor;
    if (config.leaveCardFontUsernameColor) font.usernameColor = config.leaveCardFontUsernameColor;
    if (Object.keys(font).length > 0) card.setFont(font);
  }

  try {
    const buffer = await card.toPNG();
    return new Response(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    logger.error('[welcome-card/preview] render error:', err);
    return NextResponse.json({ error: 'Render failed' }, { status: 500 });
  }
}
