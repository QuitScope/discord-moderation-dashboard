'use client';

import * as Dialog from '@radix-ui/react-dialog';

interface CyberModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthMap = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-7xl',
};

export function CyberModal({ isOpen, onClose, title, children, maxWidth = 'md' }: CyberModalProps) {
  const handleInteractOutside = (e: Event) => {
    // Don't close modal if clicking on emoji picker
    const target = e.target as HTMLElement;
    if (target.closest('em-emoji-picker') || target.tagName === 'EM-EMOJI-PICKER') {
      e.preventDefault();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content 
          className={`modal-content ${maxWidthMap[maxWidth]} w-full p-8`}
          onInteractOutside={handleInteractOutside}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '16px' }}>
            <Dialog.Title className="text-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </Dialog.Title>
            <Dialog.Close
              className="flex items-center justify-center w-7 h-7 rounded transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
