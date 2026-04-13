import { useState, useEffect } from 'react';
import './TicTacToe.css';

const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

const MODES = [
  { id: '2p',   label: '2 Players', icon: '⟡' },
  { id: 'easy', label: 'Easy AI',   icon: '◌' },
  { id: 'hard', label: 'Hard AI',   icon: '◈' },
];

function checkWinner(sq) {
  for (const [a,b,c] of LINES) {
    if (sq[a] && sq[a]===sq[b] && sq[a]===sq[c]) return { winner: sq[a], line: [a,b,c] };
  }
  if (sq.every(Boolean)) return { winner: 'draw', line: [] };
  return null;
}

function minimax(board, isMax, player, opp, depth) {
  const r = checkWinner(board);
  if (r) {
    if (r.winner === player) return 10 - depth;
    if (r.winner === opp) return depth - 10;
    return 0;
  }
  const scores = [];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = isMax ? player : opp;
      scores.push(minimax(board, !isMax, player, opp, depth+1));
      board[i] = null;
    }
  }
  return isMax ? Math.max(...scores) : Math.min(...scores);
}

function getBest(sq, player) {
  const opp = player==='X' ? 'O' : 'X';
  let best=-Infinity, move=-1;
  for (let i=0; i<9; i++) {
    if (!sq[i]) {
      sq[i]=player;
      const s = minimax([...sq], false, player, opp, 0);
      sq[i]=null;
      if (s>best) { best=s; move=i; }
    }
  }
  return move;
}

function getEasy(sq) {
  const e = sq.map((v,i)=>v?null:i).filter(v=>v!==null);
  return e[Math.floor(Math.random()*e.length)];
}

