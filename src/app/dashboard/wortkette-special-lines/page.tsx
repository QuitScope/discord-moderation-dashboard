'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/useToast';
import { PageHeader } from '@/components/ui/PageHeader';

interface SpecialLine {
  id: string;
  word: string;
  lines: string[];
  enabled: boolean;
}

interface PagedResult {
  items: SpecialLine[];
  total: number;
  page: number;
  pages: number;
}

const emptyResult: PagedResult = { items: [], total: 0, page: 1, pages: 1 };

const inputStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
} as const;

function linesToText(lines: string[]) {
  return lines.join('\n');
}

function textToLines(text: string) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

export default function WortketteSpecialLinesPage() {
  const { showToast, toastElement } = useToast();
  const [result, setResult] = useState<PagedResult>(emptyResult);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [newLines, setNewLines] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wortkette-special-lines?page=${page}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data?.items)) throw new Error('request failed');
      setResult(data);
    } catch {
      showToast('Fehler beim Laden der Special-Lines', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => { load(); }, [load]);
  const rows = result.items;

  // Deleting the last item on the last page (or any external shrink) can leave
  // `page` past the new end — step back once the count is known.
  useEffect(() => {
    if (result.pages > 0 && page > result.pages) setPage(result.pages);
  }, [result.pages, page]);

  async function addRow() {
    if (!newWord.trim()) return;
    const res = await fetch('/api/wortkette-special-lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: newWord.trim(), lines: textToLines(newLines) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      showToast(data?.message ?? 'Fehler beim Hinzufügen', 'error');
      return;
    }
    setNewWord('');
    setNewLines('');
    showToast('Special-Line hinzugefügt');
    await load();
  }

  async function patchRow(id: string, patch: { lines?: string[]; enabled?: boolean }) {
    const res = await fetch(`/api/wortkette-special-lines/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { showToast('Fehler beim Speichern', 'error'); return; }
    await load();
  }

  async function deleteRow(id: string, word: string) {
    if (!window.confirm(`Special-Line für „${word}" löschen?`)) return;
    const res = await fetch(`/api/wortkette-special-lines/${id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Fehler beim Löschen', 'error'); return; }
    showToast('Special-Line gelöscht');
    await load();
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Wortkette-Sprüche"
        subtitle="Kuratierte Antworten für einzelne Wörter — ersetzen den Standard-Flavor-Text. Änderungen greifen im Bot nach ein paar Minuten."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Lade Special-Lines…</div>
        </div>
      ) : (
        <>
          {rows.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              Noch keine Special-Lines. Gespielte Wörter lösen dann nur die Standard-Flavor-Texte aus.
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['Wort', 'Zeilen (eine pro Antwort)', 'Aktiv', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td className="px-4 py-3 font-medium align-top" style={{ color: 'var(--text-primary)' }}>
                        {row.word}
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          defaultValue={linesToText(row.lines)}
                          rows={Math.max(2, row.lines.length)}
                          onBlur={(e) => {
                            const next = textToLines(e.target.value);
                            if (linesToText(next) !== linesToText(row.lines)) {
                              patchRow(row.id, { lines: next });
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
                          style={inputStyle}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) => patchRow(row.id, { enabled: e.target.checked })}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-end">
                          <button onClick={() => deleteRow(row.id, row.word)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.4)', color: 'var(--red)' }}>
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.total > 0 && (
            <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>{result.total.toLocaleString('de-DE')} Einträge</span>
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
          )}

          <div className="panel p-4">
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              Neue Special-Line
            </div>
            <div className="flex flex-col gap-3">
              <input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Wort, z. B. nutte"
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
              <textarea
                value={newLines}
                onChange={(e) => setNewLines(e.target.value)}
                placeholder="Eine Antwort pro Zeile"
                rows={3}
                className="px-3 py-2 rounded-lg text-sm outline-none resize-y"
                style={inputStyle}
              />
              <button onClick={addRow} disabled={!newWord.trim()}
                className="self-start px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: !newWord.trim() ? 0.5 : 1 }}>
                Hinzufügen
              </button>
            </div>
          </div>
        </>
      )}
      {toastElement}
    </div>
  );
}
