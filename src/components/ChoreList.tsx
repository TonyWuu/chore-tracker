import { useMemo } from 'react';
import type { ChoreWithStatus, User, Completion } from '../lib/types';
import type { Category } from '../hooks/useCategories';
import { ChoreColumn } from './ChoreColumn';
import './ChoreList.css';

interface ChoreListProps {
  chores: ChoreWithStatus[];
  categories: Category[];
  users: Map<string, User>;
  currentUserId: string;
  getCompletionHistory: (choreId: string) => Completion[];
  onMarkDone: (choreId: string) => void;
  onEdit: (chore: ChoreWithStatus) => void;
  onSkip: (choreId: string) => void;
  onDeleteCompletion: (completionId: string) => void;
  onUpdateCompletionDate: (completionId: string, newDate: Date) => void;
  onAddCategory: () => void;
  onAddToCategory: (category: string) => void;
}

export function ChoreList({
  chores,
  categories,
  users,
  currentUserId,
  getCompletionHistory,
  onMarkDone,
  onEdit,
  onSkip,
  onDeleteCompletion,
  onUpdateCompletionDate,
  onAddCategory,
  onAddToCategory
}: ChoreListProps) {
  const activeChores = chores.filter(c => !(c.isOneTime && c.lastCompletion));
  const completedOneTimes = chores.filter(c => c.isOneTime && c.lastCompletion);

  // Group active chores by category, including empty categories
  const groupedChores = useMemo(() => {
    const groups = new Map<string, ChoreWithStatus[]>();

    // Start with all categories from the categories collection
    for (const cat of categories) {
      groups.set(cat.name, []);
    }

    // Add chores to their categories
    for (const chore of activeChores) {
      const category = chore.category || 'Uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(chore);
    }

    // Sort categories alphabetically, "Uncategorized" goes last
    const sortedCategories = Array.from(groups.keys()).sort((a, b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });

    return sortedCategories.map(category => ({
      category,
      chores: groups.get(category)!
    }));
  }, [activeChores, categories]);

  // Group completed one-time tasks
  const completedGroups = useMemo(() => {
    if (completedOneTimes.length === 0) return [];

    const groups = new Map<string, ChoreWithStatus[]>();
    for (const chore of completedOneTimes) {
      const category = chore.category || 'Uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(chore);
    }

    return Array.from(groups.entries()).map(([category, chores]) => ({
      category,
      chores
    }));
  }, [completedOneTimes]);

  const hasContent = groupedChores.length > 0 || completedOneTimes.length > 0;

  return (
    <div className="chore-list-container">
      {!hasContent ? (
        <div className="empty-state">
          <p>No categories yet!</p>
          <p className="empty-hint">Add your first category to get started.</p>
        </div>
      ) : (
        <div className="chore-columns">
          {groupedChores.map(({ category, chores: categoryChores }) => (
            <ChoreColumn
              key={category}
              title={category}
              chores={categoryChores}
              users={users}
              currentUserId={currentUserId}
              getCompletionHistory={getCompletionHistory}
              onMarkDone={onMarkDone}
              onEdit={onEdit}
              onSkip={onSkip}
              onDeleteCompletion={onDeleteCompletion}
              onUpdateCompletionDate={onUpdateCompletionDate}
              onAddItem={() => onAddToCategory(category)}
            />
          ))}
          {completedGroups.map(({ category, chores: categoryChores }) => (
            <ChoreColumn
              key={`completed-${category}`}
              title={`${category} (Done)`}
              chores={categoryChores}
              users={users}
              currentUserId={currentUserId}
              getCompletionHistory={getCompletionHistory}
              onMarkDone={onMarkDone}
              onEdit={onEdit}
              onSkip={onSkip}
              onDeleteCompletion={onDeleteCompletion}
              onUpdateCompletionDate={onUpdateCompletionDate}
              isCompleted
            />
          ))}
        </div>
      )}
      <button className="add-chore-button" onClick={onAddCategory}>
        + Add Category
      </button>
    </div>
  );
}
