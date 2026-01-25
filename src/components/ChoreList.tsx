import { useMemo, useState, useCallback } from 'react';
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
  onDeleteCategory: (categoryName: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
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
  onAddToCategory,
  onDeleteCategory,
  onRenameCategory
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

  // Track which column has an expanded item (null means collapse all)
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const handleColumnClick = useCallback((columnKey: string) => {
    setActiveColumn(columnKey);
  }, []);

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only collapse if clicking directly on the container or columns wrapper, not on a column
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).classList.contains('chore-columns')
    ) {
      setActiveColumn(null);
    }
  }, []);

  return (
    <div className="chore-list-container" onClick={handleBackgroundClick}>
      {!hasContent ? (
        <div className="empty-state">
          <p>No chores yet!</p>
          <p className="empty-hint">Add your first chore to get started.</p>
        </div>
      ) : (
        <div className="chore-columns">
          {groupedChores.map(({ category, chores: categoryChores }) => (
            <ChoreColumn
              key={category}
              columnKey={category}
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
              onDeleteColumn={() => onDeleteCategory(category)}
              onRenameColumn={(newName) => onRenameCategory(category, newName)}
              isActiveColumn={activeColumn === category}
              onColumnActivate={() => handleColumnClick(category)}
            />
          ))}
          {completedGroups.map(({ category, chores: categoryChores }) => {
            const columnKey = `completed-${category}`;
            return (
              <ChoreColumn
                key={columnKey}
                columnKey={columnKey}
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
                isActiveColumn={activeColumn === columnKey}
                onColumnActivate={() => handleColumnClick(columnKey)}
              />
            );
          })}
        </div>
      )}
      <button className="add-chore-button" onClick={onAddCategory}>
        + Add Chore
      </button>
    </div>
  );
}
