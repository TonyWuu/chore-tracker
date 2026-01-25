# Choresy - Product Specification

## Overview

Choresy is a household chore tracking app designed for couples. It helps answer the question "what needs doing?" by tracking when tasks were last completed and surfacing overdue items.

## Users

- **Primary users**: A couple (2 people) sharing a household
- **Authentication**: Google Sign-In only
- **Access control**: Hardcoded UIDs in Firestore rules (no public registration)

## Core Concepts

### Chores

A recurring or one-time task that needs to be done periodically.

| Field | Description |
|-------|-------------|
| name | Display name (e.g., "Vacuum living room") |
| category | Grouping (e.g., "Kitchen", "Bathroom") |
| minDays | Minimum days before it's due (comfortable period) |
| maxDays | Maximum days before it's overdue |
| isOneTime | If true, task disappears after completion |

### Time Windows

Rather than fixed schedules, chores use flexible windows:

- **Comfortable** (green): Less than `minDays` since last done
- **Due soon** (yellow): Between `minDays` and `maxDays`
- **Overdue** (red): Past `maxDays`
- **Severely overdue** (pulsing red): Past `maxDays × 3`

Example: "Clean bathroom" with minDays=5, maxDays=10
- Days 0-4: Comfortable ("Due in X days")
- Days 5-9: Due soon ("Due in X days")
- Days 10+: Overdue ("Overdue by X days")

### Completions

A record of when a chore was done.

| Field | Description |
|-------|-------------|
| choreId | Reference to the chore |
| completedAt | Timestamp |
| completedBy | Array of user IDs who did it |
| collaborative | True if done together |

### Collaborative Completions

When marking a task done, users choose:
- **Just me**: Only the current user is credited
- **Together**: Both users are credited

If both users mark the same task within 10 minutes, the completions merge into a single collaborative record.

### Categories

Chores are grouped into categories (columns in the UI). Categories:
- Can be created, renamed, and deleted
- Deleting a category deletes all its chores
- Renaming updates all chores in that category

## Features

### Priority Queue

The main view shows all chores sorted by urgency:
1. Severely overdue first
2. Then overdue
3. Then due soon
4. Then comfortable
5. Completed one-time tasks at the bottom

### Column-Based Layout

- Desktop: Horizontal scrolling columns by category
- Mobile: Vertical stacking, full-width columns

### Task Actions

| Action | When Available | Effect |
|--------|---------------|--------|
| Done | Always | Opens completion modal |
| Edit | Always | Opens edit form |
| Skip | Severely overdue only | Resets timer without marking done |

### History

Each task shows completion history:
- Date and time of each completion
- Who completed it (You, Partner, or Together)
- History entries can be edited (change date) or deleted

### Theme

- Light mode (default): Purple accent, light backgrounds
- Dark mode: Deep purple, dark backgrounds
- Toggle in header, preference saved to localStorage
- Respects system preference on first visit

### Celebrations

Confetti animation plays when marking a task as done.

## UI Components

### Header
- App name "Choresy" with gradient text and sparkle icon
- Theme toggle (moon/sun)
- User avatar
- Sign out button

### Chore Column
- Category title (click to rename)
- Item count badge
- Add item button (+)
- Delete column button (×) with confirmation

### Chore Item
- Status indicator dot (colored by urgency)
- Task name
- Status badge ("Due in X days", "Overdue by X days")
- Expandable to show actions and history

### Modals
- **ChoreForm**: Add/edit task with name, category, min/max days, one-time toggle
- **CompletionModal**: "Just me" vs "Together" choice
- **SkipModal**: Reset fully or snooze until date
- **CategoryForm**: Create new category

## Technical Decisions

### Why Firebase?
- Real-time sync between two users
- Simple auth with Google
- No backend to maintain
- Generous free tier

### Why CSS Variables?
- Single source of truth for theming
- Easy light/dark mode switching
- No CSS-in-JS runtime overhead

### Why No State Management Library?
- App is simple enough for React hooks
- Real-time Firestore listeners handle sync
- Avoids unnecessary complexity

## Future Considerations

Potential features not yet implemented:
- Push notifications for overdue items
- Weekly stats/fairness tracker
- Drag and drop reordering
- Offline support (PWA)
- Recurring task templates
- Task notes/descriptions

## Non-Goals

- Public registration (this is private, household-only)
- More than 2 users
- Complex scheduling (cron-like)
- Gamification beyond celebrations
- Native mobile apps
