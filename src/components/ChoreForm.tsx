import { useState, useEffect } from 'react';
import type { ChoreWithStatus, Completion } from '../lib/types';
import { format } from 'date-fns';
import './ChoreForm.css';

interface ChoreFormProps {
  chore?: ChoreWithStatus | null;
  completionHistory?: Completion[];
  completionCount?: number;
  onSave: (name: string, minDays: number, maxDays: number, isOneTime: boolean) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ChoreForm({
  chore,
  completionHistory = [],
  completionCount = 0,
  onSave,
  onDelete,
  onClose
}: ChoreFormProps) {
  const [name, setName] = useState(chore?.name || '');
  const [minDays, setMinDays] = useState(chore?.minDays || 7);
  const [maxDays, setMaxDays] = useState(chore?.maxDays || 14);
  const [isOneTime, setIsOneTime] = useState(chore?.isOneTime || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (chore) {
      setName(chore.name);
      setMinDays(chore.minDays);
      setMaxDays(chore.maxDays);
      setIsOneTime(chore.isOneTime);
    }
  }, [chore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalMinDays = isOneTime ? 0 : minDays;
    const finalMaxDays = isOneTime ? 0 : Math.max(minDays, maxDays);

    onSave(name.trim(), finalMinDays, finalMaxDays, isOneTime);
  };

  const handleDelete = () => {
    if (showDeleteConfirm && onDelete) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const isEditing = !!chore;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Chore' : 'Add Chore'}</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Chore Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vacuum living room"
              autoFocus
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isOneTime}
                onChange={(e) => setIsOneTime(e.target.checked)}
              />
              One-time task (not recurring)
            </label>
          </div>

          {!isOneTime && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minDays">Minimum Days</label>
                <input
                  type="number"
                  id="minDays"
                  value={minDays}
                  onChange={(e) => setMinDays(parseInt(e.target.value) || 1)}
                  min="1"
                />
                <span className="helper-text">OK to wait this long</span>
              </div>

              <div className="form-group">
                <label htmlFor="maxDays">Maximum Days</label>
                <input
                  type="number"
                  id="maxDays"
                  value={maxDays}
                  onChange={(e) => setMaxDays(parseInt(e.target.value) || 1)}
                  min={minDays}
                />
                <span className="helper-text">Overdue after this</span>
              </div>
            </div>
          )}

          {isEditing && completionHistory.length > 0 && (
            <div className="history-section">
              <h3>Recent History</h3>
              <ul className="history-list">
                {completionHistory.slice(0, 5).map((completion) => (
                  <li key={completion.id}>
                    <span className="history-date">
                      {format(completion.completedAt.toDate(), 'MMM d, yyyy')}
                    </span>
                    <span className="history-who">
                      {completion.collaborative ? 'Together' : 'Solo'}
                    </span>
                  </li>
                ))}
              </ul>
              {completionHistory.length > 5 && (
                <p className="history-more">
                  +{completionHistory.length - 5} more entries
                </p>
              )}
            </div>
          )}

          <div className="form-actions">
            {isEditing && onDelete && (
              <button
                type="button"
                className={`delete-button ${showDeleteConfirm ? 'confirm' : ''}`}
                onClick={handleDelete}
              >
                {showDeleteConfirm
                  ? `Delete ${completionCount} records?`
                  : 'Delete'}
              </button>
            )}
            <div className="form-actions-right">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-button">
                {isEditing ? 'Save' : 'Add Chore'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
