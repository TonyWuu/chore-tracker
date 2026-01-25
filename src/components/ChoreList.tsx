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
  onAddChore
}: ChoreListProps) {
  const activeChores = chores.filter(c => !(c.isOneTime && c.lastCompletion));
  const completedOneTimes = chores.filter(c => c.isOneTime && c.lastCompletion);

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
            {activeChores.map((chore) => (
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
              />
            ))}
            {completedOneTimes.length > 0 && (
              <>
                <h3 className="section-title">Completed Tasks</h3>
                {completedOneTimes.map((chore) => (
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
                  />
                ))}
              </>
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