export default function TicTacToe() {
  const [mode, setMode] = useState('2p');
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [score, setScore] = useState({X:0,O:0,draw:0});
  const [result, setResult] = useState(null);
  const [newCells, setNewCells] = useState([]);
  const [thinking, setThinking] = useState(false);

  const isAI = mode !== '2p';
  const aiTurn = isAI && !isX && !result;

  function resetGame() {
    setSquares(Array(9).fill(null));
    setIsX(true); setResult(null); setNewCells([]); setThinking(false);
  }

  function makeMove(i, board, xTurn) {
    const next = [...board];
    next[i] = xTurn ? 'X' : 'O';
    setNewCells(p => [...p, i]);
    setSquares(next);
    const r = checkWinner(next);
    if (r) {
      setResult(r);
      setScore(s => ({...s, [r.winner]: (s[r.winner]||0)+1}));
      return true;
    }
    setIsX(!xTurn);
    return false;
  }

  function handleClick(i) {
    if (squares[i] || result || thinking || (isAI && !isX)) return;
    makeMove(i, squares, isX);
  }

  useEffect(() => {
    if (!aiTurn || result) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = mode==='hard' ? getBest([...squares],'O') : getEasy(squares);
      if (move!==-1 && move!==undefined) makeMove(move, squares, false);
      setThinking(false);
    }, mode==='hard' ? 550 : 280);
    return () => clearTimeout(t);
  }, [isX, result, mode, squares]);

  const statusText = () => {
    if (result) {
      if (result.winner==='draw') return "Draw";
      if (isAI) return result.winner==='X' ? 'You Win' : 'AI Wins';
      return `Player ${result.winner} Wins`;
    }
    if (thinking) return 'Thinking...';
    if (isAI && !isX) return 'AI…';
    return isAI ? 'Your Move' : `Player ${isX?'X':'O'}`;
  };

  return (
    <div className="ttt-wrap">
      {/* Mode tabs */}
      <div className="mode-row">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`mode-btn${mode===m.id?' active':''}`}
            onClick={()=>{ setMode(m.id); resetGame(); }}
          >
            <span className="m-icon">{m.icon}</span>
            <span className="m-label">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      <div className="scoreboard">
        <div className={`sc-card x-card${isX&&!result?' turn':''}`}>
          <div className="sc-symbol x-sym">✕</div>
          <div className="sc-name">{isAI ? 'You' : 'Player X'}</div>
          <div className="sc-score">{score.X}</div>
          {isX && !result && <div className="turn-bar x-bar" />}
        </div>

        <div className="sc-middle">
          <div className="sc-mid-label">VS</div>
          <div className="sc-draw-box">
            <span className="sc-draw-n">{score.draw}</span>
            <span className="sc-draw-l">Draw</span>
          </div>
        </div>

        <div className={`sc-card o-card${!isX&&!result?' turn':''}`}>
          <div className="sc-symbol o-sym">◯</div>
          <div className="sc-name">{isAI ? 'AI' : 'Player O'}</div>
          <div className="sc-score">{score.O}</div>
          {!isX && !result && <div className="turn-bar o-bar" />}
        </div>
      </div>

      {/* Status */}
      <div className="ttt-status-row">
        <span className={`ttt-status${result?' res-status':''}`}>{statusText()}</span>
        {thinking && <span className="think-dots"><span/><span/><span/></span>}
      </div>

      {/* Board */}
      <div className="ttt-board-outer">
        {/* Glow lines for grid */}
        <div className="grid-line gl-v1" />
        <div className="grid-line gl-v2" />
        <div className="grid-line gl-h1" />
        <div className="grid-line gl-h2" />

        <div className={`ttt-board${thinking?' busy':''}`}>
          {squares.map((sq,i) => {
            const isWin = result && result.line.includes(i);
            const isNew = newCells[newCells.length-1]===i;
            return (
              <button
                key={i}
                className={[
                  'ttt-cell',
                  sq ? `has-${sq.toLowerCase()}` : 'empty',
                  isWin ? 'win-cell' : '',
                  isNew ? 'pop' : '',
                ].filter(Boolean).join(' ')}
                onClick={()=>handleClick(i)}
                disabled={!!sq||!!result||(isAI&&!isX)||thinking}
              >
                {sq==='X' && (
                  <div className="sym-wrap">
                    <svg className="sym-svg x-svg" viewBox="0 0 60 60">
                      <line x1="13" y1="13" x2="47" y2="47" strokeLinecap="round" strokeWidth="6"/>
                      <line x1="47" y1="13" x2="13" y2="47" strokeLinecap="round" strokeWidth="6"/>
                    </svg>
                  </div>
                )}
                {sq==='O' && (
                  <div className="sym-wrap">
                    <svg className="sym-svg o-svg" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="17" strokeWidth="6" fill="none"/>
                    </svg>
                  </div>
                )}
                {!sq && <div className="cell-hover-hint" />}
              </button>
            );
          })}
        </div>

        {/* Win line overlay */}
        {result && result.winner !== 'draw' && (
          <WinLine line={result.line} winner={result.winner} />
        )}
      </div>

      {/* Result actions */}
      {result && (
        <div className="result-actions">
          <button className={`res-btn${result.winner==='X'?' x-win-btn':result.winner==='O'?' o-win-btn':' draw-btn'}`} onClick={resetGame}>
            Play Again
          </button>
          <button className="reset-btn" onClick={()=>{ setScore({X:0,O:0,draw:0}); resetGame(); }}>
            Reset Score
          </button>
        </div>
      )}
    </div>
  );
}

function WinLine({ line, winner }) {
  const positions = {
    '0,1,2': { top:'16.5%', left:'5%', width:'90%', height:'2px', transform:'none' },
    '3,4,5': { top:'49.8%', left:'5%', width:'90%', height:'2px', transform:'none' },
    '6,7,8': { top:'83.3%', left:'5%', width:'90%', height:'2px', transform:'none' },
    '0,3,6': { top:'5%', left:'16.5%', width:'2px', height:'90%', transform:'none' },
    '1,4,7': { top:'5%', left:'49.8%', width:'2px', height:'90%', transform:'none' },
    '2,5,8': { top:'5%', left:'83.3%', width:'2px', height:'90%', transform:'none' },
    '0,4,8': { top:'50%', left:'50%', width:'128%', height:'2px', transform:'translate(-50%,-50%) rotate(45deg)' },
    '2,4,6': { top:'50%', left:'50%', width:'128%', height:'2px', transform:'translate(-50%,-50%) rotate(-45deg)' },
  };
  const key = line.join(',');
  const style = positions[key];
  if (!style) return null;
  const color = winner==='X' ? 'var(--red)' : 'var(--cyan)';
  const glow  = winner==='X' ? 'var(--glow-red)' : 'var(--glow-cyan)';
  return (
    <div className="win-line" style={{...style, background: color, boxShadow: glow}} />
  );
}
