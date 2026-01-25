# Choresy

A chore tracking app for couples. Track recurring household tasks, see what's overdue, and mark things done together or solo.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Firestore + Auth)
- **Styling**: Plain CSS with CSS variables for theming
- **Deployment**: GitHub Pages via Actions

## Commands

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx       # App header with theme toggle
│   ├── ChoreList.tsx    # Main list container, groups by category
│   ├── ChoreColumn.tsx  # Single category column with items
│   ├── ChoreForm.tsx    # Add/edit chore modal
│   ├── CompletionModal.tsx  # "Just me" vs "Together" picker
│   ├── SkipModal.tsx    # Reset/snooze options
│   └── ...
├── hooks/               # Firebase data hooks
│   ├── useAuth.ts       # Google auth
│   ├── useChores.ts     # CRUD for chores
│   ├── useCompletions.ts # Completion records
│   ├── useCategories.ts # Category management
│   └── useTheme.ts      # Light/dark mode
├── lib/
│   ├── firebase.ts      # Firebase init
│   ├── types.ts         # TypeScript interfaces
│   └── priority.ts      # Status calculation logic
└── App.tsx              # Main app, state management
```

## Data Model (Firestore)

**chores** collection:
- `name`, `category`, `minDays`, `maxDays`, `isOneTime`, `createdAt`, `createdBy`

**completions** collection:
- `choreId`, `completedAt`, `completedBy[]`, `collaborative`

**categories** collection:
- `name`, `createdAt`

**users** collection:
- Auto-created on first login with Google profile info

## Key Patterns

- **CSS Variables**: All colors use `var(--name)` for light/dark theming
- **Real-time sync**: All hooks use `onSnapshot` for live updates
- **Status calculation**: `priority.ts` computes status from `minDays`/`maxDays` and last completion
- **Collaborative completions**: If both users mark done within 10 min, records merge

## Status Logic

| Status | Condition |
|--------|-----------|
| comfortable | days since done < minDays |
| due-soon | minDays ≤ days < maxDays |
| overdue | days ≥ maxDays |
| severely-overdue | days ≥ maxDays × 3 |

## Environment Variables

Required in `.env` (see `.env.example`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Notes

- Only 2 users (household members) - no public signup
- Categories can be renamed; all chores in that category update
- One-time tasks show as "completed" after first completion
- Confetti animation plays on task completion
