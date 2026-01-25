import { useState } from 'react';
import './CompletionModal.css';

interface CompletionModalProps {
  choreName: string;
  onComplete: (collaborative: boolean) => void;
  onClose: () => void;
}

export function CompletionModal({ choreName, onComplete, onClose }: CompletionModalProps) {
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);

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
      <div className="completion-modal" onMouseDown={() => setMouseDownOnOverlay(false)}>
        <h3>Mark "{choreName}" as done</h3>
        <p>Did you do this alone or together?</p>
        <div className="completion-options">
          <button
            className="completion-option"
            onClick={() => onComplete(false)}
          >
            <span className="option-icon">👤</span>
            <span className="option-text">Just me</span>
          </button>
          <button
            className="completion-option collaborative"
            onClick={() => onComplete(true)}
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
