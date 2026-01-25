import { useMemo } from 'react';
import type { ChoreWithStatus, User, Completion } from '../lib/types';
import { ChoreItem } from './ChoreItem';
import './ChoreList.css';

interface ChoreListProps {
  chores: ChoreWithStatus[];
  users: Map<string, User>;
  currentUserId: string;
  getCompletionHistory: (choreId: string) => Completion[];
  onMarkDone: (choreId: string) => void;
  onEdit: (chore: ChoreWithStatus) => void;
  onSkip: (choreId: string) => void;
  onDeleteCompletion: (completionId: string) => void;
  onUpdateCompletionDate: (completionId: string, newDate: Date) => void;
  onAddChore: () => void;
}

export function ChoreList({
  chores,
  users,
  currentUserId,
  getCompletionHistory,
  onMarkDone,
  onEdit,
  onSkip,
  onDeleteCompletion,
  onUpdateCompletionDate,
  onAddChore
}: ChoreListProps) {
  const activeChores = chores.filter(c => !(c.isOneTime && c.lastCompletion));
  const completedOneTimes = chores.filter(c => c.isOneTime && c.lastCompletion);

  // Group active chores by category
  const groupedChores = useMemo(() => {
    const groups = new Map<string, ChoreWithStatus[]>();

    for (const chore of activeChores) {
      const category = chore.category || '';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(chore);
    }

    // Sort categories alphabetically, empty category (uncategorized) goes last
    const sortedCategories = Array.from(groups.keys()).sort((a, b) => {
      if (a === '') return 1;
      if (b === '') return -1;
      return a.localeCompare(b);
    });

    return sortedCategories.map(category => ({
      category,
      chores: groups.get(category)!
    }));
  }, [activeChores]);

  const renderChoreItem = (chore: ChoreWithStatus) => (
    <ChoreItem
      key={chore.id}
      chore={chore}
      users={users}
      currentUserId={currentUserId}
      completionHistory={getCompletionHistory(chore.id)}
      onMarkDone={onMarkDone}
      onEdit={onEdit}
      onSkip={onSkip}
      onDeleteCompletion={onDeleteCompletion}
      onUpdateCompletionDate={onUpdateCompletionDate}
    />
  );

  return (
    <div className="chore-list-container">
      <div className="chore-list">
        {activeChores.length === 0 && completedOneTimes.length === 0 ? (
          <div className="empty-state">
            <p>No chores yet!</p>
            <p className="empty-hint">Add your first chore to get started.</p>
          </div>
        ) : (
          <>
            {groupedChores.map(({ category, chores: categoryChores }) => (
              <div key={category || '__uncategorized__'} className="category-group">
                {category && (
                  <h3 className="category-title">{category}</h3>
                )}
                <div className="category-chores">
                  {categoryChores.map(renderChoreItem)}
                </div>
              </div>
            ))}
            {completedOneTimes.length > 0 && (
              <div className="category-group completed-group">
                <h3 className="category-title completed">Completed Tasks</h3>
                <div className="category-chores">
                  {completedOneTimes.map(renderChoreItem)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <button className="add-chore-button" onClick={onAddChore}>
        + Add Chore
      </button>
    </div>
  );
}
