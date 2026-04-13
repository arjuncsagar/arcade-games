// Sudoku generator utility

export function generateSudoku(difficulty = 'medium') {
  const board = createEmptyBoard();
  fillBoard(board);
  const solution = board.map(r => [...r]);
  
  const cluesMap = { easy: 46, medium: 34, hard: 26, expert: 22 };
  const clues = cluesMap[difficulty] || 34;
  const cellsToRemove = 81 - clues;
  
  removeNumbers(board, cellsToRemove);
  
  return {
    puzzle: board.map(r => [...r]),
    solution,
    given: board.map(r => r.map(v => v !== 0)),
  };
}

function createEmptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = boxRow; i < boxRow + 3; i++) {
    for (let j = boxCol; j < boxCol + 3; j++) {
      if (board[i][j] === num) return false;
    }
  }
  return true;
}

function fillBoard(board) {
  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (const num of shuffle([...nums])) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function removeNumbers(board, count) {
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i/9), i%9])
  );
  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= count) break;
    board[r][c] = 0;
    removed++;
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getHint(puzzle, solution, given) {
  const empties = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!given[r][c] && puzzle[r][c] === 0) {
        empties.push([r, c]);
      }
    }
  }
  if (empties.length === 0) return null;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  return { row: r, col: c, value: solution[r][c] };
}

export function checkComplete(puzzle, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export function getConflicts(puzzle) {
  const conflicts = new Set();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = puzzle[r][c];
      if (!v) continue;
      // row
      for (let cc = 0; cc < 9; cc++) {
        if (cc !== c && puzzle[r][cc] === v) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r},${cc}`);
        }
      }
      // col
      for (let rr = 0; rr < 9; rr++) {
        if (rr !== r && puzzle[rr][c] === v) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${rr},${c}`);
        }
      }
      // box
      const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
      for (let rr = br; rr < br+3; rr++) {
        for (let cc = bc; cc < bc+3; cc++) {
          if ((rr !== r || cc !== c) && puzzle[rr][cc] === v) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${rr},${cc}`);
          }
        }
      }
    }
  }
  return conflicts;
}
