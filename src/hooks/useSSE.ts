'use client';

import { useEffect, useRef, useState } from 'react';

export function useSSE<T>(url: string): { data: T | null; connected: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(1000);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled || !url) return;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
        retryDelay.current = 1000;
      };

      es.onmessage = (e) => {
        try {
          setData(JSON.parse(e.data) as T);
        } catch {
          // ignore malformed events
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        if (!cancelled) {
          retryRef.current = setTimeout(() => {
            retryDelay.current = Math.min(retryDelay.current * 2, 30000);
            connect();
          }, retryDelay.current);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [url]);

  return { data, connected };
}
