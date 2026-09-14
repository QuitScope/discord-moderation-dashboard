'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCanWrite } from './WriteAccess';

export const fieldClass = 'w-full px-3 py-2 rounded-lg text-sm outline-none';
export const fieldStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
} as const;

export function FieldCard({ icon, label, hint, children, badge, full }: {
  icon: string; label: string; hint?: string; children: ReactNode; badge?: ReactNode; full?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 space-y-2 ${full ? 'md:col-span-2' : ''}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        {badge}
      </div>
      {children}
      {hint && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  const canWrite = useCanWrite();
  return (
    <label className="flex items-center gap-2 select-none" style={{ cursor: canWrite ? 'pointer' : 'not-allowed' }}>
      <div
        onClick={() => canWrite && onChange(!checked)}
        className="w-8 h-4 rounded-full relative transition-colors flex-shrink-0"
        style={{ background: checked ? 'var(--indigo)' : 'var(--border-default)', opacity: canWrite ? 1 : 0.5 }}
      >
        <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all" style={{ left: checked ? '17px' : '2px' }} />
      </div>
      {label && <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>}
    </label>
  );
}

/** Multi-select rendered as toggleable pills — used for permissions, restore set and actions. */
export function PillGroup<T extends string>({ options, selected, onChange }: {
  options: readonly { value: T; label: string; warning?: boolean }[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
}) {
  const canWrite = useCanWrite();
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            disabled={!canWrite}
            onClick={() => onChange(active ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: active ? 'var(--indigo-bg)' : 'var(--bg-elevated)',
              border: `1px solid ${active ? 'var(--indigo)' : 'var(--border-default)'}`,
              color: active ? 'var(--indigo-bright)' : 'var(--text-muted)',
              opacity: canWrite ? 1 : 0.6,
            }}
            title={opt.warning ? 'Nicht empfohlen — erlaubt dem Besitzer, Berechtigungen zu ändern.' : undefined}
          >
            {active ? '✓ ' : ''}{opt.label}{opt.warning ? ' ⚠️' : ''}
          </button>
        );
      })}
    </div>
  );
}

/** Add-from-dropdown plus removable chips. Used for access roles and fallback categories. */
export function IdMultiSelect({ options, selected, onChange, placeholder }: {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const canWrite = useCanWrite();
  const [pending, setPending] = useState('');
  const available = options.filter((o) => !selected.includes(o.id));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          className={`flex-1 ${fieldClass}`}
          style={fieldStyle}
          value={pending}
          disabled={!canWrite}
          onChange={(e) => {
            const id = e.target.value;
            setPending('');
            if (id && !selected.includes(id)) onChange([...selected, id]);
          }}
        >
          <option value="">{placeholder}</option>
          {available.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
              {options.find((o) => o.id === id)?.name ?? id}
              {canWrite && (
                <button onClick={() => onChange(selected.filter((x) => x !== id))} className="ml-1" style={{ color: 'var(--text-muted)' }}>
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The bar that appears once something was edited.
 *
 * Sticky at the bottom rather than a button somewhere in the form: with four tabs the save
 * button would otherwise scroll out of sight, and a change made on one tab would be easy to
 * lose by switching to another.
 */
export function SaveBar({ dirty, saving, onSave, onReset, disabled }: {
  dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void; disabled?: boolean;
}) {
  const canWrite = useCanWrite();
  if (!dirty || !canWrite) return null;
  return (
    <div
      className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-xl px-4 py-3"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--amber-bright, #f59e0b)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
    >
      <span className="text-xs font-semibold" style={{ color: 'var(--amber-bright)' }}>
        Vorsicht — du hast ungespeicherte Änderungen!
      </span>
      <div className="flex gap-2">
        <button
          onClick={onReset}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg text-xs"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border-default)', background: 'var(--bg-card)' }}
        >
          Zurücksetzen
        </button>
        <button
          onClick={onSave}
          disabled={saving || disabled}
          className="px-5 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: 'var(--indigo)', color: '#fff', opacity: saving || disabled ? 0.5 : 1 }}
        >
          {saving ? 'Speichert…' : 'Änderungen speichern'}
        </button>
      </div>
    </div>
  );
}

/**
 * Placeholder picker. Inserts a token at the caret of the field it belongs to, because
 * appending to the end is wrong for anything but an empty template.
 */
export function PlaceholderPicker({ placeholders, onPick }: {
  placeholders: { token: string; label: string; group: string; configurable?: boolean }[];
  onPick: (token: string) => void;
}) {
  const canWrite = useCanWrite();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const groups = placeholders.reduce<Record<string, typeof placeholders>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="relative" ref={ref}>
      <button
        disabled={!canWrite}
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] rounded-md px-2 py-1"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', opacity: canWrite ? 1 : 0.6 }}
      >
        + Platzhalter
      </button>
      {open && (
        <div
          className="absolute z-30 mt-1 w-72 max-h-80 overflow-y-auto rounded-lg p-2 space-y-2"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{group}</div>
              <div className="flex flex-wrap gap-1">
                {items.map((p) => (
                  <button
                    key={p.token}
                    onClick={() => { onPick(`{${p.token}}`); setOpen(false); }}
                    title={p.configurable ? `${p.label} — eigene Einstellungen im Tab „Sonstiges“` : p.label}
                    className="text-[11px] rounded-md px-2 py-1"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    {p.label}{p.configurable ? ' ⚙' : ''}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Text field that knows where the caret is, so a picked placeholder lands there. */
export function TemplateInput({ value, onChange, placeholders, rows }: {
  value: string;
  onChange: (next: string) => void;
  placeholders: { token: string; label: string; group: string; configurable?: boolean }[];
  rows?: number;
}) {
  const canWrite = useCanWrite();
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  function insert(token: string) {
    const el = ref.current;
    const at = el?.selectionStart ?? value.length;
    onChange(value.slice(0, at) + token + value.slice(el?.selectionEnd ?? at));
    // Put the caret behind what was just inserted, so several picks in a row read left to right.
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + token.length, at + token.length);
    });
  }

  return (
    <div className="space-y-2">
      {rows ? (
        <textarea
          ref={ref}
          rows={rows}
          disabled={!canWrite}
          className={`${fieldClass} resize-none`}
          style={fieldStyle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          ref={ref}
          disabled={!canWrite}
          className={fieldClass}
          style={fieldStyle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <PlaceholderPicker placeholders={placeholders} onPick={insert} />
    </div>
  );
}
