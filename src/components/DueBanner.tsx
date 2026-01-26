import { useState, useMemo } from 'react';
import type { ChoreWithStatus } from '../lib/types';
import './DueBanner.css';

interface DueBannerProps {
  chores: ChoreWithStatus[];
}

export function DueBanner({ chores }: DueBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const dueChores = useMemo(() => {
    return chores.filter(c =>
      !c.isOneTime &&
      (c.status === 'due-soon' || c.status === 'overdue' || c.status === 'severely-overdue')
    );
  }, [chores]);

  const overdueChores = useMemo(() => {
    return chores.filter(c =>
      !c.isOneTime &&
      (c.status === 'overdue' || c.status === 'severely-overdue')
    );
  }, [chores]);

  if (dismissed || dueChores.length === 0) {
    return null;
  }

  const hasOverdue = overdueChores.length > 0;

  return (
    <div className={`due-banner ${hasOverdue ? 'overdue' : 'due-soon'}`}>
      <div className="due-banner-content">
        <span className="due-banner-icon">{hasOverdue ? '⚠️' : '📋'}</span>
        <div className="due-banner-text">
          <strong>
            {hasOverdue
              ? `${overdueChores.length} overdue`
              : `${dueChores.length} due soon`
            }
          </strong>
          <span className="due-banner-items">
            {dueChores.slice(0, 3).map(c => c.name).join(', ')}
            {dueChores.length > 3 && ` +${dueChores.length - 3} more`}
          </span>
        </div>
      </div>
      <button
        className="due-banner-dismiss"
        onClick={() => setDismissed(true)}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
