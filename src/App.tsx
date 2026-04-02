/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Trophy, 
  Star, 
  Heart, 
  Zap, 
  Ghost, 
  Rocket, 
  Target,
  Settings,
  Search,
  Play,
  User,
  ArrowLeft,
  Puzzle as PuzzleIcon,
  Grid3X3,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Game Components
import Snake from './games/Snake';
import Tetris from './games/Tetris';
import Runner from './games/Runner';
import Shooter from './games/Shooter';
import Puzzle from './games/Puzzle';
import Match3 from './games/Match3';
import Cultivation from './games/Cultivation';

interface Game {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  players: string;
  category: string;
  component: React.ReactNode;
}

const GAMES: Game[] = [
  {
    id: 'snake',
    title: '贪吃蛇',
    description: '经典的贪吃蛇游戏，挑战你的反应极限！',
    icon: <Target className="w-12 h-12" />,
    color: 'bg-arcade-green',
    players: '1.5k',
    category: '经典',
    component: <Snake />
  },
  {
    id: 'tetris',
    title: '俄罗斯方块',
    description: '方块消除的极致快感，你能坚持多久？',
    icon: <Grid3X3 className="w-12 h-12" />,
    color: 'bg-arcade-blue',
    players: '3.2k',
    category: '经典',
    component: <Tetris />
  },
  {
    id: 'runner',
    title: '像素跑酷',
    description: '在不断加速的世界中跳跃，躲避障碍物！',
    icon: <Zap className="w-12 h-12" />,
    color: 'bg-arcade-pink',
    players: '2.1k',
    category: '动作',
    component: <Runner />
  },
  {
    id: 'shooter',
    title: '星际射击',
    description: '驾驶战机，消灭来自外太空的敌人！',
    icon: <Rocket className="w-12 h-12" />,
    color: 'bg-arcade-purple',
    players: '1.8k',
    category: '动作',
    component: <Shooter />
  },
  {
    id: 'puzzle',
    title: '像素拼图',
    description: '还原美丽的像素画作，放松你的心情。',
    icon: <PuzzleIcon className="w-12 h-12" />,
    color: 'bg-arcade-yellow',
    players: '900',
    category: '益智',
    component: <Puzzle />
  },
  {
    id: 'match3',
    title: '像素消消乐',
    description: '三个连在一起就能消除，爽快感十足！',
    icon: <Star className="w-12 h-12" />,
    color: 'bg-arcade-pink',
    players: '2.8k',
    category: '益智',
    component: <Match3 />
  },
  {
    id: 'cultivation',
    title: '凡人修仙传',
    description: '从凡人开始，历经磨难，最终成就大帝之位！',
    icon: <Compass className="w-12 h-12" />,
    color: 'bg-arcade-green',
    players: '5.6k',
    category: '冒险',
    component: <Cultivation />
  }
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeGameId) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96']
      });
    }
  }, [activeGameId]);

  const filteredGames = GAMES.filter(game => {
    const matchesCategory = selectedCategory === '全部' || game.category === selectedCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (activeGameId) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
        <header className="p-4 border-b-4 border-black bg-[#2a2a4a] flex items-center justify-between">
          <button 
            onClick={() => setActiveGameId(null)}
            className="pixel-button !py-1 !px-3 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> 返回大厅
          </button>
          <h2 className="font-pixel text-arcade-yellow text-sm">
            正在游玩: {GAMES.find(g => g.id === activeGameId)?.title}
          </h2>
          <div className="w-24"></div> {/* Spacer */}
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="pixel-card bg-[#0a0a1a] w-full max-w-4xl min-h-[500px] flex items-center justify-center relative overflow-hidden">
             {GAMES.find(g => g.id === activeGameId)?.component}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 border-b-4 border-black bg-[#2a2a4a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-arcade-pink p-2 pixel-border animate-bounce">
              <Gamepad2 className="w-8 h-8 text-black" />
            </div>
            <h1 className="font-pixel text-2xl md:text-3xl text-arcade-yellow tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
              像素欢乐街机
            </h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="搜索游戏..."
                className="w-full bg-[#1a1a2e] border-4 border-black p-2 pl-10 font-pixel text-[10px] focus:outline-none focus:border-arcade-blue text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button className="p-2 bg-arcade-blue pixel-border hover:scale-110 transition-transform">
              <Settings className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="mb-12 relative overflow-hidden p-8 md:p-12 pixel-card bg-gradient-to-br from-[#3a3a6a] to-[#2a2a4a]">
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block bg-arcade-green text-black font-pixel text-[10px] px-3 py-1 mb-4 pixel-border">
                新游上线
              </span>
              <h2 className="font-pixel text-3xl md:text-5xl mb-6 leading-tight text-white drop-shadow-[4px_4px_0_rgba(255,113,206,0.5)]">
                准备好开始挑战了吗？
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl font-medium">
                探索充满无限乐趣的像素迷你游戏世界。无需登录，即点即玩！
                与好友一起竞技，冲击排行榜高分！
              </p>
              <button 
                onClick={() => {
                  const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
                  setActiveGameId(randomGame.id);
                }}
                className="pixel-button text-lg group"
              >
                随机开始 <Play className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
          
          {/* Decorative floating elements */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-10 right-10 opacity-20 md:opacity-100"
          >
            <Star className="w-24 h-24 text-arcade-yellow fill-arcade-yellow" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute bottom-10 right-40 opacity-20 md:opacity-100"
          >
            <Heart className="w-16 h-16 text-arcade-pink fill-arcade-pink" />
          </motion.div>
        </section>

        {/* Categories */}
        <div className="flex flex-wrap gap-4 mb-8">
          {['全部', '经典', '动作', '益智', '冒险'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 font-pixel text-[10px] pixel-border transition-all ${
                selectedCategory === cat 
                ? 'bg-arcade-yellow text-black -translate-y-1' 
                : 'bg-[#2a2a4a] text-gray-400 hover:text-white'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group"
                onClick={() => setActiveGameId(game.id)}
              >
                <div className="pixel-card h-full flex flex-col hover:-translate-y-2 transition-transform cursor-pointer overflow-hidden">
                  <div className={`${game.color} h-48 flex items-center justify-center border-b-4 border-black relative group-hover:brightness-110 transition-all`}>
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm group-hover:scale-125 transition-transform duration-500">
                      {game.icon}
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      <div className="bg-black/50 px-2 py-1 rounded text-[10px] font-pixel flex items-center gap-1">
                        <User className="w-3 h-3" /> {game.players}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-pixel text-sm text-white group-hover:text-arcade-yellow transition-colors">
                        {game.title}
                      </h3>
                      <Star className="w-4 h-4 text-arcade-yellow fill-arcade-yellow" />
                    </div>
                    <p className="text-gray-400 text-sm mb-6 flex-1">
                      {game.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-pixel text-arcade-blue">
                        {game.category}
                      </span>
                      <button className="pixel-button !py-1 !px-3 !text-[10px]">
                        开始游玩
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-20">
            <Ghost className="w-20 h-20 text-gray-600 mx-auto mb-4 animate-pulse" />
            <p className="font-pixel text-gray-500">未找到相关游戏...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-8 border-t-4 border-black bg-[#2a2a4a] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-arcade-pink" />
            <span className="font-pixel text-xs">像素欢乐街机 © 2026</span>
          </div>
          
          <div className="flex gap-6">
            <Trophy className="w-6 h-6 hover:text-arcade-yellow transition-colors cursor-pointer" />
            <Star className="w-6 h-6 hover:text-arcade-pink transition-colors cursor-pointer" />
            <Heart className="w-6 h-6 hover:text-arcade-green transition-colors cursor-pointer" />
          </div>

          <div className="text-center md:text-right">
            <p className="text-gray-400 text-xs mb-2">用心打造每一个像素</p>
            <div className="flex gap-2 justify-center md:justify-end">
              <div className="w-4 h-4 bg-arcade-pink pixel-border"></div>
              <div className="w-4 h-4 bg-arcade-blue pixel-border"></div>
              <div className="w-4 h-4 bg-arcade-green pixel-border"></div>
              <div className="w-4 h-4 bg-arcade-purple pixel-border"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
