import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const BOARD_SIZE = 8;
const COLORS = ['bg-arcade-pink', 'bg-arcade-blue', 'bg-arcade-green', 'bg-arcade-purple', 'bg-arcade-yellow'];

interface Tile {
  id: number;
  color: string;
}

export default function Match3() {
  const [board, setBoard] = useState<(Tile | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const nextId = useRef(0);
  const checkMatchesRef = useRef<() => void>(() => {});

  const createBoard = useCallback(() => {
    const newBoard: (Tile | null)[] = [];
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      const row = Math.floor(i / BOARD_SIZE);
      const col = i % BOARD_SIZE;
      
      let color;
      // Ensure no matches on initial board
      do {
        color = COLORS[Math.floor(Math.random() * COLORS.length)];
      } while (
        (col >= 2 && newBoard[i - 1]?.color === color && newBoard[i - 2]?.color === color) ||
        (row >= 2 && newBoard[i - BOARD_SIZE]?.color === color && newBoard[i - 2 * BOARD_SIZE]?.color === color)
      );
      
      newBoard.push({
        id: nextId.current++,
        color: color
      });
    }
    setBoard(newBoard);
    setIsProcessing(false);
  }, []);

  const applyGravity = useCallback(() => {
    setBoard(prevBoard => {
      let newBoard = [...prevBoard];
      
      // Apply gravity (drop tiles down)
      for (let c = 0; c < BOARD_SIZE; c++) {
        let emptySpots = 0;
        for (let r = BOARD_SIZE - 1; r >= 0; r--) {
          const idx = r * BOARD_SIZE + c;
          if (newBoard[idx] === null) {
            emptySpots++;
          } else if (emptySpots > 0) {
            const targetIdx = (r + emptySpots) * BOARD_SIZE + c;
            newBoard[targetIdx] = newBoard[idx];
            newBoard[idx] = null;
          }
        }
        // Fill top with new tiles
        for (let r = 0; r < emptySpots; r++) {
          const idx = r * BOARD_SIZE + c;
          newBoard[idx] = {
            id: nextId.current++,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
          };
        }
      }

      // After gravity, check for new matches (cascades)
      setTimeout(() => checkMatchesRef.current(), 500);
      return newBoard;
    });
  }, []);

  const checkMatches = useCallback(() => {
    setBoard(prevBoard => {
      let newBoard = [...prevBoard];
      const matchedIndices = new Set<number>();

      // Horizontal matches
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE - 2; c++) {
          const idx = r * BOARD_SIZE + c;
          if (newBoard[idx] && newBoard[idx+1] && newBoard[idx+2] &&
              newBoard[idx]?.color === newBoard[idx + 1]?.color && 
              newBoard[idx]?.color === newBoard[idx + 2]?.color) {
            matchedIndices.add(idx);
            matchedIndices.add(idx + 1);
            matchedIndices.add(idx + 2);
          }
        }
      }

      // Vertical matches
      for (let c = 0; c < BOARD_SIZE; c++) {
        for (let r = 0; r < BOARD_SIZE - 2; r++) {
          const idx = r * BOARD_SIZE + c;
          const idxBelow = (r + 1) * BOARD_SIZE + c;
          const idxBelow2 = (r + 2) * BOARD_SIZE + c;
          if (newBoard[idx] && newBoard[idxBelow] && newBoard[idxBelow2] &&
              newBoard[idx]?.color === newBoard[idxBelow]?.color && 
              newBoard[idx]?.color === newBoard[idxBelow2]?.color) {
            matchedIndices.add(idx);
            matchedIndices.add(idxBelow);
            matchedIndices.add(idxBelow2);
          }
        }
      }

      if (matchedIndices.size > 0) {
        setIsProcessing(true);
        setScore(s => s + matchedIndices.size * 10);
        
        // Phase 1: Clear matched tiles
        matchedIndices.forEach(idx => {
          newBoard[idx] = null;
        });

        // Phase 2: Wait then apply gravity
        setTimeout(applyGravity, 400);
        return newBoard;
      } else {
        setIsProcessing(false);
        return prevBoard;
      }
    });
  }, [applyGravity]);

  const handleTileClick = (index: number) => {
    if (isProcessing) return;

    if (selected === null) {
      setSelected(index);
    } else {
      const isAdjacent = Math.abs(Math.floor(selected / 8) - Math.floor(index / 8)) + 
                        Math.abs((selected % 8) - (index % 8)) === 1;

      if (isAdjacent) {
        setIsProcessing(true);
        const newBoard = [...board];
        [newBoard[selected], newBoard[index]] = [newBoard[index], newBoard[selected]];
        
        setBoard(newBoard);
        
        setTimeout(() => {
          const hasMatch = checkMatchesAfterSwap(newBoard);
          if (!hasMatch) {
            const revertedBoard = [...newBoard];
            [revertedBoard[selected], revertedBoard[index]] = [revertedBoard[index], revertedBoard[selected]];
            setBoard(revertedBoard);
            setIsProcessing(false);
          } else {
            checkMatches();
          }
        }, 300);
      }
      setSelected(null);
    }
  };

  const checkMatchesAfterSwap = (currentBoard: (Tile | null)[]) => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        const idx = r * BOARD_SIZE + c;
        if (currentBoard[idx] && currentBoard[idx+1] && currentBoard[idx+2] &&
            currentBoard[idx]?.color === currentBoard[idx + 1]?.color && 
            currentBoard[idx]?.color === currentBoard[idx + 2]?.color) return true;
      }
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 2; r++) {
        const idx = r * BOARD_SIZE + c;
        if (currentBoard[idx] && currentBoard[(r+1)*BOARD_SIZE+c] && currentBoard[(r+2)*BOARD_SIZE+c] &&
            currentBoard[idx]?.color === currentBoard[(r+1)*BOARD_SIZE+c]?.color && 
            currentBoard[idx]?.color === currentBoard[(r+2)*BOARD_SIZE+c]?.color) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    checkMatchesRef.current = checkMatches;
  }, [checkMatches]);

  useEffect(() => {
    createBoard();
  }, [createBoard]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="font-pixel text-xs text-arcade-yellow">分数: {score}</div>
      
      <div className="grid grid-cols-8 gap-1 bg-[#0a0a1a] p-1 border-4 border-black pixel-border relative overflow-hidden">
        {board.map((tile, i) => (
          <div key={`slot-${i}`} className="w-8 h-8 sm:w-10 sm:h-10 bg-black/20 pixel-border relative">
            <AnimatePresence>
              {tile && (
                <motion.button
                  key={tile.id}
                  layoutId={tile.id.toString()}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                  onClick={() => handleTileClick(i)}
                  className={`absolute inset-0 w-full h-full pixel-border ${tile.color} ${
                    selected === i ? 'scale-75 brightness-150 z-10' : 'hover:brightness-110'
                  }`}
                />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <button onClick={createBoard} className="pixel-button mt-4">重置棋盘</button>
    </div>
  );
}
