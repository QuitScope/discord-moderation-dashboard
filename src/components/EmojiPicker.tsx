'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
}

export function EmojiPicker({ onSelect, isOpen, onClose, anchorRect }: EmojiPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [customEmojis, setCustomEmojis] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch('/api/discord/emojis', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then((emojis: any[]) => setCustomEmojis(emojis))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen || !anchorRect) return;
    const W = 352, H = 435, pad = 8;
    let top = anchorRect.bottom + pad;
    let left = anchorRect.left;
    if (left + W > window.innerWidth) left = window.innerWidth - W - pad;
    if (left < pad) left = pad;
    if (top + H > window.innerHeight) top = anchorRect.top - H - pad;
    if (top < pad) top = pad;
    setPosition({ top, left });
  }, [isOpen, anchorRect]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element;
      if (ref.current && !ref.current.contains(t) && !t.closest('em-emoji-picker')) onClose();
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !anchorRect) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10000,
        borderRadius: 12,
        overflow: 'hidden',
        animation: 'ep-fadein 0.12s ease-out',
      }}
    >
      <style>{`
        @keyframes ep-fadein {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        em-emoji-picker {
          width: 352px !important;
          height: 435px !important;
        }
        em-emoji-picker, em-emoji-picker * { pointer-events: auto !important; }
      `}</style>
      <Picker
        data={data}
        onEmojiSelect={(emoji: any) => {
          if (emoji.id && !emoji.unified) {
            const prefix = emoji.animated ? 'a' : '';
            onSelect(`<${prefix}:${emoji.name}:${emoji.id}>`);
          } else {
            onSelect(emoji.native);
          }
          onClose();
        }}
        theme="dark"
        previewPosition="none"
        skinTonePosition="none"
        locale="de"
        navPosition="bottom"
        perLine={8}
        maxFrequentRows={2}
        custom={
          customEmojis.length > 0
            ? [{ id: 'discord', name: 'Server Emojis', emojis: customEmojis }]
            : undefined
        }
      />
    </div>,
    document.body,
  );
}

// ─── EmojiInput: text field + picker button ────────────────────────────────────
interface EmojiInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
}

function renderEmojiContent(value: string, placeholder: string) {
  if (!value) return <span style={{ fontSize: 20, opacity: 0.4 }}>{placeholder}</span>;
  const custom = value.match(/^<(a?):([^:]+):(\d+)>$/);
  if (custom) {
    const ext = custom[1] === 'a' ? 'gif' : 'webp';
    return (
      <img
        src={`https://cdn.discordapp.com/emojis/${custom[3]}.${ext}?size=32`}
        alt={custom[2]}
        style={{ width: 22, height: 22, objectFit: 'contain' }}
      />
    );
  }
  return <span style={{ fontSize: 20, lineHeight: 1 }}>{value}</span>;
}

export function EmojiInput({ value, onChange, placeholder = '😀', inputClassName, inputStyle }: EmojiInputProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    if (!open && btnRef.current) setAnchor(btnRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="Emoji auswählen"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, flexShrink: 0,
          background: '#2b2d31', border: '1px solid #3f4147',
          borderRadius: 6, cursor: 'pointer',
          transition: 'border-color 0.1s, background 0.1s',
          ...inputStyle,
        }}
        className={inputClassName}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#5865f2'; e.currentTarget.style.background = '#35373c'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3f4147'; e.currentTarget.style.background = '#2b2d31'; }}
      >
        {renderEmojiContent(value, placeholder)}
      </button>
      <EmojiPicker
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRect={anchor}
        onSelect={(e) => { onChange(e); setOpen(false); }}
      />
    </>
  );
}
