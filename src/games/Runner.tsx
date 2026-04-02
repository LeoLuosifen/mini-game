import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function Runner() {
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<{ id: number; x: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const runnerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const obstacleIdRef = useRef(0);

  const jump = useCallback(() => {
    if (isJumping || gameOver || isPaused) return;
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 500);
  }, [isJumping, gameOver, isPaused]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (gameStarted && !gameOver) {
          setIsPaused(prev => !prev);
        }
        return;
      }
      if (isPaused) return;
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        if (!gameStarted) setGameStarted(true);
        jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

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
    setIsPaused(false);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full h-full justify-center">
      <div className="flex justify-between w-full max-w-[600px] font-pixel text-xs items-center mb-2">
        <div className="flex flex-col gap-1">
          <span className="text-arcade-yellow">分数: {Math.floor(score / 10)}</span>
          {gameStarted && !gameOver && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }} 
              className="text-[8px] text-arcade-blue hover:text-white transition-colors text-left"
            >
              {isPaused ? '[ 继续 ]' : '[ 暂停 ]'}
            </button>
          )}
        </div>
      </div>
      
      <div 
        className="relative bg-[#0a0a1a] border-4 border-black pixel-border overflow-hidden w-full max-w-[600px] h-[200px] cursor-pointer"
        onClick={gameStarted ? (isPaused ? undefined : jump) : () => setGameStarted(true)}
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

        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <h2 className="font-pixel text-2xl text-arcade-blue animate-pulse">已暂停</h2>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            <h2 className="font-pixel text-arcade-pink">游戏结束</h2>
            <button onClick={reset} className="pixel-button !text-[10px]">重试</button>
          </div>
        )}
      </div>
      <p className="text-gray-500 text-[10px] font-pixel">空格键或点击跳跃，P键暂停</p>

      <div className="mt-6 p-4 bg-black/40 border-2 border-arcade-blue/30 rounded-lg max-w-[400px] w-full">
        <h3 className="font-pixel text-[10px] text-arcade-blue mb-2">游戏说明</h3>
        <ul className="text-[10px] text-gray-400 font-pixel list-disc list-inside space-y-1">
          <li>按下空格键或点击屏幕进行跳跃</li>
          <li>躲避地面上出现的绿色障碍物</li>
          <li>坚持的时间越长，得分越高</li>
        </ul>
      </div>
    </div>
  );
}
