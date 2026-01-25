import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from './lib/firebase';
import { useAuth } from './hooks/useAuth';
import { useChores } from './hooks/useChores';
import { useCompletions } from './hooks/useCompletions';
import { useCategories } from './hooks/useCategories';
import { calculateChoreStatus, sortByPriority } from './lib/priority';
import type { ChoreWithStatus, User } from './lib/types';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ChoreList } from './components/ChoreList';
import { ChoreForm } from './components/ChoreForm';
import { CategoryForm } from './components/CategoryForm';
import { CompletionModal } from './components/CompletionModal';
import { SkipModal } from './components/SkipModal';
import { Toast } from './components/Toast';
import './App.css';

function App() {
  const { user, loading: authLoading, signIn, logOut } = useAuth();
  const { chores, loading: choresLoading, addChore, updateChore, deleteChore } = useChores();
  const {
    completions,
    loading: completionsLoading,
    getLastCompletion,
    getCompletionHistory,
    getCompletionCount,
    markDone,
    skipChore,
    deleteCompletionsForChore,
    deleteCompletion,
    updateCompletionDate
  } = useCompletions();
  const { categories, addCategory, deleteCategory } = useCategories();

  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [showChoreForm, setShowChoreForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingChore, setEditingChore] = useState<ChoreWithStatus | null>(null);
  const [presetCategory, setPresetCategory] = useState<string | null>(null);
  const [completingChoreId, setCompletingChoreId] = useState<string | null>(null);
  const [skippingChoreId, setSkippingChoreId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load all users
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userMap = new Map<string, User>();
      snapshot.forEach((doc) => {
        userMap.set(doc.id, doc.data() as User);
      });
      setUsers(userMap);
    });
    return () => unsubscribe();
  }, []);

  // Calculate chore statuses and sort by priority
  const choresWithStatus = useMemo(() => {
    const withStatus = chores.map((chore) => {
      const lastCompletion = getLastCompletion(chore.id);
      return calculateChoreStatus(chore, lastCompletion);
    });
    return sortByPriority(withStatus);
  }, [chores, completions, getLastCompletion]);

  const completingChore = choresWithStatus.find(c => c.id === completingChoreId);
  const skippingChore = choresWithStatus.find(c => c.id === skippingChoreId);

  // Get partner ID (the other user)
  const partnerId = useMemo(() => {
    for (const [id] of users) {
      if (id !== user?.uid) {
        return id;
      }
    }
    return undefined;
  }, [users, user]);

  const handleAddCategory = () => {
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async (name: string) => {
    await addCategory(name);
    setShowCategoryForm(false);
    setToastMessage('Chore created');
  };

  const handleAddToCategory = (category: string) => {
    setEditingChore(null);
    setPresetCategory(category);
    setShowChoreForm(true);
  };

  const handleEditChore = (chore: ChoreWithStatus) => {
    setEditingChore(chore);
    setPresetCategory(null);
    setShowChoreForm(true);
  };

  const handleSaveChore = async (
    name: string,
    category: string,
    minDays: number,
    maxDays: number,
    isOneTime: boolean
  ) => {
    if (editingChore) {
      await updateChore(editingChore.id, { name, category, minDays, maxDays });
    } else if (user) {
      await addChore(name, category, minDays, maxDays, isOneTime, user.uid);
    }
    setShowChoreForm(false);
    setEditingChore(null);
  };

  const handleDeleteChore = async () => {
    if (editingChore) {
      await deleteCompletionsForChore(editingChore.id);
      await deleteChore(editingChore.id);
      setShowChoreForm(false);
      setEditingChore(null);
      setToastMessage('Chore deleted');
    }
  };

  const handleMarkDone = (choreId: string) => {
    setCompletingChoreId(choreId);
  };

  const handleCompleteChore = async (collaborative: boolean) => {
    if (!completingChoreId || !user) return;

    const result = await markDone(
      completingChoreId,
      user.uid,
      collaborative,
      collaborative ? partnerId : undefined
    );

    if (result === 'merged') {
      setToastMessage('Marked as done together!');
    } else if (result === 'created') {
      setToastMessage(collaborative ? 'Marked as done together!' : 'Marked as done!');
    }

    setCompletingChoreId(null);
  };

  const handleSkip = (choreId: string) => {
    setSkippingChoreId(choreId);
  };

  const handleResetFully = async () => {
    if (!skippingChoreId || !user) return;
    await skipChore(skippingChoreId, user.uid);
    setSkippingChoreId(null);
    setToastMessage('Chore reset');
  };

  const handleSnoozeUntil = async (date: Date) => {
    // For snooze, we create a completion record with the snooze date
    // This effectively resets the timer to that date
    if (!skippingChoreId || !user) return;
    await skipChore(skippingChoreId, user.uid);
    setSkippingChoreId(null);
    setToastMessage(`Snoozed until ${date.toLocaleDateString()}`);
  };

  const handleDeleteCategory = async (categoryName: string) => {
    // Find the category by name and delete it
    const category = categories.find(c => c.name === categoryName);
    if (!category) return;

    // Delete all chores and their completions in this category
    const choresInCategory = chores.filter(c => c.category === categoryName);
    for (const chore of choresInCategory) {
      await deleteCompletionsForChore(chore.id);
      await deleteChore(chore.id);
    }

    // Delete the category itself
    await deleteCategory(category.id);
    setToastMessage('Chore deleted');
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onSignIn={signIn} />;
  }

  const isLoading = choresLoading || completionsLoading;

  return (
    <div className="app">
      <Header user={user} onLogout={logOut} />

      {isLoading ? (
        <div className="loading-content">
          <div className="loading-spinner" />
        </div>
      ) : (
        <ChoreList
          chores={choresWithStatus}
          categories={categories}
          users={users}
          currentUserId={user.uid}
          getCompletionHistory={getCompletionHistory}
          onMarkDone={handleMarkDone}
          onEdit={handleEditChore}
          onSkip={handleSkip}
          onDeleteCompletion={deleteCompletion}
          onUpdateCompletionDate={updateCompletionDate}
          onAddCategory={handleAddCategory}
          onAddToCategory={handleAddToCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {showChoreForm && (
        <ChoreForm
          chore={editingChore}
          presetCategory={presetCategory}
          completionHistory={editingChore ? getCompletionHistory(editingChore.id) : []}
          completionCount={editingChore ? getCompletionCount(editingChore.id) : 0}
          users={users}
          currentUserId={user?.uid}
          onSave={handleSaveChore}
          onDelete={editingChore ? handleDeleteChore : undefined}
          onDeleteCompletion={deleteCompletion}
          onUpdateCompletionDate={updateCompletionDate}
          onClose={() => {
            setShowChoreForm(false);
            setEditingChore(null);
            setPresetCategory(null);
          }}
        />
      )}

      {showCategoryForm && (
        <CategoryForm
          onSave={handleSaveCategory}
          onClose={() => setShowCategoryForm(false)}
        />
      )}

      {completingChore && (
        <CompletionModal
          choreName={completingChore.name}
          onComplete={handleCompleteChore}
          onClose={() => setCompletingChoreId(null)}
        />
      )}

      {skippingChore && (
        <SkipModal
          choreName={skippingChore.name}
          onResetFully={handleResetFully}
          onSnoozeUntil={handleSnoozeUntil}
          onClose={() => setSkippingChoreId(null)}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}

export default App;
