import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Completion } from '../lib/types';

export function useCompletions() {
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'completions'), orderBy('completedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const completionData: Completion[] = [];
      snapshot.forEach((doc) => {
        completionData.push({ id: doc.id, ...doc.data() } as Completion);
      });
      setCompletions(completionData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getLastCompletion = (choreId: string): Completion | null => {
    const choreCompletions = completions.filter(c => c.choreId === choreId);
    if (choreCompletions.length === 0) return null;
    return choreCompletions.reduce((latest, current) =>
      current.completedAt.toMillis() > latest.completedAt.toMillis() ? current : latest
    );
  };

  const getCompletionHistory = (choreId: string): Completion[] => {
    return completions
      .filter(c => c.choreId === choreId)
      .sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis());
  };

  const getCompletionCount = (choreId: string): number => {
    return completions.filter(c => c.choreId === choreId).length;
  };

  const markDone = async (
    choreId: string,
    userId: string,
    collaborative: boolean,
    partnerId?: string,
    completedAt?: Date
  ) => {
    const timestamp = completedAt ? Timestamp.fromDate(completedAt) : Timestamp.now();
    const oneMinuteAgo = new Date(Date.now() - 60000);

    // Check for recent completion (race condition handling)
    const recentQuery = query(
      collection(db, 'completions'),
      where('choreId', '==', choreId),
      where('completedAt', '>=', Timestamp.fromDate(oneMinuteAgo)),
      limit(1)
    );

    const recentSnap = await getDocs(recentQuery);

    if (!recentSnap.empty) {
      const existingCompletion = recentSnap.docs[0];
      const existingData = existingCompletion.data() as Completion;

      // If current user isn't in the completedBy list, merge as collaborative
      if (!existingData.completedBy.includes(userId)) {
        await updateDoc(doc(db, 'completions', existingCompletion.id), {
          completedBy: [...existingData.completedBy, userId],
          collaborative: true
        });
        return 'merged';
      }
      return 'already-completed';
    }

    // Create new completion
    const completedBy = collaborative && partnerId
      ? [userId, partnerId]
      : [userId];

    await addDoc(collection(db, 'completions'), {
      choreId,
      completedAt: timestamp,
      completedBy,
      collaborative
    });

    return 'created';
  };

  const skipChore = async (choreId: string, userId: string) => {
    // Create a "skip" completion that resets the timer
    await addDoc(collection(db, 'completions'), {
      choreId,
      completedAt: Timestamp.now(),
      completedBy: [userId],
      collaborative: false
    });
  };

  const deleteCompletionsForChore = async (choreId: string) => {
    const q = query(collection(db, 'completions'), where('choreId', '==', choreId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };

  const deleteCompletion = async (completionId: string) => {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'completions', completionId));
  };

  const updateCompletionDate = async (completionId: string, newDate: Date) => {
    await updateDoc(doc(db, 'completions', completionId), {
      completedAt: Timestamp.fromDate(newDate)
    });
  };

  return {
    completions,
    loading,
    getLastCompletion,
    getCompletionHistory,
    getCompletionCount,
    markDone,
    skipChore,
    deleteCompletionsForChore,
    deleteCompletion,
    updateCompletionDate
  };
}
