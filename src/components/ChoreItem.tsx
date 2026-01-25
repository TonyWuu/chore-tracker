import { format } from 'date-fns';
import type { ChoreWithStatus, User } from '../lib/types';
import './ChoreItem.css';

interface ChoreItemProps {
  chore: ChoreWithStatus;
  users: Map<string, User>;
  currentUserId: string;
  onMarkDone: (choreId: string) => void;
  onEdit: (chore: ChoreWithStatus) => void;
  onSkip: (choreId: string) => void;
}

export function ChoreItem({
  chore,
  users,
  currentUserId,
  onMarkDone,
  onEdit,
  onSkip
}: ChoreItemProps) {
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

  const isCompleted = chore.isOneTime && chore.lastCompletion;

  return (
    <div className={`chore-item ${isCompleted ? 'chore-completed' : ''}`}>
      <div className="chore-main" onClick={() => onEdit(chore)}>
        <div className={`chore-status-indicator ${getStatusColor()}`} />
        <div className="chore-info">
          <span className="chore-name">{chore.name}</span>
          <span className="chore-last-done">{getLastDoneText()}</span>
        </div>
        <span className={`chore-status-text ${getStatusColor()}`}>
          {chore.statusText}
        </span>
      </div>
      <div className="chore-actions">
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
    </div>
  );
}
