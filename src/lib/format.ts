// Shared date/number formatting helpers (de-DE).
// Replaces the ~dozen copy-pasted toLocaleDateString/relativeDate snippets
// that were scattered across the dashboard pages.

const LOCALE = 'de-DE';

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function formatTime(value: string | Date, withSeconds = false): string {
  return new Date(value).toLocaleTimeString(
    LOCALE,
    withSeconds
      ? { hour: '2-digit', minute: '2-digit', second: '2-digit' }
      : { hour: '2-digit', minute: '2-digit' },
  );
}

/** "Heute" / "vor 3d" / "12.06.25" */
export function relativeDate(value: string | Date): string {
  const date = new Date(value);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return 'Heute';
  if (days < 7) return `vor ${days}d`;
  return formatDate(date);
}
