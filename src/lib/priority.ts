import { differenceInDays } from 'date-fns';
import type { Chore, Completion, ChoreWithStatus } from './types';

export function calculateChoreStatus(
  chore: Chore,
  lastCompletion: Completion | null
): ChoreWithStatus {
  const now = new Date();

  // If no completion, treat createdAt as "just done"
  const lastDoneDate = lastCompletion
    ? lastCompletion.completedAt.toDate()
    : chore.createdAt.toDate();

  const daysSinceLastDone = differenceInDays(now, lastDoneDate);
  const daysUntilOverdue = chore.maxDays - daysSinceLastDone;

  let status: ChoreWithStatus['status'];
  let statusText: string;

  if (chore.isOneTime && lastCompletion) {
    // One-time task that's been completed
    status = 'comfortable';
    statusText = 'Completed';
  } else if (daysSinceLastDone < chore.minDays) {
    status = 'comfortable';
    const daysLeft = chore.minDays - daysSinceLastDone;
    statusText = daysLeft === 1 ? 'Due in 1 day' : `Due in ${daysLeft} days`;
  } else if (daysSinceLastDone < chore.maxDays) {
    status = 'due-soon';
    if (daysUntilOverdue <= 0) {
      statusText = 'Due today';
    } else if (daysUntilOverdue === 1) {
      statusText = 'Due in 1 day';
    } else {
      statusText = `Due in ${daysUntilOverdue} days`;
    }
  } else if (daysSinceLastDone >= chore.maxDays * 3) {
    status = 'severely-overdue';
    const overdueDays = daysSinceLastDone - chore.maxDays;
    statusText = `Overdue by ${overdueDays} days`;
  } else {
    status = 'overdue';
    const overdueDays = daysSinceLastDone - chore.maxDays;
    if (overdueDays === 0) {
      statusText = 'Due today';
    } else if (overdueDays === 1) {
      statusText = 'Overdue by 1 day';
    } else {
      statusText = `Overdue by ${overdueDays} days`;
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
