import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

export default function Snake() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameLoopRef = useRef<number | null>(null);
  const directionRef = useRef(INITIAL_DIRECTION);
  const nextDirectionsRef = useRef<{ x: number; y: number }[]>([]);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    setFood(newFood);
  }, []);

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      // Process next direction from queue
      if (nextDirectionsRef.current.length > 0) {
        directionRef.current = nextDirectionsRef.current.shift()!;
      }
      
      const head = { 
        x: prevSnake[0].x + directionRef.current.x, 
        y: prevSnake[0].y + directionRef.current.y 
      };

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        return prevSnake;
      }

      // Self collision
      if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 10);
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const lastDir = nextDirectionsRef.current.length > 0 
        ? nextDirectionsRef.current[nextDirectionsRef.current.length - 1] 
        : directionRef.current;

      let nextDir = null;
      switch (e.key) {
        case 'ArrowUp': if (lastDir.y === 0) nextDir = { x: 0, y: -1 }; break;
        case 'ArrowDown': if (lastDir.y === 0) nextDir = { x: 0, y: 1 }; break;
        case 'ArrowLeft': if (lastDir.x === 0) nextDir = { x: -1, y: 0 }; break;
        case 'ArrowRight': if (lastDir.x === 0) nextDir = { x: 1, y: 0 }; break;
      }

      if (nextDir && nextDirectionsRef.current.length < 2) {
        nextDirectionsRef.current.push(nextDir);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (gameOver) return;
    gameLoopRef.current = window.setInterval(moveSnake, 120);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, gameOver]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionsRef.current = [];
    setGameOver(false);
    setScore(0);
    generateFood();
  };

  const handleDirectionChange = (newDir: { x: number; y: number }) => {
    const lastDir = nextDirectionsRef.current.length > 0 
      ? nextDirectionsRef.current[nextDirectionsRef.current.length - 1] 
      : directionRef.current;

    if ((newDir.x !== 0 && lastDir.x === 0) || (newDir.y !== 0 && lastDir.y === 0)) {
      if (nextDirectionsRef.current.length < 2) {
        nextDirectionsRef.current.push(newDir);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="flex justify-between w-full max-w-[400px] font-pixel text-xs">
        <span className="text-arcade-yellow">分数: {score}</span>
        {gameOver && <span className="text-arcade-pink animate-pulse">游戏结束!</span>}
      </div>

      <div 
        className="relative bg-[#0a0a1a] border-4 border-black pixel-border"
        style={{ width: 400, height: 400 }}
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        {/* Snake */}
        {snake.map((segment, i) => (
          <div
            key={i}
            className={`absolute border border-black ${i === 0 ? 'bg-arcade-green' : 'bg-arcade-green/60'}`}
            style={{
              width: 20,
              height: 20,
              left: segment.x * 20,
              top: segment.y * 20,
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-arcade-pink animate-pulse"
          style={{
            width: 20,
            height: 20,
            left: food.x * 20,
            top: food.y * 20,
            borderRadius: '50%'
          }}
        />

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-6 z-10">
            <h2 className="font-pixel text-2xl text-arcade-pink">GAME OVER</h2>
            <p className="font-pixel text-sm text-white">最终得分: {score}</p>
            <button onClick={resetGame} className="pixel-button">重新开始</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button onClick={() => handleDirectionChange({ x: 0, y: -1 })} className="pixel-button !p-4">↑</button>
        <div />
        <button onClick={() => handleDirectionChange({ x: -1, y: 0 })} className="pixel-button !p-4">←</button>
        <button onClick={() => handleDirectionChange({ x: 0, y: 1 })} className="pixel-button !p-4">↓</button>
        <button onClick={() => handleDirectionChange({ x: 1, y: 0 })} className="pixel-button !p-4">→</button>
      </div>
      
      <p className="text-gray-500 text-xs font-pixel">使用方向键控制移动</p>
    </div>
  );
}
