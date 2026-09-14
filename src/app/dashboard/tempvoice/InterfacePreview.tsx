'use client';

import { useState, type ReactNode } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCanWrite } from './WriteAccess';
import type { ActionMeta } from './types';

export type { ActionMeta };

interface InterfacePreviewProps {
  enabledActions: string[];
  actions: ActionMeta[];
  onChange: (next: string[]) => void;
  /** Rendered above the button grid — the embed mock on the interface editor. */
  header?: ReactNode;
}

/**
 * One tile in the active grid.
 *
 * The drag handle is its own element rather than the whole tile: with the listeners on the
 * tile, every click had to be distinguished from a drag by distance, and a slightly shaky
 * click toggled nothing while a careful drag sometimes toggled.
 */
function SortableAction({ action, meta, onDisable, canWrite }: {
  action: string; meta?: ActionMeta; onDisable: () => void; canWrite: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action,
    disabled: !canWrite,
  });

  return (
    <div
      ref={setNodeRef}
      className="relative flex flex-col items-center justify-center gap-0.5 rounded py-2 px-1 select-none"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: '#383a40',
        border: '1px solid #4e5058',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {canWrite && (
        <span
          {...attributes}
          {...listeners}
          title="Ziehen zum Sortieren"
          className="absolute top-0.5 left-0.5 text-[9px] leading-none cursor-grab active:cursor-grabbing px-0.5"
          style={{ color: '#6d6f78' }}
        >
          ⠿
        </span>
      )}
      {canWrite && (
        <button
          onClick={onDisable}
          title="Deaktivieren"
          className="absolute top-0.5 right-0.5 text-[9px] leading-none px-0.5"
          style={{ color: '#6d6f78' }}
        >
          ✕
        </button>
      )}
      <span className="text-sm leading-none">{meta?.previewIcon ?? '•'}</span>
      <span className="text-[8px] font-semibold uppercase text-center leading-tight" style={{ color: '#dbdee1' }}>
        {meta?.label ?? action}
      </span>
    </div>
  );
}

/** A tile in the greyed-out row below the grid, waiting to be put back. */
function DisabledAction({ action, meta, onEnable, canWrite }: {
  action: string; meta?: ActionMeta; onEnable: () => void; canWrite: boolean;
}) {
  return (
    <button
      onClick={onEnable}
      disabled={!canWrite}
      title={canWrite ? 'Aktivieren' : undefined}
      className="flex flex-col items-center justify-center gap-0.5 rounded py-2 px-1 select-none"
      style={{ background: '#2b2d31', border: '1px dashed #4e5058', opacity: 0.55 }}
    >
      <span className="text-sm leading-none">{meta?.previewIcon ?? '•'}</span>
      <span className="text-[8px] font-semibold uppercase text-center leading-tight" style={{ color: '#949ba4' }}>
        {meta?.label ?? action}
      </span>
    </button>
  );
}

/**
 * The button layout editor: active buttons in a sortable 5-wide grid, disabled ones parked in
 * a separate row underneath.
 *
 * Keeping the two sets apart is what makes the grid honest — it is the panel as Discord will
 * lay it out, five per row, so a disabled tile sitting in it would put every following button
 * one slot off from where it really lands.
 */
export function InterfacePreview({ enabledActions, actions, onChange, header }: InterfacePreviewProps) {
  const canWrite = useCanWrite();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [dragging, setDragging] = useState(false);

  const metaByKey = new Map(actions.map((a) => [a.key, a]));
  const known = enabledActions.filter((a) => metaByKey.has(a));
  const disabled = actions.map((a) => a.key).filter((k) => !known.includes(k));

  if (actions.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center text-xs" style={{ background: '#2b2d31', border: '1px solid #1e1f22', color: '#949ba4' }}>
        Buttons werden geladen …
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = known.indexOf(String(active.id));
    const to = known.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onChange(arrayMove(known, from, to));
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#2b2d31', border: '1px solid #1e1f22' }}>
      {header}

      <div className="p-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => setDragging(true)}
          onDragCancel={() => setDragging(false)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={known} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-5 gap-1.5">
              {known.map((action) => (
                <SortableAction
                  key={action}
                  action={action}
                  meta={metaByKey.get(action)}
                  canWrite={canWrite}
                  onDisable={() => onChange(known.filter((a) => a !== action))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {known.length === 0 && (
          <p className="text-[11px] text-center py-4" style={{ color: '#949ba4' }}>
            Keine Buttons aktiv — das Panel zeigt dann nur den Embed.
          </p>
        )}

        {disabled.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-3 mb-1.5">
              <div className="h-px flex-1" style={{ background: '#1e1f22' }} />
              <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#6d6f78' }}>Deaktiviert</span>
              <div className="h-px flex-1" style={{ background: '#1e1f22' }} />
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {disabled.map((action) => (
                <DisabledAction
                  key={action}
                  action={action}
                  meta={metaByKey.get(action)}
                  canWrite={canWrite}
                  onEnable={() => onChange([...known, action])}
                />
              ))}
            </div>
          </>
        )}

        {canWrite && (
          <p className="text-[10px] mt-2.5 text-center" style={{ color: '#6d6f78' }}>
            {dragging ? 'Loslassen zum Ablegen' : '⠿ ziehen zum Sortieren · ✕ deaktivieren · unten klicken zum Aktivieren'}
          </p>
        )}
      </div>
    </div>
  );
}
