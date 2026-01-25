import { useState, useEffect } from 'react';
import { isIOSPWA } from '../hooks/useAuth';
import './LoginScreen.css';

interface LoginScreenProps {
  onSignIn: () => void;
}

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [showSafariOption, setShowSafariOption] = useState(false);

  useEffect(() => {
    setShowSafariOption(isIOSPWA());
  }, []);

  const openInSafari = () => {
    // Get the current URL
    const url = window.location.origin + window.location.pathname;

    // Create a temporary anchor element and click it
    // This is more reliable for opening in Safari from iOS PWA
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';

    // Append to body, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">Chore Tracker</h1>
        <p className="login-subtitle">
          Keep track of household chores with your partner
        </p>
        <button onClick={onSignIn} className="google-sign-in-button">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        {showSafariOption && (
          <div className="safari-fallback">
            <p className="safari-hint">
              Having trouble with the keyboard?
            </p>
            <button onClick={openInSafari} className="open-safari-button">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.243 5.757L11.5 12.5 7.757 8.757l-.014.014L12 4.528l4.243 4.243v-1.014zM12 19.472l-4.243-4.243.014-.014L12.5 11.5l4.743 4.743-1.014-.014L12 19.472z"/>
              </svg>
              Open in Safari
            </button>
            <p className="safari-alt-hint">
              Or long-press the Sign in button and tap "Open in Safari"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
