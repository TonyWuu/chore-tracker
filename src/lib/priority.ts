import { differenceInCalendarDays, format } from 'date-fns';
import type { Chore, Completion, ChoreWithStatus } from './types';

export function calculateChoreStatus(
  chore: Chore,
  lastCompletion: Completion | null
): ChoreWithStatus {
  const now = new Date();

  // If no completion, use createdAt for calculation but mark as never done
  const lastDoneDate = lastCompletion
    ? lastCompletion.completedAt.toDate()
    : chore.createdAt.toDate();

  const daysSinceLastDone = differenceInCalendarDays(now, lastDoneDate);
  const daysUntilOverdue = chore.maxDays - daysSinceLastDone;

  let status: ChoreWithStatus['status'];
  let statusText: string;

  // Determine status based on days since last done
  if (chore.isOneTime && lastCompletion) {
    status = 'comfortable';
  } else if (!lastCompletion) {
    status = 'overdue';
  } else if (daysSinceLastDone < chore.minDays) {
    status = 'comfortable';
  } else if (daysSinceLastDone < chore.maxDays) {
    status = 'due-soon';
  } else if (daysSinceLastDone >= chore.maxDays * 3) {
    status = 'severely-overdue';
  } else {
    status = 'overdue';
  }

  // Status text shows when it was last done
  if (!lastCompletion) {
    statusText = 'Never done';
  } else if (daysSinceLastDone === 0) {
    statusText = 'Today';
  } else {
    const dateStr = format(lastDoneDate, 'MMM d');
    if (daysSinceLastDone === 1) {
      statusText = `1 day ago\n${dateStr}`;
    } else {
      statusText = `${daysSinceLastDone} days ago\n${dateStr}`;
    }
  }

  return {
    ...chore,
    lastCompletion,
    daysSinceLastDone,
    daysUntilOverdue,
    status,
    statusText
  };
}

export function sortByPriority(chores: ChoreWithStatus[]): ChoreWithStatus[] {
  return [...chores].sort((a, b) => {
    // Completed one-time tasks go to the bottom
    if (a.isOneTime && a.lastCompletion && !(b.isOneTime && b.lastCompletion)) {
      return 1;
    }
    if (b.isOneTime && b.lastCompletion && !(a.isOneTime && a.lastCompletion)) {
      return -1;
    }
    // Sort by days until overdue (ascending - most urgent first)
    return a.daysUntilOverdue - b.daysUntilOverdue;
  });
}
