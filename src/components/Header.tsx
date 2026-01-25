import type { User } from 'firebase/auth';
import './Header.css';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header-title">
        <span className="title-icon">✨</span>
        <span className="title-text">Choresy</span>
      </h1>
      <div className="header-user">
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="header-avatar"
          />
        )}
        <button onClick={onLogout} className="logout-button">
          Sign Out
        </button>
      </div>
    </header>
  );
}
