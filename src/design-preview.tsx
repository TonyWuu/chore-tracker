/**
 * Design preview harness — renders the app in any state with fixture data,
 * no Firebase required. Dev-only; not part of the production build.
 *
 * Usage: /design-preview.html?state=<state>&theme=<light|dark>&expand=1
 *   state: main | empty | login | completion | skip | form-add | form-edit | category | toast
 */
/* eslint-disable react-refresh/only-export-components -- entry file, not hot-reloaded as a module */
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Timestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import '@fontsource/baloo-2/500.css';
import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import './index.css';
import './App.css';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ChoreList } from './components/ChoreList';
import { ChoreForm } from './components/ChoreForm';
import { CategoryForm } from './components/CategoryForm';
import { CompletionModal } from './components/CompletionModal';
import { SkipModal } from './components/SkipModal';
import { Toast } from './components/Toast';
import { DueBanner } from './components/DueBanner';
import { calculateChoreStatus } from './lib/priority';
import type { Chore, Completion, User } from './lib/types';
import type { Category } from './hooks/useCategories';

const params = new URLSearchParams(window.location.search);
const state = params.get('state') || 'main';
const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', theme);

const avatar = (initial: string, bg: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${bg}"/><text x="40" y="54" font-family="sans-serif" font-size="40" font-weight="700" fill="#fff" text-anchor="middle">${initial}</text></svg>`
  );

const TONY = 'tony-uid';
const JOLENE = 'jolene-uid';

const users = new Map<string, User>([
  [TONY, { id: TONY, email: 'tony@example.com', displayName: 'Tony Wu', photoURL: avatar('T', '#ff7b54') }],
  [JOLENE, { id: JOLENE, email: 'jolene@example.com', displayName: 'Jolene Chiu', photoURL: avatar('J', '#20b2aa') }],
]);

const mockAuthUser = {
  displayName: 'Tony Wu',
  photoURL: avatar('T', '#ff7b54'),
} as unknown as FirebaseUser;

const daysAgo = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));

let completionSeq = 0;
function completion(choreId: string, agoDays: number, by: string[], collaborative = false): Completion {
  return { id: `c${++completionSeq}`, choreId, completedAt: daysAgo(agoDays), completedBy: by, collaborative };
}

interface Fixture {
  chore: Chore;
  history: Completion[];
}

function fixture(
  id: string,
  name: string,
  category: string,
  freq: number,
  history: Completion[],
  opts: { isOneTime?: boolean; createdDaysAgo?: number } = {}
): Fixture {
  return {
    chore: {
      id,
      name,
      category,
      minDays: freq,
      maxDays: freq,
      isOneTime: opts.isOneTime ?? false,
      createdAt: daysAgo(opts.createdDaysAgo ?? 60),
      createdBy: TONY,
    },
    history,
  };
}

const fixtures: Fixture[] = [
  // Vacuuming — mix of urgencies, first item has rich history
  fixture('rugs', 'Rugs', 'Vacuuming', 7, [
    completion('rugs', 9, [JOLENE]),
    completion('rugs', 23, [TONY, JOLENE], true),
    completion('rugs', 40, [TONY]),
  ]),
  fixture('living-room', 'Living Room', 'Vacuuming', 7, [
    completion('living-room', 1, [JOLENE]),
    completion('living-room', 8, [TONY]),
  ]),
  fixture('bedroom', 'Bedroom', 'Vacuuming', 7, [completion('bedroom', 5, [TONY])]),
  // Cleaning
  fixture('bathroom', 'Bathroom', 'Cleaning', 7, [
    completion('bathroom', 25, [TONY, JOLENE], true),
    completion('bathroom', 39, [JOLENE]),
    completion('bathroom', 52, [TONY, JOLENE], true),
  ]),
  fixture('kitchen-counters', 'Kitchen Counters', 'Cleaning', 3, [
    completion('kitchen-counters', 0, [TONY, JOLENE], true),
  ]),
  fixture('windows', 'Windows', 'Cleaning', 30, []),
  // Laundry
  fixture('bedsheets', 'Bedsheets', 'Laundry', 14, [completion('bedsheets', 12, [JOLENE])]),
  fixture('towels', 'Towels', 'Laundry', 7, [completion('towels', 2, [TONY])]),
  // Plants
  fixture('water-plants', 'Water Plants', 'Plants', 3, [completion('water-plants', 4, [JOLENE])]),
  fixture('fertilize', 'Fertilize', 'Plants', 30, [completion('fertilize', 10, [TONY])]),
  // Errands — one-time tasks, one active + one completed
  fixture('vacuum-bags', 'Buy vacuum bags', 'Errands', 0, [], { isOneTime: true, createdDaysAgo: 4 }),
  fixture('door-hinge', 'Fix door hinge', 'Errands', 0, [completion('door-hinge', 6, [TONY])], {
    isOneTime: true,
    createdDaysAgo: 20,
  }),
];

