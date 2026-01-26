import { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import type { ChoreWithStatus, User, Completion } from '../lib/types';
import type { Category } from '../hooks/useCategories';
import { ChoreColumn } from './ChoreColumn';
import './ChoreList.css';

interface SortableColumnProps {
  id: string;
  category: string;
  chores: ChoreWithStatus[];
  users: Map<string, User>;
  currentUserId: string;
  getCompletionHistory: (choreId: string) => Completion[];
  onMarkDone: (choreId: string) => void;
  onMarkAllDone: (choreIds: string[]) => void;
  onEdit: (chore: ChoreWithStatus) => void;
  onSkip: (choreId: string) => void;
  onDeleteCompletion: (completionId: string) => void;
  onUpdateCompletionDate: (completionId: string, newDate: Date) => void;
  onAddToCategory: (category: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  collapseSignal: number;
}

function SortableColumn({
  id,
  category,
  chores,
  users,
  currentUserId,
  getCompletionHistory,
  onMarkDone,
  onMarkAllDone,
  onEdit,
  onSkip,
  onDeleteCompletion,
  onUpdateCompletionDate,
  onAddToCategory,
  onDeleteCategory,
  onRenameCategory,
  collapseSignal
}: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto' as const
  };

  return (
    <div ref={setNodeRef} style={style} className={`sortable-column ${isDragging ? 'dragging' : ''}`}>
      <ChoreColumn
        title={category}
        chores={chores}
        users={users}
        currentUserId={currentUserId}
        getCompletionHistory={getCompletionHistory}
        onMarkDone={onMarkDone}
        onMarkAllDone={onMarkAllDone}
        onEdit={onEdit}
        onSkip={onSkip}
        onDeleteCompletion={onDeleteCompletion}
        onUpdateCompletionDate={onUpdateCompletionDate}
        onAddItem={() => onAddToCategory(category)}
        onDeleteColumn={() => onDeleteCategory(category)}
        onRenameColumn={(newName) => onRenameCategory(category, newName)}
        collapseSignal={collapseSignal}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

interface ChoreListProps {
  chores: ChoreWithStatus[];
  categories: Category[];
  users: Map<string, User>;
  currentUserId: string;
  getCompletionHistory: (choreId: string) => Completion[];
  onMarkDone: (choreId: string) => void;
  onMarkAllDone: (choreIds: string[]) => void;
  onEdit: (chore: ChoreWithStatus) => void;
  onSkip: (choreId: string) => void;
  onDeleteCompletion: (completionId: string) => void;
  onUpdateCompletionDate: (completionId: string, newDate: Date) => void;
  onAddCategory: () => void;
  onAddToCategory: (category: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onReorderCategories: (categoryIds: string[]) => void;
}

export function ChoreList({
  chores,
  categories,
  users,
  currentUserId,
  getCompletionHistory,
  onMarkDone,
  onMarkAllDone,
  onEdit,
  onSkip,
  onDeleteCompletion,
  onUpdateCompletionDate,
  onAddCategory,
  onAddToCategory,
  onDeleteCategory,
  onRenameCategory,
  onReorderCategories
}: ChoreListProps) {
  const activeChores = chores.filter(c => !(c.isOneTime && c.lastCompletion));
  const completedOneTimes = chores.filter(c => c.isOneTime && c.lastCompletion);

  // Sort categories by order, falling back to alphabetical
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  // Group active chores by category
  const groupedChores = useMemo(() => {
    const groups = new Map<string, ChoreWithStatus[]>();

    // Start with all categories from the sorted categories
    for (const cat of sortedCategories) {
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

    // Sort chores within each category by priority
    for (const [, categoryChores] of groups) {
      categoryChores.sort((a, b) => a.daysUntilOverdue - b.daysUntilOverdue);
    }

    return sortedCategories.map(cat => ({
      id: cat.id,
      category: cat.name,
      chores: groups.get(cat.name) || []
    }));
  }, [activeChores, sortedCategories]);

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

  // Signal to collapse all items (increments when background is clicked)
  const [collapseSignal, setCollapseSignal] = useState(0);

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only collapse if clicking directly on the container or columns wrapper, not on a column
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).classList.contains('chore-columns')
    ) {
      setCollapseSignal(prev => prev + 1);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = groupedChores.findIndex(g => g.id === active.id);
      const newIndex = groupedChores.findIndex(g => g.id === over.id);
      const newOrder = arrayMove(groupedChores, oldIndex, newIndex);
      onReorderCategories(newOrder.map(g => g.id));
    }
  };

  return (
    <div className="chore-list-container" onClick={handleBackgroundClick}>
      {!hasContent ? (
        <div className="empty-state">
          <p>No chores yet!</p>
          <p className="empty-hint">Add your first chore to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <SortableContext
            items={groupedChores.map(g => g.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="chore-columns">
              {groupedChores.map(({ id, category, chores: categoryChores }) => (
                <SortableColumn
                  key={id}
                  id={id}
                  category={category}
                  chores={categoryChores}
                  users={users}
                  currentUserId={currentUserId}
                  getCompletionHistory={getCompletionHistory}
                  onMarkDone={onMarkDone}
                  onMarkAllDone={onMarkAllDone}
                  onEdit={onEdit}
                  onSkip={onSkip}
                  onDeleteCompletion={onDeleteCompletion}
                  onUpdateCompletionDate={onUpdateCompletionDate}
                  onAddToCategory={onAddToCategory}
                  onDeleteCategory={onDeleteCategory}
                  onRenameCategory={onRenameCategory}
                  collapseSignal={collapseSignal}
                />
              ))}
              {completedGroups.map(({ category, chores: categoryChores }) => (
                <div key={`completed-${category}`} className="sortable-column">
                  <ChoreColumn
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
                    collapseSignal={collapseSignal}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <button className="add-chore-button" onClick={onAddCategory} title="Add chore">
        +
      </button>
    </div>
  );
}
