import React, { useState, useEffect } from 'react';

const GRID_SIZE = 3;

export default function Puzzle() {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);

  const initGame = () => {
    const initial = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
    // Shuffle
    for (let i = initial.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [initial[i], initial[j]] = [initial[j], initial[i]];
    }
    setTiles(initial);
    setMoves(0);
    setSolved(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleTileClick = (index: number) => {
    if (solved) return;
    
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
    const emptyCol = emptyIndex % GRID_SIZE;

    const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves(m => m + 1);

      // Check if solved
      const isSolved = newTiles.every((tile, i) => tile === (i + 1) % (GRID_SIZE * GRID_SIZE));
      if (isSolved) setSolved(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex justify-between w-full max-w-[300px] font-pixel text-[10px]">
        <span className="text-arcade-yellow">步数: {moves}</span>
        {solved && <span className="text-arcade-green">完成!</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 bg-[#0a0a1a] p-2 border-4 border-black pixel-border">
        {tiles.map((tile, i) => (
          <button
            key={i}
            onClick={() => handleTileClick(i)}
            className={`w-20 h-20 font-pixel text-lg flex items-center justify-center transition-all ${
              tile === 0 
              ? 'bg-transparent' 
              : 'bg-arcade-purple text-white pixel-border hover:brightness-110'
            }`}
          >
            {tile !== 0 && tile}
          </button>
        ))}
      </div>

      <button onClick={initGame} className="pixel-button mt-4">重新洗牌</button>
      <p className="text-gray-500 text-[10px] font-pixel">点击空白格相邻的方块进行移动</p>
    </div>
  );
}
