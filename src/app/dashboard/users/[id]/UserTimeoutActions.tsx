'use client';

import { useState } from 'react';
import { TimeoutModal } from '@/components/TimeoutModal';

interface UserTimeoutActionsProps {
  userId: string;
  username: string;
  activeTimeout: { expiresAt: string } | null;
}

export function UserTimeoutActions({ userId, username, activeTimeout }: UserTimeoutActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [localTimeout, setLocalTimeout] = useState(activeTimeout);

  const isActive = localTimeout && new Date(localTimeout.expiresAt) > new Date();

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/moderation/timeout/${userId}`, { method: 'DELETE' });
      if (res.ok) setLocalTimeout(null);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-3">
      {isActive && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ background: 'rgba(254,231,92,0.15)', color: 'var(--amber)', border: '1px solid rgba(254,231,92,0.4)' }}
        >
          ⏱️ Timeout bis {new Date(localTimeout!.expiresAt).toLocaleString('de-DE')}
        </span>
      )}
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ background: 'rgba(254,231,92,0.15)', color: 'var(--amber)', border: '1px solid rgba(254,231,92,0.4)' }}
      >
        ⏱️ Timeout verhängen
      </button>
      {isActive && (
        <button
          onClick={handleRemove}
          disabled={removing}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(237,66,69,0.15)', color: 'var(--red)', border: '1px solid rgba(237,66,69,0.4)', opacity: removing ? 0.7 : 1 }}
        >
          {removing ? 'Wird aufgehoben…' : '✕ Timeout aufheben'}
        </button>
      )}
      {showModal && (
        <TimeoutModal
          userId={userId}
          username={username}
          onClose={() => setShowModal(false)}
          onSuccess={(expiresAt) => setLocalTimeout({ expiresAt })}
        />
      )}
    </div>
  );
}
