import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function Shooter() {
  const [playerX, setPlayerX] = useState(50);
  const [bullets, setBullets] = useState<{ id: number; x: number; y: number }[]>([]);
  const [enemies, setEnemies] = useState<{ id: number; x: number; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const gameLoopRef = useRef<number | null>(null);
  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());

  const shoot = useCallback(() => {
    if (gameOver) return;
    setBullets(prev => [...prev, { id: bulletIdRef.current++, x: playerX + 4, y: 90 }]);
  }, [playerX, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (e.key === ' ' || e.key === 'ArrowUp') shoot();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shoot]);

  useEffect(() => {
    if (gameOver) return;

    const loop = () => {
      // Handle movement
      if (keysPressed.current.has('ArrowLeft')) {
        setPlayerX(x => Math.max(0, x - 1.5));
      }
      if (keysPressed.current.has('ArrowRight')) {
        setPlayerX(x => Math.min(90, x + 1.5));
      }

      // Move bullets
      setBullets(prev => prev.map(b => ({ ...b, y: b.y - 2 })).filter(b => b.y > 0));

      // Move enemies
      setEnemies(prev => {
        const next = prev.map(e => ({ ...e, y: e.y + 0.5 }));
        
        // Spawn enemies
        if (Math.random() < 0.02) {
          next.push({ id: enemyIdRef.current++, x: Math.random() * 90, y: 0 });
        }

        // Collision detection
        let hitIndices: number[] = [];
        let bulletIndices: number[] = [];

        next.forEach((e, ei) => {
          if (e.y > 90 && Math.abs(e.x - playerX) < 8) {
            setGameOver(true);
          }
          
          bullets.forEach((b, bi) => {
            if (Math.abs(e.x - b.x) < 5 && Math.abs(e.y - b.y) < 5) {
              hitIndices.push(ei);
              bulletIndices.push(bi);
              setScore(s => s + 10);
            }
          });
        });

        return next.filter((_, i) => !hitIndices.includes(i)).filter(e => e.y < 100);
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [bullets, gameOver, playerX]);

  const reset = () => {
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setGameOver(false);
    setPlayerX(50);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full h-full">
      <div className="font-pixel text-xs text-arcade-yellow">分数: {score}</div>
      
      <div className="relative bg-[#0a0a1a] border-4 border-black pixel-border w-full max-w-[400px] h-[400px] overflow-hidden">
        {/* Player */}
        <div 
          className="absolute bottom-2 w-10 h-10 bg-arcade-blue pixel-border flex items-center justify-center transition-all duration-100"
          style={{ left: `${playerX}%` }}
        >
          <div className="w-2 h-6 bg-white/50" />
        </div>

        {/* Bullets */}
        {bullets.map(b => (
          <div 
            key={b.id}
            className="absolute w-2 h-4 bg-arcade-yellow"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          />
        ))}

        {/* Enemies */}
        {enemies.map(e => (
          <div 
            key={e.id}
            className="absolute w-8 h-8 bg-arcade-pink pixel-border animate-pulse"
            style={{ left: `${e.x}%`, top: `${e.y}%` }}
          />
        ))}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            <h2 className="font-pixel text-arcade-pink">战机坠毁</h2>
            <button onClick={reset} className="pixel-button !text-[10px]">重试</button>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 md:hidden">
        <button onClick={() => setPlayerX(x => Math.max(0, x - 10))} className="pixel-button">←</button>
        <button onClick={shoot} className="pixel-button">发射</button>
        <button onClick={() => setPlayerX(x => Math.min(90, x + 10))} className="pixel-button">→</button>
      </div>
      <p className="text-gray-500 text-[10px] font-pixel">左右键移动，空格射击</p>
    </div>
  );
}
