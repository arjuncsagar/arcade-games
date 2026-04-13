import { useState, useEffect, useCallback } from 'react';
import { generateSudoku, getHint, checkComplete, getConflicts } from '../utils/sudoku';
import { useTimer } from '../hooks/useTimer';
import './Sudoku.css';

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   color: 'var(--green)' },
  { id: 'medium', label: 'Medium', color: 'var(--cyan)' },
  { id: 'hard',   label: 'Hard',   color: 'var(--gold)' },
  { id: 'expert', label: 'Expert', color: 'var(--red)' },
];
const MAX_HINTS = 3;
const MAX_MISTAKES = 3;

export default function Sudoku() {
  const [difficulty, setDifficulty] = useState('medium');
  const [gameState, setGameState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hints, setHints] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [history, setHistory] = useState([]);
  const [hintCells, setHintCells] = useState(new Set());
  const [status, setStatus] = useState('idle');
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState({});
  const [winAnim, setWinAnim] = useState(false);
  const [shakeCell, setShakeCell] = useState(null);
  const timer = useTimer();

  const startGame = useCallback((diff = difficulty) => {
    const { puzzle, solution, given } = generateSudoku(diff);
    setGameState({ puzzle: puzzle.map(r => [...r]), solution, given });
    setSelected(null); setHints(0); setMistakes(0); setHistory([]);
    setHintCells(new Set()); setStatus('playing');
    setNotes({}); setNoteMode(false); setWinAnim(false);
    timer.reset();
    setTimeout(() => timer.start(), 60);
  }, [difficulty]);

  useEffect(() => { startGame(); }, []);

  const conflicts = gameState ? getConflicts(gameState.puzzle) : new Set();

  const handleNumber = useCallback((num) => {
    if (!selected || status !== 'playing' || !timer.running) return;
    const [r, c] = selected;
    if (gameState.given[r][c]) return;

    if (noteMode && num !== 0) {
      const key = `${r},${c}`;
      setNotes(prev => {
        const s = new Set(prev[key] || []);
        s.has(num) ? s.delete(num) : s.add(num);
        return { ...prev, [key]: s };
      });
      return;
    }

    const prevPuzzle = gameState.puzzle.map(row => [...row]);
    const prevNotes = JSON.parse(JSON.stringify(notes, (k, v) => v instanceof Set ? [...v] : v));
    setHistory(h => [...h, { puzzle: prevPuzzle, notes: prevNotes }]);

    const newPuzzle = gameState.puzzle.map(row => [...row]);
    newPuzzle[r][c] = num;
    if (num !== 0) setNotes(prev => { const n = {...prev}; delete n[`${r},${c}`]; return n; });

    let newMistakes = mistakes;
    if (num !== 0 && num !== gameState.solution[r][c]) {
      newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setShakeCell(`${r},${c}`);
      setTimeout(() => setShakeCell(null), 500);
    }

    setGameState(gs => ({ ...gs, puzzle: newPuzzle }));
    if (newMistakes >= MAX_MISTAKES) { setStatus('lost'); timer.pause(); return; }
    if (checkComplete(newPuzzle, gameState.solution)) {
      setStatus('won'); timer.pause(); setWinAnim(true);
    }
  }, [selected, status, gameState, mistakes, noteMode, notes]);

  const handleHint = () => {
    if (hints >= MAX_HINTS || status !== 'playing') return;
    const hint = getHint(gameState.puzzle, gameState.solution, gameState.given);
    if (!hint) return;
    const { row, col, value } = hint;
    const newPuzzle = gameState.puzzle.map(r => [...r]);
    newPuzzle[row][col] = value;
    setGameState(gs => ({ ...gs, puzzle: newPuzzle }));
    setHints(h => h + 1);
    const key = `${row},${col}`;
    setHintCells(prev => new Set([...prev, key]));
    setNotes(prev => { const n = {...prev}; delete n[key]; return n; });
    if (checkComplete(newPuzzle, gameState.solution)) { setStatus('won'); timer.pause(); setWinAnim(true); }
  };

  const handleUndo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGameState(gs => ({ ...gs, puzzle: prev.puzzle }));
    const restored = {};
    if (prev.notes) Object.entries(prev.notes).forEach(([k,v]) => { restored[k] = new Set(v); });
    setNotes(restored);
  };

  const handleErase = () => {
    if (!selected || status !== 'playing') return;
    const [r, c] = selected;
    if (gameState.given[r][c]) return;
    const prev = gameState.puzzle.map(row => [...row]);
    setHistory(h => [...h, { puzzle: prev, notes }]);
    const newPuzzle = gameState.puzzle.map(row => [...row]);
    newPuzzle[r][c] = 0;
    setGameState(gs => ({ ...gs, puzzle: newPuzzle }));
    setNotes(prev => { const n = {...prev}; delete n[`${r},${c}`]; return n; });
    setHintCells(prev => { const s = new Set(prev); s.delete(`${r},${c}`); return s; });
  };

  useEffect(() => {
    const h = (e) => {
      if (status !== 'playing') return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) handleNumber(n);
      if (['Backspace','Delete','0'].includes(e.key)) handleNumber(0);
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if (selected) {
        const map = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
        if (map[e.key]) {
          e.preventDefault();
          const [dr, dc] = map[e.key];
          setSelected(([r,c]) => [Math.max(0,Math.min(8,r+dr)), Math.max(0,Math.min(8,c+dc))]);
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleNumber, status, selected]);

  const getRegion = () => {
    if (!selected) return new Set();
    const [sr, sc] = selected;
    const s = new Set();
    for (let i = 0; i < 9; i++) { s.add(`${sr},${i}`); s.add(`${i},${sc}`); }
    const br = Math.floor(sr/3)*3, bc = Math.floor(sc/3)*3;
    for (let r = br; r < br+3; r++) for (let c = bc; c < bc+3; c++) s.add(`${r},${c}`);
    return s;
  };

  const region = getRegion();
  const selVal = selected && gameState ? gameState.puzzle[selected[0]][selected[1]] : 0;
  const sameVal = selVal > 0
    ? new Set(gameState?.puzzle.flatMap((row,r) => row.map((v,c) => v===selVal ? `${r},${c}` : null)).filter(Boolean))
    : new Set();

  const diffInfo = DIFFICULTIES.find(d => d.id === difficulty);
  const progressCount = gameState ? gameState.puzzle.flat().filter(v => v !== 0).length : 0;
  const progress = Math.round((progressCount / 81) * 100);

  // Count how many times each digit 1-9 appears in the current puzzle
  const digitCounts = {};
  if (gameState) {
    for (let n = 1; n <= 9; n++) digitCounts[n] = 0;
    gameState.puzzle.flat().forEach(v => { if (v > 0) digitCounts[v]++; });
  }

  return (
    <div className="sdk-wrap">
      {/* Difficulty selector */}
      <div className="sdk-header">
        <div className="diff-row">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              className={`diff-btn${difficulty === d.id ? ' active' : ''}`}
              style={difficulty === d.id ? { '--dc': d.color } : {}}
              onClick={() => { setDifficulty(d.id); startGame(d.id); }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button className="new-game-btn glow-btn" onClick={() => startGame()}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          New Game
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-chip timer-chip">
          <button
            className={`timer-toggle-btn${timer.running ? ' running' : ' paused'}`}
            onClick={() => status === 'playing' && timer.toggle()}
            disabled={status !== 'playing'}
            aria-label={timer.running ? 'Pause timer' : 'Start timer'}
          >
            {timer.running ? (
              /* Pause icon */
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="3" width="5" height="18" rx="1"/><rect x="15" y="3" width="5" height="18" rx="1"/>
              </svg>
            ) : (
              /* Play icon */
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>
          <span className={`stat-time${timer.running ? ' active' : ' paused-dim'}`}>{timer.formatted}</span>
        </div>

        <div className="progress-chip">
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="prog-label">{progress}%</span>
        </div>

        <div className="stat-chip">
          <span className="stat-label">Err</span>
          <div className="pips-row">
            {[0,1,2].map(i => <span key={i} className={`pip${i < mistakes ? ' err' : ''}`} />)}
          </div>
        </div>

        <div className="stat-chip">
          <span className="stat-label">Hints</span>
          <div className="pips-row">
            {[0,1,2].map(i => <span key={i} className={`pip${i < hints ? ' hint' : ''}`} />)}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="board-outer">
        {/* Corner decorations */}
        <div className="corner c-tl" /><div className="corner c-tr" />
        <div className="corner c-bl" /><div className="corner c-br" />

        <div className={`sdk-board${winAnim ? ' won' : ''}`}>
          {gameState && gameState.puzzle.map((row, r) =>
            row.map((val, c) => {
              const key = `${r},${c}`;
              const isSel = selected && selected[0]===r && selected[1]===c;
              const isReg = region.has(key);
              const isSame = sameVal.has(key);
              const isConf = conflicts.has(key);
              const isHint = hintCells.has(key);
              const isGiven = gameState.given[r][c];
              const isShake = shakeCell === key;
              const cellNotes = notes[key];
              const bRight = (c+1)%3===0 && c!==8;
              const bBot   = (r+1)%3===0 && r!==8;

              return (
                <div
                  key={key}
                  className={[
                    'cell',
                    isSel   ? 'sel' : '',
                    isReg && !isSel ? 'reg' : '',
                    isSame && !isSel ? 'same' : '',
                    isConf  ? 'conf' : '',
                    isGiven ? 'given' : '',
                    isHint  ? 'hint-c' : '',
                    isShake ? 'shake' : '',
                    bRight  ? 'br' : '',
                    bBot    ? 'bb' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => status==='playing' && timer.running && setSelected([r,c])}
                >
                  {val !== 0 ? (
                    <span className="cnum">{val}</span>
                  ) : cellNotes?.size > 0 ? (
                    <div className="note-grid">
                      {[1,2,3,4,5,6,7,8,9].map(n => (
                        <span key={n} className={`n${cellNotes.has(n) ? ' on' : ''}`}>{n}</span>
                      ))}
                    </div>
                  ) : null}
                  {isSel && <div className="cell-glow" />}
                </div>
              );
            })
          )}
        </div>

        {/* Overlays */}
        {status === 'won' && (
          <div className="board-overlay win-overlay">
            <div className="ov-icon">✦</div>
            <div className="ov-title">Solved</div>
            <div className="ov-stats">{timer.formatted} · {mistakes} err · {hints} hints</div>
            <button className="ov-btn glow-btn" onClick={() => startGame()}>Play Again</button>
          </div>
        )}
        {status === 'playing' && !timer.running && (
          <div className="board-overlay pause-overlay" onClick={() => timer.start()}>
            <div className="ov-icon pause-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </div>
            <div className="ov-title pause-title">Paused</div>
            <div className="ov-stats">Click to resume</div>
          </div>
        )}
        {status === 'lost' && (
          <div className="board-overlay lose-overlay">
            <div className="ov-icon">✕</div>
            <div className="ov-title">Game Over</div>
            <div className="ov-stats">3 mistakes reached</div>
            <button className="ov-btn lose-btn glow-btn" onClick={() => startGame()}>Try Again</button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="sdk-actions">
        <button className="act-btn" onClick={handleUndo} disabled={!history.length}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
          Undo
        </button>
        <button className="act-btn" onClick={handleErase} disabled={!selected || (gameState && selected && gameState.given[selected[0]][selected[1]])}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l10-10 7 7-1.5 1.5"/><path d="M6.5 17.5l5-5"/></svg>
          Erase
        </button>
        <button className={`act-btn${noteMode ? ' note-on' : ''}`} onClick={() => setNoteMode(n => !n)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          {noteMode ? 'Notes ON' : 'Notes'}
        </button>
        <button className="act-btn hint-btn" onClick={handleHint} disabled={hints >= MAX_HINTS || status !== 'playing'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Hint ({MAX_HINTS - hints})
        </button>
      </div>

      {/* Numpad */}
      <div className="numpad">
        {[1,2,3,4,5,6,7,8,9].map(n => {
          const count = digitCounts[n] || 0;
          const complete = count >= 9;
          const remaining = 9 - count;
          return (
            <button
              key={n}
              className={`np-btn${selVal === n ? ' active' : ''}${complete ? ' complete' : ''}`}
              onClick={() => !complete && handleNumber(n)}
              disabled={complete}
              title={complete ? `${n} fully placed` : `${remaining} remaining`}
            >
              <span className="np-num">{n}</span>
              {!complete && <span className="np-remain">{remaining}</span>}
              {complete && (
                <span className="np-check">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
              {selVal === n && <span className="np-glow" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