const categories: Category[] = [
  { id: 'cat-vacuuming', name: 'Vacuuming', order: 0 },
  { id: 'cat-cleaning', name: 'Cleaning', order: 1 },
  { id: 'cat-laundry', name: 'Laundry', order: 2 },
  { id: 'cat-plants', name: 'Plants', order: 3 },
  { id: 'cat-errands', name: 'Errands', order: 4 },
];

const historyByChore = new Map(fixtures.map((f) => [f.chore.id, f.history]));
const choresWithStatus = fixtures.map((f) => calculateChoreStatus(f.chore, f.history[0] ?? null));
const getCompletionHistory = (choreId: string) => historyByChore.get(choreId) ?? [];

const noop = () => {};

function PreviewShell({ children, empty = false }: { children?: React.ReactNode; empty?: boolean }) {
  useEffect(() => {
    if (params.get('expand')) {
      setTimeout(() => {
        (document.querySelector('.item-main') as HTMLElement | null)?.click();
      }, 150);
    }
  }, []);

  const chores = empty ? [] : choresWithStatus;
  return (
    <div className="app">
      <Header user={mockAuthUser} theme={theme} onToggleTheme={noop} onLogout={noop} />
      <DueBanner chores={chores} />
      <ChoreList
        chores={chores}
        categories={empty ? [] : categories}
        users={users}
        currentUserId={TONY}
        getCompletionHistory={getCompletionHistory}
        onMarkDone={noop}
        onEdit={noop}
        onSkip={noop}
        onDeleteCompletion={noop}
        onUpdateCompletionDate={noop}
        onAddCategory={noop}
        onAddToCategory={noop}
        onDeleteCategory={noop}
        onRenameCategory={noop}
        onReorderCategories={noop}
      />
      {children}
    </div>
  );
}

function Preview() {
  switch (state) {
    case 'login':
      return <LoginScreen onSignIn={noop} />;
    case 'empty':
      return <PreviewShell empty />;
    case 'completion':
      return (
        <PreviewShell>
          <CompletionModal
            choreName="Living Room"
            users={users}
            currentUserId={TONY}
            onComplete={noop}
            onClose={noop}
          />
        </PreviewShell>
      );
    case 'skip':
      return (
        <PreviewShell>
          <SkipModal choreName="Bathroom" onResetFully={noop} onSnoozeUntil={noop} onClose={noop} />
        </PreviewShell>
      );
    case 'form-add':
      return (
        <PreviewShell>
          <ChoreForm presetCategory="Vacuuming" onSave={noop} onClose={noop} />
        </PreviewShell>
      );
    case 'form-edit': {
      const bathroom = choresWithStatus.find((c) => c.id === 'bathroom')!;
      return (
        <PreviewShell>
          <ChoreForm
            chore={bathroom}
            completionHistory={getCompletionHistory('bathroom')}
            completionCount={getCompletionHistory('bathroom').length}
            users={users}
            currentUserId={TONY}
            onSave={noop}
            onDelete={noop}
            onDeleteCompletion={noop}
            onUpdateCompletionDate={noop}
            onClose={noop}
          />
        </PreviewShell>
      );
    }
    case 'category':
      return (
        <PreviewShell>
          <CategoryForm onSave={noop} onClose={noop} />
        </PreviewShell>
      );
    case 'toast':
      return (
        <PreviewShell>
          <Toast message="Marked as done together!" onClose={noop} />
        </PreviewShell>
      );
    default:
      return <PreviewShell />;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>
);
