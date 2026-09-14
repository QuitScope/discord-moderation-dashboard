'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The legend image exactly as Discord will show it — rendered by the server, not mocked in the
 * browser, so what the preview shows and what the bot posts cannot drift.
 *
 * Debounced: dragging a tile fires a change per pointer move, and each one would otherwise be
 * a PNG render.
 */
export function DiscordImagePreview({ enabledActions }: { enabledActions: string[] }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const urlRef = useRef<string | null>(null);
  const actionsKey = enabledActions.join('|');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/tempvoice/interface-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabledActions: actionsKey ? actionsKey.split('|') : [] }),
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setImgUrl(url);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [actionsKey]);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#08010f', minHeight: 160 }}>
      {imgUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgUrl}
          alt="Discord-Vorschau"
          className="w-full h-auto block"
          style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}
        />
      )}
      {!imgUrl && loading && (
        <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Rendert…</div>
      )}
      {error && (
        <div className="p-3 text-xs" style={{ color: 'var(--red)' }}>Vorschau konnte nicht geladen werden.</div>
      )}
    </div>
  );
}
