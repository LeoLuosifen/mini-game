import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-arcade-blue' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-arcade-purple' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-arcade-yellow' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-arcade-pink' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-arcade-green' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-arcade-blue' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-arcade-pink' },
};

export default function Tetris() {
  const [grid, setGrid] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
  const [activePiece, setActivePiece] = useState<any>(null);
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<number | null>(null);

  const spawnPiece = useCallback(() => {
    const keys = Object.keys(TETROMINOS);
    const type = keys[Math.floor(Math.random() * keys.length)] as keyof typeof TETROMINOS;
    const piece = TETROMINOS[type];
    setActivePiece(piece);
    setPos({ x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: 0 });

    if (checkCollision(piece.shape, { x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: 0 }, grid)) {
      setGameOver(true);
    }
  }, [grid]);

  const checkCollision = (shape: number[][], position: { x: number, y: number }, currentGrid: any[][]) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && currentGrid[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const lockPiece = useCallback(() => {
    const newGrid = grid.map(row => [...row]);
    activePiece.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value) {
          if (pos.y + y >= 0) {
            newGrid[pos.y + y][pos.x + x] = activePiece.color;
          }
        }
      });
    });

    // Clear lines
    let linesCleared = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(0));
    }

    setGrid(filteredGrid);
    setScore(s => s + (linesCleared * 100));
    spawnPiece();
  }, [activePiece, grid, pos, spawnPiece]);

  const move = useCallback((dir: { x: number, y: number }) => {
    if (gameOver || !activePiece) return;
    const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
    if (!checkCollision(activePiece.shape, newPos, grid)) {
      setPos(newPos);
    } else if (dir.y > 0) {
      lockPiece();
    }
  }, [activePiece, gameOver, grid, lockPiece, pos]);

  const rotate = useCallback(() => {
    if (gameOver || !activePiece) return;
    const rotated = activePiece.shape[0].map((_: any, i: number) =>
      activePiece.shape.map((row: any) => row[i]).reverse()
    );
    if (!checkCollision(rotated, pos, grid)) {
      setActivePiece({ ...activePiece, shape: rotated });
    }
  }, [activePiece, gameOver, grid, pos]);

  useEffect(() => {
    if (!activePiece && !gameOver) spawnPiece();
  }, [activePiece, gameOver, spawnPiece]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') move({ x: -1, y: 0 });
      if (e.key === 'ArrowRight') move({ x: 1, y: 0 });
      if (e.key === 'ArrowDown') move({ x: 0, y: 1 });
      if (e.key === 'ArrowUp') rotate();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move, rotate]);

  useEffect(() => {
    gameLoopRef.current = window.setInterval(() => move({ x: 0, y: 1 }), 800);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [move]);

  const reset = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
    setScore(0);
    setGameOver(false);
    setActivePiece(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex justify-between w-full max-w-[200px] font-pixel text-[10px]">
        <span className="text-arcade-yellow">分数: {score}</span>
      </div>

      <div 
        className="relative bg-[#0a0a1a] border-4 border-black pixel-border overflow-hidden"
        style={{ width: COLS * BLOCK_SIZE, height: ROWS * BLOCK_SIZE }}
      >
        {/* Grid */}
        {grid.map((row, y) => row.map((cell, x) => (
          cell !== 0 && (
            <div 
              key={`${x}-${y}`}
              className={`absolute border border-black/20 ${cell}`}
              style={{ width: BLOCK_SIZE, height: BLOCK_SIZE, left: x * BLOCK_SIZE, top: y * BLOCK_SIZE }}
            />
          )
        )))}

        {/* Active Piece */}
        {activePiece && activePiece.shape.map((row: number[], y: number) => row.map((value: number, x: number) => (
          value !== 0 && (
            <div 
              key={`active-${x}-${y}`}
              className={`absolute border border-black/20 ${activePiece.color}`}
              style={{ 
                width: BLOCK_SIZE, 
                height: BLOCK_SIZE, 
                left: (pos.x + x) * BLOCK_SIZE, 
                top: (pos.y + y) * BLOCK_SIZE 
              }}
            />
          )
        )))}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-10">
            <h2 className="font-pixel text-lg text-arcade-pink">GAME OVER</h2>
            <button onClick={reset} className="pixel-button !text-[10px]">重试</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button onClick={rotate} className="pixel-button !p-3">↻</button>
        <div />
        <button onClick={() => move({ x: -1, y: 0 })} className="pixel-button !p-3">←</button>
        <button onClick={() => move({ x: 0, y: 1 })} className="pixel-button !p-3">↓</button>
        <button onClick={() => move({ x: 1, y: 0 })} className="pixel-button !p-3">→</button>
      </div>
    </div>
  );
}
