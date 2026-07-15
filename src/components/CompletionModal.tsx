import { useState } from 'react';
import { format } from 'date-fns';
import type { User } from '../lib/types';
import { useEscape } from '../hooks/useEscape';
import './CompletionModal.css';

export type CompletedByOption = { type: 'user'; userId: string } | { type: 'together' };

interface CompletionModalProps {
  choreName: string;
  users: Map<string, User>;
  currentUserId: string;
  onComplete: (completedBy: CompletedByOption, completedAt?: Date) => void;
  onClose: () => void;
}

function Avatar({ user, size = 'md' }: { user?: User; size?: 'md' | 'sm' }) {
  const cls = `option-avatar ${size === 'sm' ? 'option-avatar-sm' : ''}`;
  if (user?.photoURL) {
    return <img className={cls} src={user.photoURL} alt="" />;
  }
  return (
    <span className={`${cls} option-avatar-fallback`} aria-hidden="true">
      {user?.displayName?.[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

export function CompletionModal({ choreName, users, currentUserId, onComplete, onClose }: CompletionModalProps) {
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);
  const [dateMode, setDateMode] = useState<'now' | 'custom'>('now');
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEscape(onClose);

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMouseDownOnOverlay(true);
    }
  };

  const handleOverlayMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownOnOverlay) {
      onClose();
    }
    setMouseDownOnOverlay(false);
  };

  const handleComplete = (completedBy: CompletedByOption) => {
    if (dateMode === 'now') {
      onComplete(completedBy);
    } else {
      const date = new Date(customDate + 'T12:00:00');
      onComplete(completedBy, date);
    }
  };

  // Current user first, then others alphabetically
  const sortedUsers = Array.from(users.entries()).sort(([idA, userA], [idB, userB]) => {
    if (idA === currentUserId) return -1;
    if (idB === currentUserId) return 1;
    return (userA.displayName || '').localeCompare(userB.displayName || '');
  });

  const currentUser = users.get(currentUserId);
  const partner = sortedUsers.find(([id]) => id !== currentUserId)?.[1];

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div
        className="completion-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-modal-title"
        onMouseDown={() => setMouseDownOnOverlay(false)}
      >
        <h3 id="completion-modal-title">Mark “{choreName}” as done</h3>

        <div className="completion-when">
          <span className="when-label">When?</span>
          <div className="when-options">
            <button
              className={`when-option ${dateMode === 'now' ? 'active' : ''}`}
              onClick={() => setDateMode('now')}
            >
              Now
            </button>
            <button
              className={`when-option ${dateMode === 'custom' ? 'active' : ''}`}
              onClick={() => setDateMode('custom')}
            >
              Other date
            </button>
          </div>
          {dateMode === 'custom' && (
            <input
              type="date"
              className="when-date-input"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          )}
        </div>

        <p>Who did this?</p>
        <div className="completion-options">
          {sortedUsers.map(([userId, user]) => (
            <button
              key={userId}
              className={`completion-option ${userId === currentUserId ? '' : 'other-user'}`}
              onClick={() => handleComplete({ type: 'user', userId })}
            >
              <Avatar user={user} />
              <span className="option-text">
                {userId === currentUserId ? 'Me' : user.displayName?.split(' ')[0] || 'Partner'}
              </span>
            </button>
          ))}
          {users.size > 1 && (
            <button
              className="completion-option collaborative"
              onClick={() => handleComplete({ type: 'together' })}
            >
              <span className="option-avatar-pair" aria-hidden="true">
                <Avatar user={currentUser} size="sm" />
                <Avatar user={partner} size="sm" />
              </span>
              <span className="option-text">Together</span>
            </button>
          )}
        </div>
        <button className="completion-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
