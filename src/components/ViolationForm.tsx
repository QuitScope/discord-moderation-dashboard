'use client';

import { useState } from 'react';
import type { Violation } from '@/lib/api';
import { LoadingSpinner } from './LoadingSpinner';

export interface CreateViolationInput {
  key: string;
  name: string;
  description?: string;
  category: string[];
  basePoints: number;
  isInstantBan?: boolean;
  escalateAfter?: number;
  escalatePoints?: number;
  autoTimeout?: string;
  autoTempban?: string;
  requireEvidence?: boolean;
  ticketTemplate?: string;
}

export interface UpdateViolationInput {
  name?: string;
  description?: string;
  category?: string[];
  basePoints?: number;
  isInstantBan?: boolean;
  escalateAfter?: number;
  escalatePoints?: number;
  autoTimeout?: string;
  autoTempban?: string;
  requireEvidence?: boolean;
  ticketTemplate?: string;
}

interface ViolationFormProps {
  mode: 'create' | 'edit';
  initialData?: Violation;
  onSubmit: (data: CreateViolationInput | UpdateViolationInput) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  key?: string;
  name?: string;
  description?: string;
  category?: string;
  basePoints?: string;
  escalateAfter?: string;
  escalatePoints?: string;
  autoTimeout?: string;
  autoTempban?: string;
  ticketTemplate?: string;
}

const fieldStyle = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  padding: '8px 12px',
  width: '100%',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  outline: 'none',
};

