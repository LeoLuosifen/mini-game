import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function Runner() {
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<{ id: number; x: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const runnerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const obstacleIdRef = useRef(0);

  const jump = useCallback(() => {
    if (isJumping || gameOver) return;
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 500);
  }, [isJumping, gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        if (!gameStarted) setGameStarted(true);
        jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const loop = () => {
      setObstacles(prev => {
        const next = prev.map(o => ({ ...o, x: o.x - 5 })).filter(o => o.x > -50);
        
        // Spawn new obstacle
        if (next.length === 0 || (next[next.length - 1].x < 400 && Math.random() < 0.02)) {
          next.push({ id: obstacleIdRef.current++, x: 800 });
        }

        // Collision detection
        const runnerBottom = isJumping ? 100 : 0;
        const collision = next.some(o => o.x > 50 && o.x < 100 && runnerBottom < 40);
        if (collision) setGameOver(true);

        return next;
      });
      setScore(s => s + 1);
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, isJumping]);

  const reset = () => {
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full h-full justify-center">
      <div className="font-pixel text-xs text-arcade-yellow mb-2">分数: {Math.floor(score / 10)}</div>
      
      <div 
        className="relative bg-[#0a0a1a] border-4 border-black pixel-border overflow-hidden w-full max-w-[600px] h-[200px] cursor-pointer"
        onClick={gameStarted ? jump : () => setGameStarted(true)}
      >
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-1 bg-arcade-blue" />

        {/* Runner */}
        <div 
          ref={runnerRef}
          className={`absolute left-10 bottom-1 w-10 h-10 bg-arcade-pink pixel-border transition-all duration-500 ${isJumping ? 'bottom-24' : 'bottom-1'}`}
        >
          <div className="absolute top-2 right-2 w-2 h-2 bg-black" />
        </div>

        {/* Obstacles */}
        {obstacles.map(o => (
          <div 
            key={o.id}
            className="absolute bottom-1 w-8 h-8 bg-arcade-green pixel-border"
            style={{ left: o.x }}
          />
        ))}

        {!gameStarted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <p className="font-pixel text-white text-xs animate-bounce">点击或按空格开始</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            <h2 className="font-pixel text-arcade-pink">游戏结束</h2>
            <button onClick={reset} className="pixel-button !text-[10px]">重试</button>
          </div>
        )}
      </div>
      <p className="text-gray-500 text-[10px] font-pixel">空格键或点击跳跃</p>
    </div>
  );
}
