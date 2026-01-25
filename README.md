# Chore Tracker

A household chore tracking app for two users. Track when chores were last done and see what needs doing next based on flexible time windows.

## Features

- Priority queue showing most urgent chores first
- Flexible intervals (min/max days) for each chore
- Track who completed each chore (solo or together)
- One-time tasks support
- Skip/snooze for severely overdue chores
- Real-time sync between users
- Works on mobile and desktop

## Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** > Sign-in method > **Google**
4. Create a **Firestore Database** (start in test mode, then apply rules)
5. Go to Project Settings > Your apps > Add a **Web app**
6. Copy the Firebase config values

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Set Up Firestore Security Rules

1. Sign in to the app with both users (you and your partner)
2. Find your UIDs in Firebase Console > Authentication > Users
3. Update `firestore.rules` with both UIDs:
   ```javascript
   function isHouseholdMember() {
     return request.auth != null &&
            request.auth.uid in ['YOUR_UID', 'PARTNER_UID'];
   }
   ```
4. Deploy rules via Firebase Console or CLI:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 4. Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 5. Deploy to GitHub Pages

1. Push to GitHub
2. Go to Settings > Secrets > Actions
3. Add your Firebase config as secrets (same names as `.env` variables)
4. Go to Settings > Pages > Source > **GitHub Actions**
5. Push to `main` branch to trigger deploy

## Project Structure

```
src/
├── components/       # React components
├── hooks/           # Custom hooks for Firebase
├── lib/             # Types, Firebase config, priority logic
├── App.tsx          # Main app component
└── App.css          # Global styles
```

## Tech Stack

- React + TypeScript
- Vite
- Firebase (Firestore + Auth)
- date-fns
