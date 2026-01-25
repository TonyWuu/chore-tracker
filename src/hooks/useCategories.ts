import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Category {
  id: string;
  name: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoryData: Category[] = [];
      snapshot.forEach((doc) => {
        categoryData.push({ id: doc.id, name: doc.data().name });
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

  return { categories, loading, addCategory, deleteCategory };
}
