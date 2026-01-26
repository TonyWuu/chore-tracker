import { useState } from 'react';
import { format } from 'date-fns';
import type { User } from '../lib/types';
import './CompletionModal.css';

export type CompletedByOption = { type: 'user'; userId: string } | { type: 'together' };

interface CompletionModalProps {
  choreName: string;
  users: Map<string, User>;
  currentUserId: string;
  onComplete: (completedBy: CompletedByOption, completedAt?: Date) => void;
  onClose: () => void;
}

export function CompletionModal({ choreName, users, currentUserId, onComplete, onClose }: CompletionModalProps) {
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);
  const [dateMode, setDateMode] = useState<'now' | 'custom'>('now');
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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

  // Get sorted list of users (current user first, then others alphabetically)
  const sortedUsers = Array.from(users.entries()).sort(([idA, userA], [idB, userB]) => {
    if (idA === currentUserId) return -1;
    if (idB === currentUserId) return 1;
    return (userA.displayName || '').localeCompare(userB.displayName || '');
  });

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div className="completion-modal" onMouseDown={() => setMouseDownOnOverlay(false)}>
        <h3>Mark "{choreName}" as done</h3>

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
              <span className="option-icon">👤</span>
              <span className="option-text">
                {userId === currentUserId ? 'Me' : user.displayName?.split(' ')[0] || 'User'}
              </span>
            </button>
          ))}
          {users.size > 1 && (
            <button
              className="completion-option collaborative"
              onClick={() => handleComplete({ type: 'together' })}
            >
              <span className="option-icon">👥</span>
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
