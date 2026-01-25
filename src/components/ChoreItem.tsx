import { useState } from 'react';
import { format } from 'date-fns';
import type { ChoreWithStatus, User, Completion } from '../lib/types';
import './ChoreItem.css';

interface ChoreItemProps {
  chore: ChoreWithStatus;
  users: Map<string, User>;
  currentUserId: string;
  completionHistory: Completion[];
  onMarkDone: (choreId: string) => void;
  onEdit: (chore: ChoreWithStatus) => void;
  onSkip: (choreId: string) => void;
  onDeleteCompletion: (completionId: string) => void;
}

export function ChoreItem({
  chore,
  users,
  currentUserId,
  completionHistory,
  onMarkDone,
  onEdit,
  onSkip,
  onDeleteCompletion
}: ChoreItemProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = () => {
    switch (chore.status) {
      case 'comfortable':
        return 'status-comfortable';
      case 'due-soon':
        return 'status-due-soon';
      case 'overdue':
        return 'status-overdue';
      case 'severely-overdue':
        return 'status-severely-overdue';
      default:
        return '';
    }
  };

  const getLastDoneText = () => {
    if (!chore.lastCompletion) {
      return 'Never done';
    }

    const date = format(chore.lastCompletion.completedAt.toDate(), 'MMM d');
    const completedByUsers = chore.lastCompletion.completedBy;

    if (chore.lastCompletion.collaborative) {
      return `Together, ${date}`;
    }

    if (completedByUsers.length === 1) {
      const userId = completedByUsers[0];
      if (userId === currentUserId) {
        return `You, ${date}`;
      }
      const user = users.get(userId);
      return `${user?.displayName?.split(' ')[0] || 'Partner'}, ${date}`;
    }

    return `${date}`;
  };

  const getCompletedByText = (completion: Completion) => {
    if (completion.collaborative) {
      return 'Together';
    }
    return completion.completedBy.map(id => {
      if (id === currentUserId) return 'You';
      const user = users.get(id);
      return user?.displayName?.split(' ')[0] || 'Unknown';
    }).join(', ');
  };

  const isCompleted = chore.isOneTime && chore.lastCompletion;

  return (
    <div className={`chore-item ${isCompleted ? 'chore-completed' : ''} ${expanded ? 'expanded' : ''}`}>
      <div className="chore-main" onClick={() => setExpanded(!expanded)}>
        <div className={`chore-status-indicator ${getStatusColor()}`} />
        <div className="chore-info">
          <span className="chore-name">{chore.name}</span>
          <span className="chore-last-done">{getLastDoneText()}</span>
        </div>
        <span className={`chore-status-text ${getStatusColor()}`}>
          {chore.statusText}
        </span>
        <span className={`chore-expand-icon ${expanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      <div className="chore-actions">
        <button
          className="edit-button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(chore);
          }}
          title="Edit chore"
        >
          ✎
        </button>
        {chore.status === 'severely-overdue' && (
          <button
            className="skip-button"
            onClick={(e) => {
              e.stopPropagation();
              onSkip(chore.id);
            }}
          >
            Skip
          </button>
        )}
        {!isCompleted && (
          <button
            className="done-button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkDone(chore.id);
            }}
          >
            Done
          </button>
        )}
      </div>

      {expanded && (
        <div className="chore-history">
          <div className="history-header">
            <span>History</span>
            <span className="history-count">{completionHistory.length} entries</span>
          </div>
          {completionHistory.length === 0 ? (
            <p className="history-empty">No history yet</p>
          ) : (
            <ul className="history-list">
              {completionHistory.map((completion) => (
                <li key={completion.id}>
                  <span className="history-date">
                    {format(completion.completedAt.toDate(), 'MMM d, yyyy')}
                  </span>
                  <span className="history-who">
                    {getCompletedByText(completion)}
                  </span>
                  <button
                    className="history-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCompletion(completion.id);
                    }}
                    title="Delete this entry"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
