import { Timestamp } from 'firebase/firestore';

export interface Chore {
  id: string;
  name: string;
  category?: string;
  minDays: number;
  maxDays: number;
  isOneTime: boolean;
  createdAt: Timestamp;
  createdBy: string;
  order?: number;
}

export interface Completion {
  id: string;
  choreId: string;
  completedAt: Timestamp;
  completedBy: string[];
  collaborative: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export interface ChoreWithStatus extends Chore {
  lastCompletion: Completion | null;
  daysSinceLastDone: number;
  daysUntilOverdue: number;
  status: 'comfortable' | 'due-soon' | 'overdue' | 'severely-overdue' | 'never-done';
  statusText: string;
}
