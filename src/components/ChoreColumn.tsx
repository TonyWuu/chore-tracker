import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import type { ChoreWithStatus, User, Completion } from '../lib/types';
import './ChoreColumn.css';

// Map category names to cute emojis
function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase();

  // Kitchen & cooking
  if (lower.includes('kitchen') || lower.includes('cook') || lower.includes('dish')) return '🍳';
  if (lower.includes('food') || lower.includes('grocer') || lower.includes('meal')) return '🛒';

  // Cleaning
  if (lower.includes('clean') || lower.includes('tidy')) return '✨';
  if (lower.includes('laundry') || lower.includes('wash') || lower.includes('cloth')) return '👕';
  if (lower.includes('vacuum') || lower.includes('floor') || lower.includes('mop')) return '🧹';
  if (lower.includes('trash') || lower.includes('garbage') || lower.includes('bin')) return '🗑️';
  if (lower.includes('bathroom') || lower.includes('toilet') || lower.includes('shower')) return '🚿';

  // Outdoors & garden
  if (lower.includes('garden') || lower.includes('plant') || lower.includes('water')) return '🌱';
  if (lower.includes('lawn') || lower.includes('yard') || lower.includes('grass')) return '🌿';
  if (lower.includes('outdoor') || lower.includes('outside')) return '🏡';

  // Pets
  if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat') || lower.includes('animal')) return '🐾';
  if (lower.includes('fish') || lower.includes('aquarium')) return '🐠';

  // Home maintenance
  if (lower.includes('repair') || lower.includes('fix') || lower.includes('maintain')) return '🔧';
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('auto')) return '🚗';

  // Organization & admin
  if (lower.includes('bill') || lower.includes('pay') || lower.includes('finance')) return '💳';
  if (lower.includes('mail') || lower.includes('letter') || lower.includes('package')) return '📬';
  if (lower.includes('organiz') || lower.includes('sort') || lower.includes('declutter')) return '📦';

  // Health & self-care
  if (lower.includes('health') || lower.includes('medic') || lower.includes('doctor')) return '💊';
  if (lower.includes('exercise') || lower.includes('workout') || lower.includes('gym')) return '💪';

  // Bedroom
  if (lower.includes('bed') || lower.includes('sheet') || lower.includes('bedroom')) return '🛏️';

  // Shopping & errands
  if (lower.includes('shop') || lower.includes('buy') || lower.includes('errand')) return '🛍️';

  // Weekly/monthly/seasonal
  if (lower.includes('week')) return '📅';
  if (lower.includes('month')) return '🗓️';
  if (lower.includes('season') || lower.includes('annual') || lower.includes('year')) return '🔄';

  // Misc common ones
  if (lower.includes('office') || lower.includes('work') || lower.includes('desk')) return '💼';
  if (lower.includes('living') || lower.includes('lounge') || lower.includes('room')) return '🛋️';

  // Default cute emojis based on first letter for variety
  const defaults = ['🏠', '⭐', '💫', '🌟', '✅', '📌', '🎯', '💡'];
  const index = lower.charCodeAt(0) % defaults.length;
  return defaults[index];
}

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
  onRenameColumn?: (newName: string) => void;
  isCompleted?: boolean;
  collapseSignal?: number;
  dragHandleProps?: Record<string, unknown>;
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
  onRenameColumn,
  isCompleted = false,
  collapseSignal = 0,
  dragHandleProps
}: ChoreColumnProps) {
  const [expandedChoreIds, setExpandedChoreIds] = useState<Set<string>>(new Set());

  // Collapse all when signal changes (background was clicked)
  useEffect(() => {
    if (collapseSignal > 0) {
      setExpandedChoreIds(new Set());
    }
  }, [collapseSignal]);

  const toggleExpanded = (choreId: string) => {
    setExpandedChoreIds(prev => {
      const next = new Set(prev);
      if (next.has(choreId)) {
        next.delete(choreId);
      } else {
        next.add(choreId);
      }
      return next;
    });
  };
  const [editingCompletionId, setEditingCompletionId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const emoji = useMemo(() => getCategoryEmoji(title), [title]);

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
      case 'never-done':
        return 'status-never-done';
      default:
        return '';
    }
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
        {dragHandleProps && (
          <div className="column-drag-handle" {...dragHandleProps}>
            ⋮⋮
          </div>
        )}
        <div className="column-title-row">
          {isEditingTitle && onRenameColumn ? (
            <input
              type="text"
              className="column-title-input"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => {
                if (editedTitle.trim() && editedTitle.trim() !== title) {
                  onRenameColumn(editedTitle.trim());
                } else {
                  setEditedTitle(title);
                }
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editedTitle.trim() && editedTitle.trim() !== title) {
                    onRenameColumn(editedTitle.trim());
                  } else {
                    setEditedTitle(title);
                  }
                  setIsEditingTitle(false);
                } else if (e.key === 'Escape') {
                  setEditedTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h3
              className={`column-title ${onRenameColumn ? 'editable' : ''}`}
              onClick={() => {
                if (onRenameColumn) {
                  setEditedTitle(title);
                  setIsEditingTitle(true);
                }
              }}
              title={onRenameColumn ? 'Click to rename' : undefined}
            >
              <span className="column-emoji">{emoji}</span>
              {title}
            </h3>
          )}
        </div>
        <div className="column-actions">
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
                >
                  Delete
                </button>
                <button
                  className="column-delete-no"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="column-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete"
              >
                ×
              </button>
            )
          )}
        </div>
      </div>

      <div className="column-items">
        {chores.map((chore) => {
          const isExpanded = expandedChoreIds.has(chore.id);
          const completionHistory = getCompletionHistory(chore.id);
          const choreCompleted = chore.isOneTime && chore.lastCompletion;

          return (
            <div
              key={chore.id}
              className={`column-item ${isExpanded ? 'expanded' : ''} ${choreCompleted ? 'item-completed' : ''}`}
            >
              <div
                className="item-main"
                onClick={() => toggleExpanded(chore.id)}
              >
                <div className={`item-status ${getStatusColor(chore.status)}`} />
                <div className="item-content">
                  <span className="item-name">{chore.name}</span>
                </div>
                <span className={`item-status-text ${getStatusColor(chore.status)}`}>
                  {chore.statusText}
                  {chore.lastCompletion && chore.daysSinceLastDone >= 1 && (
                    <span className="item-status-date">
                      {' · '}{format(chore.lastCompletion.completedAt.toDate(), 'MMM d')}
                    </span>
                  )}
                </span>
              </div>

              {isExpanded && (
                <div className="item-details">
                  {chore.lastCompletion && !chore.isOneTime && (
                    <p className="item-next-due">
                      Next due:{' '}
                      {(() => {
                        const lastDone = chore.lastCompletion.completedAt.toDate();
                        const nextDue = new Date(lastDone);
                        nextDue.setDate(nextDue.getDate() + chore.maxDays);
                        return format(nextDue, 'MMM d, yyyy');
                      })()}
                    </p>
                  )}
                  {!chore.lastCompletion && !chore.isOneTime && (
                    <p className="item-next-due">
                      Due every {chore.maxDays} days
                    </p>
                  )}
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
