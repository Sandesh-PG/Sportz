import './Navbar.css';
import { NavLink } from 'react-router-dom';

export default function Navbar({ activeSport, onSportChange }) {
  const sports = ['All', 'Football', 'Cricket'];

  return (
    <header className="navbar">
      <NavLink className="brand" to="/" aria-label="Sportz home">
        <span className="brand-mark">S</span>
        <span>sportz</span>
      </NavLink>

      <nav className="primary-nav" aria-label="Primary navigation">
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/">Home</NavLink>
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/matches">Matches</NavLink>
      </nav>

      <div className="sport-filters" aria-label="Filter by sport">
        {sports.map((sport) => (
          <button
            className={`filter-button ${activeSport === sport ? 'selected' : ''}`}
            key={sport}
            onClick={() => onSportChange(sport)}
            type="button"
          >
            {sport}
          </button>
        ))}
      </div>
    </header>
  );
}
