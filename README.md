# 🕹️ Arcade Games

A modern React + Vite game suite featuring **Sudoku** and **XOX (Tic Tac Toe)** with a polished UI, gradient design, and full dark/light mode.

## Games

### 🔢 Sudoku
- 4 difficulty levels: Easy · Medium · Hard · Expert
- Live timer
- Max 3 hints per game (highlighted in amber)
- Max 3 mistakes before game over
- Undo & Erase buttons
- Note/pencil mode
- Conflict highlighting
- Keyboard support (arrow keys + numpad)

### ⭕ XOX (Tic Tac Toe)
- 2-Player mode
- vs AI Easy (random-ish moves)
- vs AI Hard (unbeatable minimax)
- Persistent score tracking
- Animated X/O drawing

## Setup

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

## Build for production

```bash
npm run build
npm run preview
```

## Tech Stack
- React 18
- Vite 4
- Pure CSS (no UI library)
- Google Fonts: Syne + JetBrains Mono + DM Sans
