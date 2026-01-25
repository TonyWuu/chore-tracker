import { useState } from 'react';
import { format, addDays } from 'date-fns';
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
  onUpdateCompletionDate: (completionId: string, newDate: Date) => void;
}

export function ChoreItem({
  chore,
  users,
  currentUserId,
  completionHistory,
  onMarkDone,
  onEdit,
  onSkip,
  onDeleteCompletion,
  onUpdateCompletionDate
}: ChoreItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingCompletionId, setEditingCompletionId] = useState<string | null>(null);

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

  const getNextDueDate = () => {
    if (chore.isOneTime) return null;

    const lastDoneDate = chore.lastCompletion
      ? chore.lastCompletion.completedAt.toDate()
      : chore.createdAt.toDate();

    const dueDate = addDays(lastDoneDate, chore.maxDays);
    return format(dueDate, 'MMM d');
  };

  const isCompleted = chore.isOneTime && chore.lastCompletion;
  const nextDueDate = getNextDueDate();

  return (
    <div className={`chore-item ${isCompleted ? 'chore-completed' : ''} ${expanded ? 'expanded' : ''}`}>
      <div className="chore-main" onClick={() => setExpanded(!expanded)}>
        <div className={`chore-status-indicator ${getStatusColor()}`} />
        <div className="chore-info">
          <span className="chore-name">{chore.name}</span>
          <span className="chore-last-done">
            {getLastDoneText()}
            {nextDueDate && <span className="chore-due-date"> · Due {nextDueDate}</span>}
          </span>
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
              {completionHistory.map((completion) => {
                const isEditing = editingCompletionId === completion.id;
                const completionDate = completion.completedAt.toDate();

                const formatDateTimeLocal = (date: Date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  return `${year}-${month}-${day}T${hours}:${minutes}`;
                };

                return (
                  <li key={completion.id}>
                    {isEditing ? (
                      <input
                        type="datetime-local"
                        className="history-date-input"
                        defaultValue={formatDateTimeLocal(completionDate)}
                        onBlur={(e) => {
                          const newDate = new Date(e.target.value);
                          if (!isNaN(newDate.getTime())) {
                            onUpdateCompletionDate(completion.id, newDate);
                          }
                          setEditingCompletionId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newDate = new Date((e.target as HTMLInputElement).value);
                            if (!isNaN(newDate.getTime())) {
                              onUpdateCompletionDate(completion.id, newDate);
                            }
                            setEditingCompletionId(null);
                          } else if (e.key === 'Escape') {
                            setEditingCompletionId(null);
                          }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="history-date editable"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCompletionId(completion.id);
                        }}
                        title="Click to edit date"
                      >
                        {format(completionDate, 'MMM d, yyyy h:mm a')}
                      </span>
                    )}
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
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
