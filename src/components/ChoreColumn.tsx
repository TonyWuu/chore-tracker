import { useState } from 'react';
import { format, addDays } from 'date-fns';
import type { ChoreWithStatus, User, Completion } from '../lib/types';
import './ChoreColumn.css';

interface ChoreColumnProps {
  title: string;
  chores: ChoreWithStatus[];
  users: Map<string, User>;
  currentUserId: string;
  getCompletionHistory: (choreId: string) => Completion[];
  onMarkDone: (choreId: string) => void;
  onEdit: (chore: ChoreWithStatus) => void;
  onSkip: (choreId: string) => void;
  onDeleteCompletion: (completionId: string) => void;
  onUpdateCompletionDate: (completionId: string, newDate: Date) => void;
  onAddItem?: () => void;
  onDeleteColumn?: () => void;
  isCompleted?: boolean;
}

export function ChoreColumn({
  title,
  chores,
  users,
  currentUserId,
  getCompletionHistory,
  onMarkDone,
  onEdit,
  onSkip,
  onDeleteCompletion,
  onUpdateCompletionDate,
  onAddItem,
  onDeleteColumn,
  isCompleted = false
}: ChoreColumnProps) {
  const [expandedChoreId, setExpandedChoreId] = useState<string | null>(null);
  const [editingCompletionId, setEditingCompletionId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusColor = (status: ChoreWithStatus['status']) => {
    switch (status) {
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

  const getLastDoneText = (chore: ChoreWithStatus) => {
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

    return date;
  };

  const getNextDueDate = (chore: ChoreWithStatus) => {
    if (chore.isOneTime) return null;

    const lastDoneDate = chore.lastCompletion
      ? chore.lastCompletion.completedAt.toDate()
      : chore.createdAt.toDate();

    const dueDate = addDays(lastDoneDate, chore.maxDays);
    return format(dueDate, 'MMM d');
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

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className={`chore-column ${isCompleted ? 'completed' : ''}`}>
      <div className="column-header">
        <h3 className="column-title">{title}</h3>
        <div className="column-header-right">
          <span className="column-count">{chores.length}</span>
          {onAddItem && (
            <button className="column-add-btn" onClick={onAddItem} title="Add task">
              +
            </button>
          )}
          {onDeleteColumn && (
            showDeleteConfirm ? (
              <div className="column-delete-confirm">
                <button
                  className="column-delete-yes"
                  onClick={() => {
                    onDeleteColumn();
                    setShowDeleteConfirm(false);
                  }}
                  title="Confirm delete"
                >
                  Yes
                </button>
                <button
                  className="column-delete-no"
                  onClick={() => setShowDeleteConfirm(false)}
                  title="Cancel"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                className="column-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete chore"
              >
                &times;
              </button>
            )
          )}
        </div>
      </div>

      <div className="column-items">
        {chores.map((chore) => {
          const isExpanded = expandedChoreId === chore.id;
          const completionHistory = getCompletionHistory(chore.id);
          const nextDueDate = getNextDueDate(chore);
          const choreCompleted = chore.isOneTime && chore.lastCompletion;

          return (
            <div
              key={chore.id}
              className={`column-item ${isExpanded ? 'expanded' : ''} ${choreCompleted ? 'item-completed' : ''}`}
            >
              <div
                className="item-main"
                onClick={() => setExpandedChoreId(isExpanded ? null : chore.id)}
              >
                <div className={`item-status ${getStatusColor(chore.status)}`} />
                <div className="item-content">
                  <span className="item-name">{chore.name}</span>
                  <span className="item-meta">
                    {getLastDoneText(chore)}
                    {nextDueDate && <span className="item-due"> · Due {nextDueDate}</span>}
                  </span>
                </div>
                <span className={`item-status-text ${getStatusColor(chore.status)}`}>
                  {chore.statusText}
                </span>
              </div>

              {isExpanded && (
                <div className="item-details">
                  <div className="item-actions">
                    <button
                      className="action-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(chore);
                      }}
                    >
                      Edit
                    </button>
                    {chore.status === 'severely-overdue' && (
                      <button
                        className="action-btn skip"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSkip(chore.id);
                        }}
                      >
                        Skip
                      </button>
                    )}
                    {!choreCompleted && (
                      <button
                        className="action-btn done"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkDone(chore.id);
                        }}
                      >
                        Done
                      </button>
                    )}
                  </div>

                  <div className="item-history">
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
