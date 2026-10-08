import { useState } from 'react';
import './Navbar.css';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ activeSport, onSportChange }) {
  const sports = ['All', 'Football', 'Cricket'];
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try { await logout(); setProfileOpen(false); }
    catch (error) { console.error('Logout failed:', error); }
  };

  return (
    <header className="navbar">
      <NavLink className="brand" to="/" aria-label="Sportz home"><span className="brand-mark">S</span><span>sportz</span></NavLink>
      <nav className="primary-nav" aria-label="Primary navigation">
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/">Home</NavLink>
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/matches">Matches</NavLink>
      </nav>
      <div className="sport-filters" aria-label="Filter by sport">
        {sports.map((sport) => <button className={`filter-button ${activeSport === sport ? 'selected' : ''}`} key={sport} onClick={() => onSportChange(sport)} type="button">{sport}</button>)}
      </div>
      <div className="auth-nav">
        {isAuthenticated ? (
          <div className="profile-menu">
            <button className="profile-button" type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-haspopup="menu">
              <span className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              <span className="profile-name">{user?.name || 'Profile'}</span>
              <span className={`profile-chevron ${profileOpen ? 'open' : ''}`}>⌄</span>
            </button>
            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-info"><strong>{user?.name}</strong><span>{user?.email}</span>{user?.role && <small>{user.role}</small>}</div>
                <div className="profile-divider" />
                <button className="logout-button" type="button" onClick={handleLogout} disabled={isLoading}>{isLoading ? 'Logging out...' : 'Logout'}</button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-actions"><NavLink className="login-link" to="/login">Login</NavLink><NavLink className="signup-button" to="/register">Sign Up</NavLink></div>
        )}
      </div>
    </header>
  );
}
