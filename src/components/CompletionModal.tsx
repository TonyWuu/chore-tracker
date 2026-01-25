import { useState } from 'react';
import { format } from 'date-fns';
import './CompletionModal.css';

export type CompletedByOption = 'me' | 'partner' | 'together';

interface CompletionModalProps {
  choreName: string;
  partnerName?: string;
  onComplete: (completedBy: CompletedByOption, completedAt?: Date) => void;
  onClose: () => void;
}

export function CompletionModal({ choreName, partnerName, onComplete, onClose }: CompletionModalProps) {
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
        <div className="completion-options three-options">
          <button
            className="completion-option"
            onClick={() => handleComplete('me')}
          >
            <span className="option-icon">👤</span>
            <span className="option-text">Me</span>
          </button>
          {partnerName && (
            <button
              className="completion-option partner"
              onClick={() => handleComplete('partner')}
            >
              <span className="option-icon">👤</span>
              <span className="option-text">{partnerName}</span>
            </button>
          )}
          <button
            className="completion-option collaborative"
            onClick={() => handleComplete('together')}
          >
            <span className="option-icon">👥</span>
            <span className="option-text">Together</span>
          </button>
        </div>
        <button className="completion-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
