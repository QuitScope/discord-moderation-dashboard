'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { LoadingSpinner } from './LoadingSpinner';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content max-w-sm w-full p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--red-bg)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--red)' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <Dialog.Title className="text-display text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {title}
              </Dialog.Title>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-ghost text-sm"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="btn btn-danger text-sm flex items-center gap-2"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {confirmLabel}
            </button>
          </div>

          {/* Close button */}
          <Dialog.Close
            className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
