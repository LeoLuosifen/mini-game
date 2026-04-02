import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function Shooter() {
  const playerXRef = useRef(50);
  const [playerX, setPlayerX] = useState(50);
  const [bullets, setBullets] = useState<{ id: number; x: number; y: number }[]>([]);
  const [enemies, setEnemies] = useState<{ id: number; x: number; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const gameLoopRef = useRef<number | null>(null);
  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());

  const shoot = useCallback(() => {
    if (gameOver) return;
    setBullets(prev => [...prev, { id: bulletIdRef.current++, x: playerXRef.current + 4, y: 90 }]);
  }, [gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev);
        return;
      }
      if (isPaused) return;
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
    if (gameOver || isPaused) return;

    const loop = () => {
      // Handle movement
      let moved = false;
      if (keysPressed.current.has('ArrowLeft')) {
        playerXRef.current = Math.max(0, playerXRef.current - 2);
        moved = true;
      }
      if (keysPressed.current.has('ArrowRight')) {
        playerXRef.current = Math.min(90, playerXRef.current + 2);
        moved = true;
      }
      if (moved) {
        setPlayerX(playerXRef.current);
      }

      // Move bullets
      setBullets(prev => prev.map(b => ({ ...b, y: b.y - 3 })).filter(b => b.y > 0));

      // Move enemies
      setEnemies(prev => {
        const next = [...prev];
        
        // Spawn enemies
        if (Math.random() < 0.03) {
          next.push({ id: enemyIdRef.current++, x: Math.random() * 90, y: 0 });
        }

        const updatedEnemies = next.map(e => ({ ...e, y: e.y + 0.8 }));

        // Collision detection
        let hitEnemyIndices = new Set<number>();
        let hitBulletIndices = new Set<number>();

        updatedEnemies.forEach((e, ei) => {
          // Player collision
          if (e.y > 85 && Math.abs(e.x - playerXRef.current) < 8) {
            setGameOver(true);
          }
          
          // Bullet collision
          bullets.forEach((b, bi) => {
            if (Math.abs(e.x - b.x) < 6 && Math.abs(e.y - b.y) < 6) {
              hitEnemyIndices.add(ei);
              hitBulletIndices.add(bi);
            }
          });
        });

        if (hitEnemyIndices.size > 0) {
          setScore(s => s + hitEnemyIndices.size * 10);
        }

        return updatedEnemies.filter((_, i) => !hitEnemyIndices.has(i)).filter(e => e.y < 100);
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [bullets, gameOver]); // bullets is still needed for collision detection in the loop

  const reset = () => {
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setPlayerX(50);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full h-full">
      <div className="flex justify-between w-full max-w-[400px] font-pixel text-xs items-center">
        <div className="flex flex-col gap-1">
          <span className="text-arcade-yellow">分数: {score}</span>
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className="text-[8px] text-arcade-blue hover:text-white transition-colors text-left"
          >
            {isPaused ? '[ 继续 ]' : '[ 暂停 ]'}
          </button>
        </div>
      </div>
      
      <div className="relative bg-[#0a0a1a] border-4 border-black pixel-border w-full max-w-[400px] h-[400px] overflow-hidden">
        {/* Player */}
        <div 
          className="absolute bottom-2 w-10 h-10 bg-arcade-blue pixel-border flex items-center justify-center"
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

        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <h2 className="font-pixel text-2xl text-arcade-blue animate-pulse">已暂停</h2>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            <h2 className="font-pixel text-arcade-pink">战机坠毁</h2>
            <button onClick={reset} className="pixel-button !text-[10px]">重试</button>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 md:hidden">
        <button 
          onClick={() => {
            playerXRef.current = Math.max(0, playerXRef.current - 10);
            setPlayerX(playerXRef.current);
          }} 
          className="pixel-button"
        >
          ←
        </button>
        <button onClick={shoot} className="pixel-button">发射</button>
        <button 
          onClick={() => {
            playerXRef.current = Math.min(90, playerXRef.current + 10);
            setPlayerX(playerXRef.current);
          }} 
          className="pixel-button"
        >
          →
        </button>
      </div>
      <p className="text-gray-500 text-[10px] font-pixel">左右键移动，空格射击，P键暂停</p>

      <div className="mt-6 p-4 bg-black/40 border-2 border-arcade-blue/30 rounded-lg max-w-[400px] w-full">
        <h3 className="font-pixel text-[10px] text-arcade-blue mb-2">游戏说明</h3>
        <ul className="text-[10px] text-gray-400 font-pixel list-disc list-inside space-y-1">
          <li>使用键盘左右方向键控制战机移动</li>
          <li>按下空格键或上方向键发射子弹</li>
          <li>击毁敌机得分，避免被敌机撞击</li>
        </ul>
      </div>
    </div>
  );
}
