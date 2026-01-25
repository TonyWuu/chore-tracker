import { useState } from 'react';
import { format } from 'date-fns';
import './CompletionModal.css';

interface CompletionModalProps {
  choreName: string;
  onComplete: (collaborative: boolean, completedAt?: Date) => void;
  onClose: () => void;
}

export function CompletionModal({ choreName, onComplete, onClose }: CompletionModalProps) {
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

  const handleComplete = (collaborative: boolean) => {
    if (dateMode === 'now') {
      onComplete(collaborative);
    } else {
      const date = new Date(customDate + 'T12:00:00');
      onComplete(collaborative, date);
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

        <p>Did you do this alone or together?</p>
        <div className="completion-options">
          <button
            className="completion-option"
            onClick={() => handleComplete(false)}
          >
            <span className="option-icon">👤</span>
            <span className="option-text">Just me</span>
          </button>
          <button
            className="completion-option collaborative"
            onClick={() => handleComplete(true)}
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
