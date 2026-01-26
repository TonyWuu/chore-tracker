import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Chore } from '../lib/types';

export function useChores() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'chores'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const choreData: Chore[] = [];
      snapshot.forEach((doc) => {
        choreData.push({ id: doc.id, ...doc.data() } as Chore);
      });
      setChores(choreData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addChore = async (
    name: string,
    category: string,
    minDays: number,
    maxDays: number,
    isOneTime: boolean,
    userId: string
  ) => {
    await addDoc(collection(db, 'chores'), {
      name,
      category: category || '',
      minDays,
      maxDays,
      isOneTime,
      createdAt: Timestamp.now(),
      createdBy: userId
    });
  };

  const updateChore = async (
    choreId: string,
    updates: Partial<Pick<Chore, 'name' | 'category' | 'minDays' | 'maxDays'>>
  ) => {
    await updateDoc(doc(db, 'chores', choreId), updates);
  };

  const deleteChore = async (choreId: string) => {
    // Delete all completions for this chore first
    const batch = writeBatch(db);

    // Delete the chore
    batch.delete(doc(db, 'chores', choreId));

    await batch.commit();
  };

  const reorderChores = async (choreIds: string[]) => {
    const batch = writeBatch(db);
    choreIds.forEach((choreId, index) => {
      batch.update(doc(db, 'chores', choreId), { order: index });
    });
    await batch.commit();
  };

  return { chores, loading, addChore, updateChore, deleteChore, reorderChores };
}
