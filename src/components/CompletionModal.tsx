import './CompletionModal.css';

interface CompletionModalProps {
  choreName: string;
  onComplete: (collaborative: boolean) => void;
  onClose: () => void;
}

export function CompletionModal({ choreName, onComplete, onClose }: CompletionModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="completion-modal" onClick={(e) => e.stopPropagation()}>
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
