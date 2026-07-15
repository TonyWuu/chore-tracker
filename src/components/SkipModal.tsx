import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useEscape } from '../hooks/useEscape';
import './SkipModal.css';

interface SkipModalProps {
  choreName: string;
  onResetFully: () => void;
  onSnoozeUntil: (date: Date) => void;
  onClose: () => void;
}

export function SkipModal({ choreName, onResetFully, onSnoozeUntil, onClose }: SkipModalProps) {
  const [selectedDate, setSelectedDate] = useState(
    format(addDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);

  useEscape(onClose);

  const handleSnooze = () => {
    onSnoozeUntil(new Date(selectedDate + 'T12:00:00'));
  };

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

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div
        className="skip-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skip-modal-title"
        onMouseDown={() => setMouseDownOnOverlay(false)}
      >
        <h3 id="skip-modal-title">Reset or snooze “{choreName}”?</h3>
        <p>This chore is severely overdue. What would you like to do?</p>

        <div className="skip-options">
          <button className="skip-option reset" onClick={onResetFully}>
            <span className="skip-option-title">Reset fully</span>
            <span className="skip-option-desc">
              Start fresh as if you just did it
            </span>
          </button>

          <div className="skip-option snooze">
            <span className="skip-option-title">Snooze until</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              aria-label="Snooze until date"
            />
            <button className="snooze-button" onClick={handleSnooze}>
              Snooze
            </button>
          </div>
        </div>

        <button className="skip-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
