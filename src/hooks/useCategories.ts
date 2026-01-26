import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Category {
  id: string;
  name: string;
  order?: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoryData: Category[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        categoryData.push({ id: docSnap.id, name: data.name, order: data.order });
      });
      setCategories(categoryData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addCategory = async (name: string) => {
    // Check if category already exists
    const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return;

    await addDoc(collection(db, 'categories'), { name });
  };

  const deleteCategory = async (categoryId: string) => {
    await deleteDoc(doc(db, 'categories', categoryId));
  };

  const updateCategory = async (categoryId: string, newName: string) => {
    // Check if new name already exists
    const exists = categories.some(c => c.id !== categoryId && c.name.toLowerCase() === newName.toLowerCase());
    if (exists) return false;

    await updateDoc(doc(db, 'categories', categoryId), { name: newName });
    return true;
  };

  const reorderCategories = async (categoryIds: string[]) => {
    const batch = writeBatch(db);
    categoryIds.forEach((categoryId, index) => {
      batch.update(doc(db, 'categories', categoryId), { order: index });
    });
    await batch.commit();
  };

  return { categories, loading, addCategory, deleteCategory, updateCategory, reorderCategories };
}
