'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

interface DictionaryWord {
  word: string;
  topics: string[];
}

interface SearchResult {
  words: DictionaryWord[];
  total: number;
  page: number;
  pages: number;
}

const emptyResult: SearchResult = { words: [], total: 0, page: 1, pages: 0 };

const fieldStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
} as const;

export default function WortketteDictionaryPage() {
  const { showToast, toastElement } = useToast();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [result, setResult] = useState<SearchResult>(emptyResult);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/wortkette-dictionary/topics')
      .then((res) => res.json())
      .then((data) => setTopics(Array.isArray(data) ? data : []))
      .catch(() => setTopics([]));
  }, []);

  useEffect(() => { setPage(1); }, [query, topic]);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query, topic, page: String(page) });
      const res = await fetch(`/api/wortkette-dictionary?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.words)) throw new Error('search failed');
      setResult(data);
    } catch {
      showToast('Fehler beim Suchen', 'error');
    } finally {
      setLoading(false);
    }
  }, [query, topic, page, showToast]);

  useEffect(() => {
    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Wortkette-Wörterbuch"
        subtitle="Suche im Dictionary, das per wöchentlichem Wiktionary-Import befüllt wird"
      />

      <div className="panel p-4 flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wort suchen (Anfang)…"
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
          style={fieldStyle}
        />
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={fieldStyle}
        >
          <option value="">Alle Themen</option>
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade…</div>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Wort', 'Themen'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.words.map((w, i) => (
                <tr key={w.word}
                  style={{ borderBottom: i < result.words.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{w.word}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {w.topics.join(', ') || '—'}
                  </td>
                </tr>
              ))}
              {result.words.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    Keine Treffer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>{result.total.toLocaleString('de-DE')} Treffer</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1 rounded text-xs"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: page <= 1 ? 0.4 : 1 }}>
            ← Zurück
          </button>
          <span>Seite {result.page} / {Math.max(1, result.pages)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= result.pages}
            className="px-3 py-1 rounded text-xs"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: page >= result.pages ? 0.4 : 1 }}>
            Weiter →
          </button>
        </div>
      </div>
      {toastElement}
    </div>
  );
}
