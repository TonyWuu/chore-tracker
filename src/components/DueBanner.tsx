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
  const shown = hasOverdue ? overdueChores : dueChores;
  const count = shown.length;
  const headline = hasOverdue
    ? `${count} overdue`
    : `${count} due soon`;

  return (
    <div className={`due-banner ${hasOverdue ? 'overdue' : 'due-soon'}`}>
      <div className="due-banner-content">
        <span className="due-banner-icon" aria-hidden="true">{hasOverdue ? '⚠️' : '⏰'}</span>
        <div className="due-banner-text">
          <strong>{headline}</strong>
          <span className="due-banner-items">
            {shown.slice(0, 3).map(c => c.name).join(', ')}
            {shown.length > 3 && ` +${shown.length - 3} more`}
          </span>
        </div>
      </div>
      <button
        className="due-banner-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss reminder"
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
