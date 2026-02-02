import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { db } from './lib/firebase';
import { useAuth } from './hooks/useAuth';
import { useChores } from './hooks/useChores';
import { useCompletions } from './hooks/useCompletions';
import { useCategories } from './hooks/useCategories';
import { useTheme } from './hooks/useTheme';
import { calculateChoreStatus, sortByPriority } from './lib/priority';
import type { ChoreWithStatus, User } from './lib/types';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ChoreList } from './components/ChoreList';
import { ChoreForm } from './components/ChoreForm';
import { CategoryForm } from './components/CategoryForm';
import { CompletionModal } from './components/CompletionModal';
import type { CompletedByOption } from './components/CompletionModal';
import { SkipModal } from './components/SkipModal';
import { Toast } from './components/Toast';
import { DueBanner } from './components/DueBanner';
import './App.css';

function App() {
  const { user, loading: authLoading, signIn, logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
  const { categories, addCategory, deleteCategory, updateCategory, reorderCategories } = useCategories();

  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [showChoreForm, setShowChoreForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingChore, setEditingChore] = useState<ChoreWithStatus | null>(null);
  const [presetCategory, setPresetCategory] = useState<string | null>(null);
  const [completingChoreId, setCompletingChoreId] = useState<string | null>(null);
  const [completingChoreIds, setCompletingChoreIds] = useState<string[]>([]);
  const [skippingChoreId, setSkippingChoreId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

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

  const celebrate = useCallback(() => {
    const duration = 800;
    const end = Date.now() + duration;

    // Show random congratulatory message
    const messages = [
      'Nice work!',
      'Awesome!',
      'Crushed it!',
      'Well done!',
      'Great job!',
      'You rock!',
      'Fantastic!',
      'Nailed it!',
      'Way to go!',
      'Boom!'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCelebrationMessage(randomMessage);
    setTimeout(() => setCelebrationMessage(null), 1500);

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#7c3aed', '#ec4899', '#f59e0b', '#22c55e']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#7c3aed', '#ec4899', '#f59e0b', '#22c55e']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const handleCompleteChore = async (completedBy: CompletedByOption, completedAt?: Date) => {
    if (!completingChoreId || !user) return;

    const collaborative = completedBy.type === 'together';
    const userId = completedBy.type === 'user' ? completedBy.userId : user.uid;

    // For collaborative, include all other users
    const otherUserIds = collaborative
      ? Array.from(users.keys()).filter(id => id !== user.uid)
      : undefined;

    const result = await markDone(
      completingChoreId,
      userId,
      collaborative,
      otherUserIds?.[0],
      completedAt
    );

    if (result === 'merged') {
      setToastMessage('Marked as done together!');
      celebrate();
    } else if (result === 'created') {
      let message = 'Marked as done!';
      if (completedBy.type === 'together') {
        message = 'Marked as done together!';
      } else if (completedBy.userId !== user.uid) {
        const completedByUser = users.get(completedBy.userId);
        const name = completedByUser?.displayName?.split(' ')[0] || 'User';
        message = `Marked as done by ${name}!`;
      }
      setToastMessage(message);
      celebrate();
    }

    setCompletingChoreId(null);
  };

  const handleCompleteAllChores = async (completedBy: CompletedByOption, completedAt?: Date) => {
    if (completingChoreIds.length === 0 || !user) return;

    const collaborative = completedBy.type === 'together';
    const userId = completedBy.type === 'user' ? completedBy.userId : user.uid;

    const otherUserIds = collaborative
      ? Array.from(users.keys()).filter(id => id !== user.uid)
      : undefined;

    for (const choreId of completingChoreIds) {
      await markDone(
        choreId,
        userId,
        collaborative,
        otherUserIds?.[0],
        completedAt
      );
    }

    const count = completingChoreIds.length;
    let message = `${count} chores marked as done!`;
    if (completedBy.type === 'together') {
      message = `${count} chores marked as done together!`;
    } else if (completedBy.userId !== user.uid) {
      const completedByUser = users.get(completedBy.userId);
      const name = completedByUser?.displayName?.split(' ')[0] || 'User';
      message = `${count} chores marked as done by ${name}!`;
    }
    setToastMessage(message);
    celebrate();

    setCompletingChoreIds([]);
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

  const handleRenameCategory = async (oldName: string, newName: string) => {
    // Find the category by name
    const category = categories.find(c => c.name === oldName);
    if (!category) return;

    // Update the category name
    const success = await updateCategory(category.id, newName);
    if (!success) {
      setToastMessage('A chore with that name already exists');
      return;
    }

    // Update all chores in this category to the new category name
    const choresInCategory = chores.filter(c => c.category === oldName);
    for (const chore of choresInCategory) {
      await updateChore(chore.id, { category: newName });
    }

    setToastMessage('Chore renamed');
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
      <Header user={user} theme={theme} onToggleTheme={toggleTheme} onLogout={logOut} />

      {!isLoading && (
        <DueBanner chores={choresWithStatus} />
      )}

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
          onRenameCategory={handleRenameCategory}
          onReorderCategories={reorderCategories}
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
          users={users}
          currentUserId={user.uid}
          onComplete={handleCompleteChore}
          onClose={() => setCompletingChoreId(null)}
        />
      )}

      {completingChoreIds.length > 0 && (
        <CompletionModal
          choreName={`${completingChoreIds.length} chores`}
          users={users}
          currentUserId={user.uid}
          onComplete={handleCompleteAllChores}
          onClose={() => setCompletingChoreIds([])}
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

      {celebrationMessage && (
        <div className="celebration-overlay">
          <span className="celebration-text">{celebrationMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
