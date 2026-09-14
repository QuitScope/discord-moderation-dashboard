'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createViolation, updateViolation, deleteViolation } from '@/lib/api';
import type { CreateViolationInput, UpdateViolationInput, Violation } from '@/lib/api';
import { CyberModal } from '@/components/CyberModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ViolationForm } from '@/components/ViolationForm';

interface ViolationsClientProps {
  initialViolations: Violation[] | null;
}

function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    const match = error.message.match(/API.*?:\s*\d+\s*—\s*(.+)/);
    return match ? match[1] : error.message;
  }
  return 'Ein unerwarteter Fehler ist aufgetreten';
}

export function ViolationsClient({ initialViolations }: ViolationsClientProps) {
  const [violations, setViolations] = useState(initialViolations || []);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingViolation, setEditingViolation] = useState<Violation | null>(null);
  const [deletingViolation, setDeletingViolation] = useState<Violation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data: CreateViolationInput | UpdateViolationInput) => {
    // Type guard to ensure we have CreateViolationInput
    if (!('key' in data)) return;

    setIsSubmitting(true);
    try {
      const created = await createViolation(data);
      toast.success('Verstoß erstellt');
      setCreateModalOpen(false);
      setViolations([...violations, created]);
    } catch (error) {
      toast.error(parseApiError(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (key: string, data: UpdateViolationInput) => {
    setIsSubmitting(true);
    try {
      const updated = await updateViolation(key, data);
      toast.success('Verstoß aktualisiert');
      setEditingViolation(null);
      setViolations(violations.map((v) => (v.key === updated.key ? updated : v)));
    } catch (error) {
      toast.error(parseApiError(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (key: string) => {
    setIsSubmitting(true);
    try {
      await deleteViolation(key);
      toast.success('Verstoß gelöscht');
      setDeletingViolation(null);
      setViolations(violations.filter((v) => v.key !== key));
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const grouped = {
    instantBan: violations.filter((v) => v.isInstantBan),
    twoPoints:  violations.filter((v) => !v.isInstantBan && v.basePoints === 2),
    onePoint:   violations.filter((v) => !v.isInstantBan && v.basePoints === 1),
    warnings:   violations.filter((v) => !v.isInstantBan && v.basePoints === 0),
  };

  return (
    <>
      <div className="space-y-6 animate-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-display text-2xl md:text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
              Verstöße
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Verstoßregeln und Eskalationsrichtlinien
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-primary w-full md:w-auto"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Neuer Verstoß
          </button>
        </div>

        {/* Groups */}
        {violations.length > 0 ? (
          <div className="space-y-4">
            {grouped.instantBan.length > 0 && (
              <ViolationGroup
                title="Sofort-Bann"
                count={grouped.instantBan.length}
                accentColor="var(--red)"
                accentBg="var(--red-bg)"
                violations={grouped.instantBan}
                onEdit={setEditingViolation}
                onDelete={setDeletingViolation}
              />
            )}
            {grouped.twoPoints.length > 0 && (
              <ViolationGroup
                title="2 Punkte"
                count={grouped.twoPoints.length}
                accentColor="var(--purple)"
                accentBg="var(--purple-bg)"
                violations={grouped.twoPoints}
                onEdit={setEditingViolation}
                onDelete={setDeletingViolation}
              />
            )}
            {grouped.onePoint.length > 0 && (
              <ViolationGroup
                title="1 Punkt"
                count={grouped.onePoint.length}
                accentColor="var(--yellow)"
                accentBg="var(--yellow-bg)"
                violations={grouped.onePoint}
                onEdit={setEditingViolation}
                onDelete={setDeletingViolation}
              />
            )}
            {grouped.warnings.length > 0 && (
              <ViolationGroup
                title="Verwarnungen (0 Pkt.)"
                count={grouped.warnings.length}
                accentColor="var(--amber)"
                accentBg="var(--amber-bg)"
                violations={grouped.warnings}
                onEdit={setEditingViolation}
                onDelete={setDeletingViolation}
              />
            )}
          </div>
        ) : (
          <div
            className="rounded-lg p-12 text-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
              Noch keine Verstöße konfiguriert.
            </p>
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
              Ersten Verstoß erstellen
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      <CyberModal
        isOpen={createModalOpen}
        onClose={() => !isSubmitting && setCreateModalOpen(false)}
        title="Neuer Verstoß"
        maxWidth="lg"
      >
        <ViolationForm
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => setCreateModalOpen(false)}
        />
      </CyberModal>

      {/* Edit modal */}
      {editingViolation && (
        <CyberModal
          isOpen={true}
          onClose={() => !isSubmitting && setEditingViolation(null)}
          title="Verstoß bearbeiten"
          maxWidth="lg"
        >
          <ViolationForm
            mode="edit"
            initialData={editingViolation}
            onSubmit={(data) => handleUpdate(editingViolation.key, data as UpdateViolationInput)}
            onCancel={() => setEditingViolation(null)}
          />
        </CyberModal>
      )}

      {/* Delete confirm */}
      {deletingViolation && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => !isSubmitting && setDeletingViolation(null)}
          onConfirm={() => handleDelete(deletingViolation.key)}
          title="Verstoß löschen"
          message={`"${deletingViolation.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
          confirmLabel="Löschen"
          isLoading={isSubmitting}
        />
      )}
    </>
  );
}

function ViolationGroup({
  title,
  count,
  accentColor,
  accentBg,
  violations,
  onEdit,
  onDelete,
}: {
  title: string;
  count: number;
  accentColor: string;
  accentBg: string;
  violations: Violation[];
  onEdit: (v: Violation) => void;
  onDelete: (v: Violation) => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
    >
      {/* Group header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
          <h2 className="text-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: accentBg, color: accentColor, fontFamily: 'var(--font-mono)' }}
        >
          {count}
        </span>
      </div>

      {/* Rows */}
      <div>
        {violations.map((v, idx) => (
          <ViolationRow
            key={v.key}
            violation={v}
            isLast={idx === violations.length - 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function ViolationRow({
  violation: v,
  isLast,
  onEdit,
  onDelete,
}: {
  violation: Violation;
  isLast: boolean;
  onEdit: (v: Violation) => void;
  onDelete: (v: Violation) => void;
}) {
  const escalationText =
    v.escalateAfter > 0 && v.escalatePoints > 0
      ? `${v.escalateAfter}× → +${v.escalatePoints}pts`
      : null;

  const pointsDisplay = v.isInstantBan ? 'BAN' : `${v.basePoints} Pkt.`;

  return (
    <div
      className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 transition-colors"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {v.name}
          </span>
          <code
            className="text-[11px] px-1.5 py-0.5 rounded"
            style={{ background: 'var(--amber-bg)', color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}
          >
            {v.key}
          </code>
          {/* Points badge - visible on mobile */}
          <span
            className="md:hidden text-xs font-bold px-2 py-0.5 rounded"
            style={{ 
              background: v.isInstantBan ? 'var(--red-bg)' : v.basePoints >= 2 ? 'var(--purple-bg)' : v.basePoints === 1 ? 'var(--yellow-bg)' : 'var(--amber-bg)',
              color: v.isInstantBan ? 'var(--red)' : v.basePoints >= 2 ? 'var(--purple)' : v.basePoints === 1 ? 'var(--yellow)' : 'var(--amber)',
              fontFamily: 'var(--font-mono)' 
            }}
          >
            {pointsDisplay}
          </span>
        </div>
        {v.description && (
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{v.description}</p>
        )}
        {v.category.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {v.category.map((cat) => (
              <span key={cat} className="badge badge-neutral">{cat}</span>
            ))}
          </div>
        )}
      </div>

      {/* Metadata - horizontal scroll on mobile */}
      <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 md:shrink-0">
        {escalationText && (
          <div className="text-center shrink-0">
            <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eskalation</div>
            <div className="text-xs font-medium" style={{ color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>{escalationText}</div>
          </div>
        )}

        <div className="flex gap-1.5 shrink-0">
          {v.autoTimeout && (
            <span
              className="text-[11px] px-2.5 py-1 rounded whitespace-nowrap"
              title={`Auto-timeout: ${v.autoTimeout}`}
              style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}
            >
              ⏱ {v.autoTimeout}
            </span>
          )}
          {v.autoTempban && (
            <span
              className="text-[11px] px-2.5 py-1 rounded whitespace-nowrap"
              title={`Auto-tempban: ${v.autoTempban}`}
              style={{ background: 'var(--red-bg)', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}
            >
              🔨 {v.autoTempban}
            </span>
          )}
          {v.requireEvidence && (
            <span
              className="text-[11px] px-2.5 py-1 rounded"
              title="Evidence required"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)', fontFamily: 'var(--font-mono)' }}
            >
              📎
            </span>
          )}
        </div>
      </div>

      {/* Actions - full width on mobile */}
      <div className="flex gap-2 md:gap-1.5 w-full md:w-auto">
        <button
          onClick={() => onEdit(v)}
          className="btn btn-ghost text-xs py-1 px-3 flex-1 md:flex-initial"
        >
          Bearbeiten
        </button>
        <button
          onClick={() => onDelete(v)}
          className="btn btn-danger text-xs py-1 px-3 flex-1 md:flex-initial"
        >
          Löschen
        </button>
      </div>
    </div>
  );
}
