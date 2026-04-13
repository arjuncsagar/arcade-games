import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import Sudoku from './games/Sudoku.jsx';
import TicTacToe from './games/TicTacToe.jsx';
import './App.css';

const GAMES = [
  { id: 'sudoku', label: 'Sudoku', icon: '◈', grad: 'var(--g-cyan)', glow: 'var(--glow-cyan-sm)' },
  { id: 'xox',    label: 'XOX',    icon: '◉', grad: 'var(--g-gold)', glow: 'var(--glow-gold-sm)' },
];

export default function App() {
  const [active, setActive] = useState('sudoku');
  const { theme, toggle } = useTheme();

  return (
    <div className="app-shell" data-game={active}>
      {/* Ambient background */}
      <div className="ambient" aria-hidden="true">
        <div className="amb-orb amb-orb-1" />
        <div className="amb-orb amb-orb-2" />
        <div className="amb-orb amb-orb-3" />
        <div className="amb-grid" />
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="hdr-inner">
          <div className="brand">
            <div className="brand-logo">🕹</div>
            <span className="brand-name">Arcade</span>
          </div>

          <nav className="nav-tabs">
            {GAMES.map(g => (
              <button
                key={g.id}
                className={`nav-tab${active === g.id ? ' active' : ''}`}
                style={active === g.id ? { '--tab-grad': g.grad, '--tab-glow': g.glow } : {}}
                onClick={() => setActive(g.id)}
              >
                <span className="tab-icon">{g.icon}</span>
                <span className="tab-label">{g.label}</span>
              </button>
            ))}
          </nav>

          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Game */}
      <main className="game-area">
        <div className="game-panel" key={active}>
          {active === 'sudoku' && <Sudoku />}
          {active === 'xox'    && <TicTacToe />}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-dot" />
        <span className="footer-text">Arcade · Premium Games</span>
        <div className="footer-dot" />
      </footer>
    </div>
  );
}
