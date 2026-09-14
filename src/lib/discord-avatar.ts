// Discord CDN avatar URL builder. Falls back to the default embed avatar
// derived from the user ID (same formula Discord uses post-pomelo).
// Deduplicates the identical `avatarUrl` helpers in members/birthdays pages.

export function discordAvatarUrl(id: string, avatar: string | null, size = 32): string {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=${size}`;
  }
  const index = (BigInt(id) >> 22n) % 6n;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}