export function ViolationForm({ mode, initialData, onSubmit, onCancel }: ViolationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [key, setKey] = useState(initialData?.key || '');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category?.join(', ') || '');
  const [basePoints, setBasePoints] = useState(initialData?.basePoints ?? 2);
  const [isInstantBan, setIsInstantBan] = useState(initialData?.isInstantBan || false);
  const [escalateAfter, setEscalateAfter] = useState(initialData?.escalateAfter ?? 2);
  const [escalatePoints, setEscalatePoints] = useState(initialData?.escalatePoints ?? 1);
  const [autoTimeout, setAutoTimeout] = useState(initialData?.autoTimeout || '');
  const [autoTempban, setAutoTempban] = useState(initialData?.autoTempban || '');
  const [requireEvidence, setRequireEvidence] = useState(initialData?.requireEvidence || false);
  const [ticketTemplate, setTicketTemplate] = useState(initialData?.ticketTemplate || '');

  const validateKey = (v: string) => !v ? 'Pflichtfeld' : !/^[a-z0-9_]+$/.test(v) ? 'Nur Kleinbuchstaben, Zahlen und Unterstriche' : undefined;
  const validateName = (v: string) => !v.trim() ? 'Pflichtfeld' : v.length > 100 ? 'Max. 100 Zeichen' : undefined;
  const validateDescription = (v: string) => v.length > 500 ? 'Max. 500 Zeichen' : undefined;
  const validateCategory = (v: string) => !v.trim() ? 'Pflichtfeld' : undefined;
  const validateBasePoints = (v: number) => v < 0 || v > 10 ? 'Muss zwischen 0 und 10 liegen' : undefined;
  const validateEscalateAfter = (v: number) => v < 0 ? 'Muss 0 oder größer sein' : undefined;
  const validateEscalatePoints = (v: number) => v < 0 ? 'Muss 0 oder größer sein' : undefined;
  const validateDuration = (v: string) => v && !/^\d+[mhd]$/.test(v) ? 'Format: 10m, 2h, 7d' : undefined;
  const validateTicketTemplate = (v: string) => v.length > 2000 ? 'Max. 2000 Zeichen' : undefined;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (mode === 'create') newErrors.key = validateKey(key);
    newErrors.name = validateName(name);
    newErrors.description = validateDescription(description);
    newErrors.category = validateCategory(category);
    newErrors.basePoints = validateBasePoints(basePoints);
    newErrors.escalateAfter = validateEscalateAfter(escalateAfter);
    newErrors.escalatePoints = validateEscalatePoints(escalatePoints);
    newErrors.autoTimeout = validateDuration(autoTimeout);
    newErrors.autoTempban = validateDuration(autoTempban);
    newErrors.ticketTemplate = validateTicketTemplate(ticketTemplate);
    Object.keys(newErrors).forEach((k) => {
      if (newErrors[k as keyof FormErrors] === undefined) delete newErrors[k as keyof FormErrors];
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const data = mode === 'create'
        ? { key, name, description: description || undefined, category: category.split(',').map((c) => c.trim()).filter(Boolean), basePoints, isInstantBan, escalateAfter, escalatePoints, autoTimeout: autoTimeout || undefined, autoTempban: autoTempban || undefined, requireEvidence, ticketTemplate: ticketTemplate || undefined }
        : { name, description: description || undefined, category: category.split(',').map((c) => c.trim()).filter(Boolean), basePoints, isInstantBan, escalateAfter, escalatePoints, autoTimeout: autoTimeout || undefined, autoTempban: autoTempban || undefined, requireEvidence, ticketTemplate: ticketTemplate || undefined };
      await onSubmit(data);
    } catch {
      // error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const pointsColor = basePoints === 0 ? 'var(--amber)' : basePoints <= 2 ? 'var(--yellow)' : basePoints <= 5 ? 'var(--purple)' : 'var(--red)';
  const sliderPct = (basePoints / 10) * 100;
  const sliderStyle = {
    background: `linear-gradient(to right, ${pointsColor} 0%, ${pointsColor} ${sliderPct}%, rgba(255,255,255,0.07) ${sliderPct}%, rgba(255,255,255,0.07) 100%)`,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Key */}
        {mode === 'create' && (
          <Field label="Schlüssel" required error={errors.key}>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onBlur={() => setErrors({ ...errors, key: validateKey(key) })}
              style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }}
              placeholder="z.B. spam_chat"
              disabled={isSubmitting}
            />
          </Field>
        )}

        {/* Name */}
        <Field label="Name" required error={errors.name} className={mode === 'create' ? '' : 'sm:col-span-2'}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setErrors({ ...errors, name: validateName(name) })}
            style={fieldStyle}
            placeholder="z.B. Spam"
            disabled={isSubmitting}
          />
        </Field>
      </div>

      {/* Description */}
      <Field label="Beschreibung" error={errors.description}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setErrors({ ...errors, description: validateDescription(description) })}
          style={{ ...fieldStyle, minHeight: '72px', resize: 'vertical' }}
          placeholder="Optionale Beschreibung"
          disabled={isSubmitting}
        />
      </Field>

      {/* Category */}
      <Field label="Kategorien" required hint="Kommagetrennt" error={errors.category}>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onBlur={() => setErrors({ ...errors, category: validateCategory(category) })}
          style={fieldStyle}
          placeholder="z.B. spam, chat"
          disabled={isSubmitting}
        />
      </Field>

      {/* Base Points */}
      <Field label="Basispunkte" error={errors.basePoints}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="10"
              value={basePoints}
              onChange={(e) => setBasePoints(Number(e.target.value))}
              className="cyber-range flex-1"
              style={sliderStyle}
              disabled={isSubmitting}
            />
            <span
              className="text-display text-lg font-bold w-9 text-center shrink-0 tabular-nums"
              style={{
                color: pointsColor,
                background: `${pointsColor}18`,
                border: `1px solid ${pointsColor}40`,
                borderRadius: '6px',
                lineHeight: '28px',
                fontSize: '15px',
              }}
            >
              {basePoints}
            </span>
          </div>
          {/* Tick labels */}
          <div className="flex justify-between px-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
            {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
              <span key={n} style={n === basePoints ? { color: pointsColor, fontWeight: 700 } : undefined}>{n}</span>
            ))}
          </div>
        </div>
      </Field>

      {/* Instant Ban */}
      <CheckboxField
        label="Sofort-Bann"
        checked={isInstantBan}
        onChange={setIsInstantBan}
        disabled={isSubmitting}
      />

      {/* Escalation */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Eskalation nach" error={errors.escalateAfter}>
          <input
            type="number"
            min="0"
            value={escalateAfter}
            onChange={(e) => setEscalateAfter(Number(e.target.value))}
            onBlur={() => setErrors({ ...errors, escalateAfter: validateEscalateAfter(escalateAfter) })}
            style={fieldStyle}
            disabled={isSubmitting}
          />
        </Field>
        <Field label="Eskalationspunkte" error={errors.escalatePoints}>
          <input
            type="number"
            min="0"
            value={escalatePoints}
            onChange={(e) => setEscalatePoints(Number(e.target.value))}
            onBlur={() => setErrors({ ...errors, escalatePoints: validateEscalatePoints(escalatePoints) })}
            style={fieldStyle}
            disabled={isSubmitting}
          />
        </Field>
      </div>

      {/* Auto-actions */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Auto-Timeout" hint="z.B. 10m, 2h" error={errors.autoTimeout}>
          <input
            type="text"
            value={autoTimeout}
            onChange={(e) => setAutoTimeout(e.target.value)}
            onBlur={() => setErrors({ ...errors, autoTimeout: validateDuration(autoTimeout) })}
            style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }}
            placeholder="10m"
            disabled={isSubmitting}
          />
        </Field>
        <Field label="Auto-Tempban" hint="z.B. 7d, 30d" error={errors.autoTempban}>
          <input
            type="text"
            value={autoTempban}
            onChange={(e) => setAutoTempban(e.target.value)}
            onBlur={() => setErrors({ ...errors, autoTempban: validateDuration(autoTempban) })}
            style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }}
            placeholder="7d"
            disabled={isSubmitting}
          />
        </Field>
      </div>

      {/* Require evidence */}
      <CheckboxField
        label="Beweis erforderlich"
        checked={requireEvidence}
        onChange={setRequireEvidence}
        disabled={isSubmitting}
      />

      {/* Ticket template */}
      <Field label="Ticket-Vorlage" error={errors.ticketTemplate}>
        <textarea
          value={ticketTemplate}
          onChange={(e) => setTicketTemplate(e.target.value)}
          onBlur={() => setErrors({ ...errors, ticketTemplate: validateTicketTemplate(ticketTemplate) })}
          style={{ ...fieldStyle, minHeight: '100px', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
          placeholder="Optionale Ticket-Vorlage..."
          disabled={isSubmitting}
        />
      </Field>

      {/* Actions */}
      <div
        className="flex gap-3 justify-end pt-4"
        style={{ borderTop: '1px solid var(--border-default)' }}
      >
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn btn-ghost">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary flex items-center gap-2"
        >
          {isSubmitting && <LoadingSpinner size="sm" />}
          {mode === 'create' ? 'Erstellen' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {required && <span style={{ color: 'var(--red)', marginLeft: '3px' }}>*</span>}
        </label>
        {hint && <span className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--red)' }}>{error}</p>
      )}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="cyber-checkbox"
        disabled={disabled}
      />
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </label>
  );
}
