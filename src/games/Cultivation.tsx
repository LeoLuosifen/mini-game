import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  REALMS, 
  BREAKTHROUGH_MESSAGES, 
  CULTIVATION_PARTS, 
  WORLD_RUMORS, 
  MONSTERS, 
  EVENTS, 
  MARKET_POOL, 
  WORK_TASKS, 
  OLD_MAN_QUOTES, 
  CONDITIONAL_QUOTES,
  SPIRIT_ROOTS, 
  SECTS,
  PlayerData,
  STORAGE_KEY,
  TITLES
} from '../data/CultivationData';

export default function Cultivation() {
  // --- State ---
  const [player, setPlayer] = useState<PlayerData>(() => {
    const defaultData = {
      name: "",
      stageIndex: 0,
      exp: 0,
      stonesLow: 0,
      stonesHigh: 0,
      stonesTop: 0,
      arrayLevel: 0,
      elixirCount: 0,
      attack: 10,
      defense: 5,
      hp: 100,
      maxHp: 100,
      savvy: 10,
      inventory: {},
      isDead: false
    };
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: handle old 'stones' field
        if (parsed.stones !== undefined && parsed.stonesLow === undefined) {
          parsed.stonesLow = parsed.stones;
          delete parsed.stones;
        }
        // Merge saved data with defaults to handle missing fields from old saves
        const merged = { ...defaultData, ...parsed };
        // Defensive check for NaN values that might have been saved
        if (isNaN(merged.exp)) merged.exp = 0;
        if (isNaN(merged.savvy)) merged.savvy = 10;
        if (isNaN(merged.hp)) merged.hp = merged.maxHp;
        return merged;
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return defaultData;
  });

  const getRealmName = (index: number) => {
    if (index === 0) return "凡人";
    const majorIdx = Math.floor((index - 1) / 10) + 1;
    const minorIdx = (index - 1) % 10 + 1;
    const majorName = REALMS[majorIdx] || "未知";
    if (minorIdx === 10) return `${majorName}巅峰`;
    const chineseNums = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
    return `${majorName}${chineseNums[minorIdx - 1]}层`;
  };

  const getTitle = (stageIndex: number) => {
    // 从高到低查找适合的名号
    const sortedLevels = Object.keys(TITLES).map(Number).sort((a, b) => b - a);
    for (const level of sortedLevels) {
      if (stageIndex >= level) {
        return TITLES[level];
      }
    }
    return TITLES[0]; // 默认返回初入仙途
  };

  const [logs, setLogs] = useState<string[]>(["欢迎来到修仙世界，开始你的长生之路吧。"]);
  const [activeTab, setActiveTab] = useState<'cultivate' | 'adventure' | 'tasks' | 'abode' | 'market' | 'inventory'>('cultivate');
  const [isPaused, setIsPaused] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [showReincarnationConfirm, setShowReincarnationConfirm] = useState(false);
  const [initStep, setInitStep] = useState<'name' | 'root' | 'sect'>('name');
  const [tempName, setTempName] = useState("");
  const [rolledRootId, setRolledRootId] = useState<string | null>(null);
  const [npcQuote, setNpcQuote] = useState(OLD_MAN_QUOTES[0]);
  const [hasRingElder, setHasRingElder] = useState(false);
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [marketRefreshTime, setMarketRefreshTime] = useState(300); // 5 minutes in seconds
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [stoneExchangeCooldown, setStoneExchangeCooldown] = useState(0); // 12 hours in seconds
  const [exchangeFrom, setExchangeFrom] = useState<'top' | 'high' | 'low'>('top');
  const [exchangeTo, setExchangeTo] = useState<'top' | 'high' | 'low'>('high');
  const [exchangeAmount, setExchangeAmount] = useState(1);
  const [taskRefreshCooldown, setTaskRefreshCooldown] = useState(0); // 手动刷新冷却时间（秒）
  const [autoTaskRefreshTime, setAutoTaskRefreshTime] = useState(10800); // 自动刷新时间（3小时，秒）

  // --- Refs for game loop ---
  const lastSaveRef = useRef(Date.now());

  // --- Formulas ---
  const getExpRequirement = (index: number) => {
    if (index === 0) return 100;
    // Before Golden Core (stageIndex 21), progression is relatively smooth
    if (index < 21) {
      return Math.floor(200 * Math.pow(1.25, index));
    }
    // From Golden Core onwards, the difficulty spikes significantly
    const baseAtGoldenCore = 200 * Math.pow(1.25, 20);
    return Math.floor(baseAtGoldenCore * Math.pow(1.4, index - 20));
  };

  const getFacilityStats = () => {
    const level = player.arrayLevel;
    const base = { atk: 0, def: 0, expMult: 1.0, stoneRate: 0, elixirMult: 1.0 };
    
    switch (player.sectId) {
      case 'tianxuan': return { ...base, name: '剑意碑', atk: level * 5, expMult: 1.2 + level * 0.02, stoneRate: 0, desc: '感悟无上剑意，磨砺神魂，修为自成。额外提升攻击力。' };
      case 'youming': return { ...base, name: '炼魂炉', def: level * 3, expMult: 1.5 + level * 0.03, stoneRate: 0, desc: '炼化残魂，抽取阴冥之气，强行提升修为。额外提升防御力。' };
      case 'wanbao': return { ...base, name: '聚宝盆', expMult: 1.1 + level * 0.01, stoneRate: level * 0.5, desc: '以财通神，灵石共鸣，修为随财富增长。随等级提升产出更高品质的灵石。' };
      case 'guixu': return { ...base, name: '归墟眼', atk: level * 2, def: level * 2, expMult: 2.5 + level * 0.05, stoneRate: 0, desc: '沟通无尽归墟，吞噬天地灵气，修为如海纳百川。全方位提升。' };
      case 'blood': return { ...base, name: '化血池', atk: level * 8, def: -level * 2, expMult: 3.0 + level * 0.08, stoneRate: 0, desc: '以血为引，逆天改命，修为进境极快。极大提升攻击但降低防御。' };
      case 'qingyu': return { ...base, name: '灵药园', expMult: 1.3 + level * 0.02, elixirMult: 2.0 + level * 0.1, stoneRate: 0, desc: '培育灵草，药香扑鼻，修为在草木荣枯中增长。丹药加成随等级提升。' };
      default: return { ...base, name: '聚灵阵', expMult: 1.0 + level * 0.05, stoneRate: 0, desc: '通过在洞府中布置聚灵阵，可以大幅提升天地灵气的汇聚速度，实现自动增长修为。' };
    }
  };

  const getIdleExp = () => {
    const root = SPIRIT_ROOTS.find(r => r.id === player.spiritRootId);
    const sect = SECTS.find(s => s.id === player.sectId);
    const rootBonus = root?.expBonus || 1;
    const sectBonus = sect?.expBonus || 1;
    const facility = getFacilityStats();

    // Balanced base gain: 0.1 -> 0.3 -> 0.5 -> ...
    const baseGain = (player.arrayLevel * 0.2 + 0.1) * facility.expMult;
    const elixirBonus = 1 + player.elixirCount * 0.2 * (facility.elixirMult || 1.0);
    
    return baseGain * elixirBonus * ((player.savvy || 10) / 10) * rootBonus * sectBonus;
  };

  const getManualExp = () => {
    const root = SPIRIT_ROOTS.find(r => r.id === player.spiritRootId);
    const sect = SECTS.find(s => s.id === player.sectId);
    const rootBonus = root?.expBonus || 1;
    const sectBonus = sect?.expBonus || 1;
    const facility = getFacilityStats();

    const baseGain = (2 + Math.floor(player.stageIndex / 10)) * facility.expMult;
    const elixirBonus = 1 + player.elixirCount * 0.2 * (facility.elixirMult || 1.0);
    
    return baseGain * elixirBonus * ((player.savvy || 10) / 10) * rootBonus * sectBonus;
  };

  const getTaskSuccessChance = useCallback((difficulty: string) => {
    if (difficulty === '简单') return 1.0;
    
    // Great Emperor realm (stageIndex >= 91) has 100% success rate
    if (player.stageIndex >= 91) return 1.0;

    // Scaling factor based on progress towards Great Emperor
    const progress = player.stageIndex / 91;
    
    // Random jitter between -0.08 and +0.08 to make it non-fixed
    const jitter = (Math.random() * 0.16) - 0.08;

    if (difficulty === '普通') {
      // Min 50%, scales up to 100% at Great Emperor, with jitter
      return Math.min(1.0, Math.max(0.5, 0.5 + (progress * 0.5) + jitter));
    }
    if (difficulty === '困难') {
      // Min 40%, scales up to 100% at Great Emperor, with jitter
      return Math.min(1.0, Math.max(0.4, 0.4 + (progress * 0.6) + jitter));
    }
    return 1.0;
  }, [player.stageIndex]);
  const getBreakthroughChance = () => {
    if (player.stageIndex === 0) return 1; // 凡人必过
    const isMajor = player.stageIndex % 10 === 0;
    if (isMajor) return Math.max(0.1, 0.8 - (player.stageIndex / 100)); // 大境界突破较难
    return 0.95; // 小境界突破较易
  };

  const getBreakthroughInfo = () => {
    const nextStageIndex = player.stageIndex + 1;
    const isMajorBreakthrough = player.stageIndex % 10 === 0 && player.stageIndex !== 0;
    const needTribulation = nextStageIndex >= 30 && isMajorBreakthrough;
    
    let chance = getBreakthroughChance();
    let message = "突破境界";
    
    if (needTribulation) {
      const tribulationLevel = Math.floor((nextStageIndex - 1) / 10) - 2;
      const baseTribulationChance = Math.max(0.1, 0.8 - (tribulationLevel * 0.15));
      
      let tribulationBonus = 0;
      if (player.inventory['tribulation_pill']) {
        tribulationBonus += 0.2;
      }
      if (player.inventory['immortal_pill']) {
        tribulationBonus += 0.3;
      }
      const savvyBonus = (player.savvy - 10) * 0.01;
      tribulationBonus += Math.max(0, Math.min(0.3, savvyBonus));
      
      chance = Math.min(0.95, baseTribulationChance + tribulationBonus);
      message = "渡劫突破";
    }
    
    return { chance, message };
  };

  // --- Actions ---
  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50));
  };

  const saveGame = useCallback((data: PlayerData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const handleInitPlayer = (name: string, rootId: string, sectId?: string) => {
    const root = SPIRIT_ROOTS.find(r => r.id === rootId);
    const sect = SECTS.find(s => s.id === sectId);
    
    const nextPlayer: PlayerData = {
      name,
      spiritRootId: rootId,
      sectId,
      stageIndex: 0,
      exp: 0,
      stonesLow: 200,
      stonesHigh: 0,
      stonesTop: 0,
      arrayLevel: 0,
      elixirCount: 0,
      attack: 10 + (sect?.atkBonus || 0),
      defense: 5 + (sect?.defBonus || 0),
      hp: 100,
      maxHp: 100,
      savvy: 10,
      inventory: {},
      isDead: false,
      rootBreakthroughLevel: 0,
      specialRoot: undefined,
      hasBreakthroughPill: false
    };
    
    setPlayer(nextPlayer);
    saveGame(nextPlayer);
    setShowInitModal(false);
    addLog(`这一世，你名为 [${name}]，身怀 [${root?.name || "未知"}]，${sect ? `拜入 [${sect.name}]` : "成为一名散修"}，开始了新的修行。`);
  };

  const rollSpiritRoot = () => {
    const rand = Math.random();
    let cumulative = 0;
    for (const root of SPIRIT_ROOTS) {
      cumulative += root.prob;
      if (rand < cumulative) {
        setRolledRootId(root.id);
        setInitStep('sect');
        return;
      }
    }
    setRolledRootId(SPIRIT_ROOTS[0].id);
    setInitStep('sect');
  };

  const handleManualCultivate = () => {
    if (isPaused) return;
    const req = getExpRequirement(player.stageIndex);
    if (player.exp >= req) {
      addLog("修为已达瓶颈，请尽快突破！");
      return;
    }
    const gain = getManualExp();
    setPlayer(prev => {
      const next = { ...prev, exp: Math.min(req, prev.exp + gain) };
      saveGame(next);
      return next;
    });
    
    // Dynamic log generation
    const action = CULTIVATION_PARTS.actions[Math.floor(Math.random() * CULTIVATION_PARTS.actions.length)];
    const sensation = CULTIVATION_PARTS.sensations[Math.floor(Math.random() * CULTIVATION_PARTS.sensations.length)];
    const result = CULTIVATION_PARTS.results[Math.floor(Math.random() * CULTIVATION_PARTS.results.length)];
    addLog(`${action}，${sensation}，${result}`);
  };

  const handleBreakthrough = () => {
    if (isPaused) return;
    const req = getExpRequirement(player.stageIndex);
    if (player.exp < req) {
      addLog("修为不足，无法突破！");
      return;
    }

    // 检查灵根境界上限
    const root = SPIRIT_ROOTS.find(r => r.id === player.spiritRootId);
    if (root) {
      let baseMaxStageIndex = Infinity;
      switch (root.id) {
        case 'waste': // 废灵根 - 筑基期
          baseMaxStageIndex = 20; // 筑基1层
          break;
        case 'pseudo': // 伪灵根 - 筑基巅峰
          baseMaxStageIndex = 29; // 筑基10层
          break;
        case 'true': // 真灵根 - 金丹期
          baseMaxStageIndex = 30; // 金丹1层
          break;
        case 'earth': // 地灵根 - 元婴期
          baseMaxStageIndex = 40; // 元婴1层
          break;
        case 'heaven': // 天灵根 - 元婴巅峰/化神
          baseMaxStageIndex = 49; // 元婴10层
          break;
        case 'mutated': // 变异灵根 - 化神/合体
          baseMaxStageIndex = 60; // 合体1层
          break;
        case 'special': // 特殊体质 - 无上限
          baseMaxStageIndex = Infinity;
          break;
      }

      // 计算突破后的上限
      let maxStageIndex = baseMaxStageIndex;
      
      // 灵根突破等级的影响（每突破一次增加一个大境界）
      if (player.rootBreakthroughLevel) {
        maxStageIndex += player.rootBreakthroughLevel * 10;
      }
      
      // 特殊灵根或体质的影响
      if (player.specialRoot) {
        maxStageIndex = Infinity;
      }
      
      // 突破丹药的影响
      if (player.hasBreakthroughPill) {
        maxStageIndex += 10; // 增加一个大境界
      }

      if (player.stageIndex >= maxStageIndex) {
        addLog(`你的${root.name}资质有限，无法突破到更高境界！需要寻找特殊机缘或服用突破丹药。`);
        return;
      }
    }

    const currentMajorRealm = REALMS[Math.floor((player.stageIndex - 1) / 10) + 1] || "凡人";
    const isMajorBreakthrough = player.stageIndex % 10 === 0 && player.stageIndex !== 0;
    const nextStageIndex = player.stageIndex + 1;
    const nextMajorRealm = REALMS[Math.floor((nextStageIndex - 1) / 10) + 1] || "凡人";
    const msgSet = BREAKTHROUGH_MESSAGES[currentMajorRealm];

    // 检查是否需要渡劫（从金丹期开始）
    const needTribulation = nextStageIndex >= 30 && isMajorBreakthrough;
    let chance = getBreakthroughChance();

    if (needTribulation) {
      // 计算渡劫难度和成功率
      const tribulationLevel = Math.floor((nextStageIndex - 1) / 10) - 2; // 从金丹开始计算
      const baseTribulationChance = Math.max(0.1, 0.8 - (tribulationLevel * 0.15));
      
      // 辅助渡劫的因素
      let tribulationBonus = 0;
      
      // 检查是否有渡劫辅助物品
      if (player.inventory['tribulation_pill']) {
        tribulationBonus += 0.2;
      }
      if (player.inventory['immortal_pill']) {
        tribulationBonus += 0.3;
      }
      
      // 悟性对渡劫的影响
      const savvyBonus = (player.savvy - 10) * 0.01;
      tribulationBonus += Math.max(0, Math.min(0.3, savvyBonus));
      
      // 最终渡劫成功率
      chance = Math.min(0.95, baseTribulationChance + tribulationBonus);
      
      addLog(`你感受到天地法则的威压，即将迎来${nextMajorRealm}劫！`);
      addLog(`渡劫成功率: ${Math.floor(chance * 100)}%`);
    } else {
      chance = getBreakthroughChance();
    }

    if (Math.random() < chance) {
      setPlayer(prev => {
        const hpGain = isMajorBreakthrough ? 100 : 20;
        const next = {
          ...prev,
          stageIndex: prev.stageIndex + 1,
          exp: 0,
          attack: prev.attack + 5,
          defense: prev.defense + 3,
          maxHp: prev.maxHp + hpGain,
          hp: prev.maxHp + hpGain // Restore to full (new max)
        };
        
        // 消耗渡劫辅助物品
        if (needTribulation) {
          if (next.inventory['tribulation_pill']) {
            next.inventory['tribulation_pill']--;
          }
          if (next.inventory['immortal_pill']) {
            next.inventory['immortal_pill']--;
          }
          
          // 渡劫重塑灵根的机会
          if (Math.random() < 0.3) { // 30%的几率
            if (!next.rootBreakthroughLevel) next.rootBreakthroughLevel = 0;
            next.rootBreakthroughLevel += 1;
            addLog("天劫之力淬炼了你的灵根，灵根品质得到提升！");
          }
        }
        
        saveGame(next);
        return next;
      });
      
      const successMsg = isMajorBreakthrough && msgSet ? msgSet.success : `恭喜！你成功突破到了 ${getRealmName(player.stageIndex + 1)}！`;
      addLog(successMsg);
      if (needTribulation) {
        addLog("渡劫成功！你成功抵御了天地法则的考验，修为更上一层楼！");
      } else {
        addLog("突破成功，气血已完全恢复，体质得到进一步强化！");
      }
      setConsecutiveFails(0);
      updateNpcQuote();
    } else {
      setPlayer(prev => {
        const next = { ...prev, exp: Math.floor(prev.exp * 0.5) };
        // 渡劫失败惩罚更严重
        if (needTribulation) {
          next.hp = Math.max(1, Math.floor(prev.hp * 0.3));
        }
        saveGame(next);
        return next;
      });
      const failMsg = isMajorBreakthrough && msgSet ? msgSet.fail : "突破失败！灵力反噬，损失了五成修为...";
      addLog(failMsg);
      if (needTribulation) {
        addLog("渡劫失败！你被天雷重创，需要静养恢复。");
      }
      setConsecutiveFails(prev => prev + 1);
      updateNpcQuote();
    }
  };

  const handleAdventure = () => {
    if (isPaused) return;
    const types: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral'];
    const type = types[Math.floor(Math.random() * types.length)];
    const eventList = EVENTS[type];
    const event = eventList[Math.floor(Math.random() * eventList.length)];

    let logMsg = event.text;
    let stoneGain = 0;
    let stoneType: 'low' | 'high' | 'top' = 'low';
    let expGain = 0;
    let savvyGain = 0;
    let hpMaxGain = 0;
    let specialItem = null;

    const majorRealmLevel = Math.floor(player.stageIndex / 10) + 1;

    if (event.type === 'stones') {
      stoneGain = Math.floor(Math.abs(event.base || 0) * majorRealmLevel * (0.5 + Math.random()));
      // Determine stone type based on realm
      if (majorRealmLevel >= 7) stoneType = Math.random() > 0.8 ? 'top' : 'high';
      else if (majorRealmLevel >= 3) stoneType = Math.random() > 0.7 ? 'high' : 'low';
      else stoneType = 'low';

      if (event.base && event.base < 0) {
        const currentAmount = stoneType === 'low' ? player.stonesLow : stoneType === 'high' ? player.stonesHigh : player.stonesTop;
        stoneGain = -Math.min(currentAmount, Math.abs(stoneGain));
      }
      logMsg = logMsg.replace('{val}', Math.abs(stoneGain).toString() + (stoneType === 'low' ? '下品' : stoneType === 'high' ? '高级' : '极品') + '灵石');
    } else if (event.type === 'exp') {
      expGain = Math.floor((event.base || 0) * majorRealmLevel);
    } else if (event.type === 'savvy') {
      savvyGain = event.base || 1;
    } else if (event.type === 'hp') {
      hpMaxGain = event.base || 20;
    } else if (type === 'neutral' && Math.random() < 0.4) {
      // Battle Logic
      const monsterName = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
      const monsterLevel = Math.max(1, player.stageIndex + (Math.random() > 0.5 ? 2 : -2));
      const monsterHp = monsterLevel * 50;
      const monsterAtk = monsterLevel * 10;
      const monsterDef = monsterLevel * 5;
      
      const facility = getFacilityStats();
      const totalAtk = player.attack + (facility.atk || 0);
      const totalDef = player.defense + (facility.def || 0);
      
      const playerDmg = Math.max(5, totalAtk - monsterDef);
      const monsterDmg = Math.max(2, monsterAtk - totalDef);
      
      const roundsToKill = Math.ceil(monsterHp / playerDmg);
      const totalDamageTaken = roundsToKill * monsterDmg;

      if (totalDamageTaken < player.hp) {
        stoneGain = monsterLevel * 25;
        // Monster stone type
        if (monsterLevel >= 60) stoneType = 'top';
        else if (monsterLevel >= 25) stoneType = 'high';
        else stoneType = 'low';

        expGain = monsterLevel * 15;
        logMsg = `你祭出法宝与 [${monsterName}] (等级 ${monsterLevel}) 激战，经过 ${roundsToKill} 个回合将其击杀，获得${stoneType === 'low' ? '下品' : stoneType === 'high' ? '高级' : '极品'}灵石 x${stoneGain}，修为 x${expGain}。`;
        
        setPlayer(prev => ({ ...prev, hp: Math.max(1, prev.hp - totalDamageTaken) }));
      } else {
        stoneGain = -Math.min(player.stonesLow, monsterLevel * 5);
        stoneType = 'low';
        logMsg = `你与 [${monsterName}] 激战数十回合，终因实力不济负伤遁走，损失了下品灵石 x${Math.abs(stoneGain)}。`;
        setPlayer(prev => ({ ...prev, hp: Math.max(1, Math.floor(prev.hp * 0.1)) }));
      }
    }

    // 随机获得天材地宝、功法或戒指老爷爷（低概率）
    if (Math.random() < 0.05) { // 5%的概率获得特殊物品
      const specialItems = [];
      
      // 天材地宝
      specialItems.push(
        { id: 'xiling_grass', name: "洗灵草", desc: "提纯灵根，提升灵根品质", effect: { root: 'purify' } },
        { id: 'wannian_lingzhi', name: "万年灵芝", desc: "大幅提升修为，有机会突破瓶颈", effect: { exp: 5000 } },
        { id: 'leiling_zhu', name: "雷灵珠", desc: "蕴含雷属性力量的灵珠，可提升灵根品质", effect: { root: 'purify' } },
        { id: 'bingsui', name: "冰髓", desc: "极寒之地的冰髓，可提升灵根品质", effect: { root: 'purify' } },
        { id: 'fenghuang_xue', name: "凤凰血", desc: "凤凰的精血，可强化灵根", effect: { root: 'purify' } },
        { id: 'lingmai_shui', name: "灵脉水", desc: "灵脉中流出的灵水，可提升修为", effect: { exp: 3000 } },
        { id: 'shenmu_ye', name: "神木液", desc: "千年神木的树液，可提升悟性", effect: { savvy: 10 } }
      );
      
      // 功法（只能获取一次）
      if (!player.inventory['wuxing_lunhui']) {
        specialItems.push({ id: 'wuxing_lunhui', name: "五行轮回功", desc: "废灵根专用功法，可绕过灵根限制", effect: { skill: 'wuxing' } });
      }
      if (!player.inventory['hundun_jue']) {
        specialItems.push({ id: 'hundun_jue', name: "混沌诀", desc: "无视灵根限制的顶级功法", effect: { skill: 'hundun' } });
      }
      if (!player.inventory['lianti_gong']) {
        specialItems.push({ id: 'lianti_gong', name: "炼体功法", desc: "不依赖灵气的炼体之法", effect: { skill: 'lianti' } });
      }
      if (!player.inventory['lingbao_jue']) {
        specialItems.push({ id: 'lingbao_jue', name: "灵宝诀", desc: "专修法宝的功法，提升法宝威力", effect: { skill: 'lingbao' } });
      }
      if (!player.inventory['taoist_heart']) {
        specialItems.push({ id: 'taoist_heart', name: "太上心法", desc: "提升悟性和修炼速度", effect: { skill: 'taoist' } });
      }
      if (!player.inventory['blood_martial']) {
        specialItems.push({ id: 'blood_martial', name: "血武经", desc: "以血养气，提升攻击力", effect: { skill: 'blood' } });
      }
      
      // 戒指老爷爷（只能获取一次）
      if (!hasRingElder) {
        specialItems.push({ id: 'ring_elder', name: "神秘戒指", desc: "一枚古老的戒指，里面似乎有什么东西在说话...", effect: { ringElder: true } });
      }
      
      if (specialItems.length > 0) {
        specialItem = specialItems[Math.floor(Math.random() * specialItems.length)];
        logMsg += `\n你在历练中意外发现了 [${specialItem.name}]！`;
      }
    }

    setPlayer(prev => {
      const req = getExpRequirement(prev.stageIndex);
      const currentSavvy = prev.savvy || 10;
      const currentMaxHp = prev.maxHp || 100;
      const currentHp = prev.hp || 100;
      
      const next = {
        ...prev,
        stonesLow: stoneType === 'low' ? Math.max(0, prev.stonesLow + stoneGain) : prev.stonesLow,
        stonesHigh: stoneType === 'high' ? Math.max(0, prev.stonesHigh + stoneGain) : prev.stonesHigh,
        stonesTop: stoneType === 'top' ? Math.max(0, prev.stonesTop + stoneGain) : prev.stonesTop,
        exp: Math.min(req, Math.max(0, prev.exp + expGain)),
        savvy: currentSavvy + (savvyGain || 0),
        maxHp: currentMaxHp + (hpMaxGain || 0),
        hp: Math.min(currentMaxHp + (hpMaxGain || 0), currentHp + (hpMaxGain || 0)),
        inventory: { ...prev.inventory }
      };
      
      // 添加特殊物品到背包
      if (specialItem) {
        next.inventory[specialItem.id] = (next.inventory[specialItem.id] || 0) + 1;
      }
      
      saveGame(next);
      return next;
    });
    addLog(logMsg);
  };

  const handleUpgradeArray = () => {
    if (isPaused) return;
    
    let cost = 0;
    let currency: 'stonesLow' | 'stonesHigh' | 'stonesTop' = 'stonesLow';
    const facility = getFacilityStats();
    
    // Tiered upgrade system
    if (player.arrayLevel < 10) {
      cost = Math.floor(100 * Math.pow(1.5, player.arrayLevel));
      currency = 'stonesLow';
    } else if (player.arrayLevel < 20) {
      cost = Math.floor(50 * Math.pow(1.5, player.arrayLevel - 10));
      currency = 'stonesHigh';
    } else {
      cost = Math.floor(20 * Math.pow(1.5, player.arrayLevel - 20));
      currency = 'stonesTop';
    }

    const currencyName = currency === 'stonesLow' ? '下品灵石' : currency === 'stonesHigh' ? '高级灵石' : '极品灵石';
    
    if (player[currency] < cost) {
      addLog(`${currencyName}不足，无法升级${facility.name}！`);
      return;
    }
    setPlayer(prev => {
      const next = {
        ...prev,
        [currency]: prev[currency] - cost,
        arrayLevel: prev.arrayLevel + 1
      };
      saveGame(next);
      return next;
    });
    addLog(`${facility.name}升级成功！消耗了 ${cost} ${currencyName}。当前等级：${player.arrayLevel + 1}`);
  };

  const handleBuyItem = (item: any, index: number) => {
    const currencyKey = item.currencyType === 'low' ? 'stonesLow' : item.currencyType === 'high' ? 'stonesHigh' : 'stonesTop';
    const currencyName = item.currencyType === 'low' ? '下品灵石' : item.currencyType === 'high' ? '高级灵石' : '极品灵石';

    if (player[currencyKey] < item.cost) {
      addLog(`${currencyName}不足，无法购买！`);
      return;
    }

    const currentCount = player.inventory[item.id] || 0;
    if (currentCount >= 99) {
      addLog(`[${item.name}] 已达上限 (99)，无法购买更多！`);
      return;
    }

    setPlayer(prev => {
      const next = { 
        ...prev, 
        [currencyKey]: prev[currencyKey] - item.cost,
        inventory: {
          ...prev.inventory,
          [item.id]: (prev.inventory[item.id] || 0) + 1
        }
      };
      saveGame(next);
      return next;
    });

    // Remove item from market after purchase
    const newMarket = [...marketItems];
    newMarket.splice(index, 1);
    setMarketItems(newMarket);
    addLog(`购买成功：${item.name} 已存入背包！`);
  };

  const handleUseItem = (itemId: string) => {
    if (isPaused) return;
    const item = MARKET_POOL.find(i => i.id === itemId);
    if (!item) return;

    if (!player.inventory[itemId] || player.inventory[itemId] <= 0) {
      addLog("物品不足，无法使用！");
      return;
    }

    setPlayer(prev => {
      const next = { 
        ...prev,
        inventory: {
          ...prev.inventory,
          [itemId]: prev.inventory[itemId] - 1
        }
      };
      
      if (item.effect.elixir) next.elixirCount += item.effect.elixir;
      if (item.effect.savvy) next.savvy += item.effect.savvy;
      if (item.effect.hp) {
        next.maxHp += item.effect.hp;
        next.hp += item.effect.hp;
      }
      if (item.effect.attack) next.attack += item.effect.attack;
      if (item.effect.defense) next.defense += item.effect.defense;
      
      // 处理突破丹药
      if ('breakthrough' in item.effect && item.effect.breakthrough) {
        switch (item.effect.breakthrough) {
          case 'jiedan':
            next.hasBreakthroughPill = true;
            addLog("你服用了结丹丹，感觉体内灵气涌动，似乎有突破瓶颈的希望！");
            break;
          case 'yingbian':
            next.hasBreakthroughPill = true;
            addLog("你服用了婴变丹，元婴雏形在丹田中形成，突破瓶颈的机会大大增加！");
            break;
          case 'huashen':
            next.hasBreakthroughPill = true;
            addLog("你服用了化神丹，神魂变得强大，突破到化神期的瓶颈松动了！");
            break;
          case 'pozhang':
            if (!next.rootBreakthroughLevel) next.rootBreakthroughLevel = 0;
            next.rootBreakthroughLevel += 1;
            addLog("你服用了破障丹，灵根得到滋养，境界上限提升了！");
            break;
        }
      }
      
      // 处理天材地宝
      if ('root' in item.effect && item.effect.root) {
        if (item.effect.root === 'purify') {
          addLog("你服用了洗灵草，灵根得到提纯，品质有所提升！");
          // 这里可以添加灵根品质提升的逻辑
        }
      }
      
      // 处理修为提升
      if ('exp' in item.effect && item.effect.exp) {
        const req = getExpRequirement(next.stageIndex);
        next.exp = Math.min(req, next.exp + item.effect.exp);
        addLog(`你服用了万年灵芝，获得了大量修为！`);
      }
      
      // 处理特殊功法
      if ('skill' in item.effect && item.effect.skill) {
        switch (item.effect.skill) {
          case 'wuxing':
            addLog("你习得五行轮回功，废灵根的限制被大幅削弱！");
            if (!next.rootBreakthroughLevel) next.rootBreakthroughLevel = 0;
            next.rootBreakthroughLevel += 2;
            break;
          case 'hundun':
            addLog("你习得混沌诀，灵根限制对你不再有效！");
            next.specialRoot = 'hundun';
            break;
          case 'lianti':
            addLog("你习得炼体功法，开始不依赖灵气修炼！");
            if (!next.rootBreakthroughLevel) next.rootBreakthroughLevel = 0;
            next.rootBreakthroughLevel += 1;
            next.attack += 50;
            next.defense += 30;
            break;
          case 'lingbao':
            addLog("你习得灵宝诀，法宝威力大幅提升！");
            next.attack += 30;
            break;
          case 'taoist':
            addLog("你习得太上心法，悟性和修炼速度提升！");
            if (!next.savvy) next.savvy = 10;
            next.savvy += 15;
            break;
          case 'blood':
            addLog("你习得血武经，攻击力大幅提升！");
            next.attack += 80;
            break;
        }
      }
      
      // 处理戒指老爷爷
      if ('ringElder' in item.effect && item.effect.ringElder) {
        addLog("戒指中传出一个苍老的声音：'小家伙，有缘人，老夫等你很久了...'你获得了戒指老爷爷的指导！");
        setHasRingElder(true);
      }
      
      saveGame(next);
      return next;
    });

    addLog(`使用了 [${item.name}]：${item.desc}`);
  };

  const handleStoneExchange = () => {
    if (isPaused) return;
    if (stoneExchangeCooldown > 0) {
      addLog("兑换冷却中，请稍后再试！");
      return;
    }

    let exchangeRate = 1;
    if (exchangeFrom === 'top' && exchangeTo === 'high') {
      exchangeRate = 1000;
    } else if (exchangeFrom === 'high' && exchangeTo === 'low') {
      exchangeRate = 1000;
    } else if (exchangeFrom === 'high' && exchangeTo === 'top') {
      exchangeRate = 0.001;
    } else if (exchangeFrom === 'low' && exchangeTo === 'high') {
      exchangeRate = 0.001;
    } else {
      addLog("无效的兑换方向！");
      return;
    }

    const fromKey = exchangeFrom === 'low' ? 'stonesLow' : exchangeFrom === 'high' ? 'stonesHigh' : 'stonesTop';
    const toKey = exchangeTo === 'low' ? 'stonesLow' : exchangeTo === 'high' ? 'stonesHigh' : 'stonesTop';
    const fromAmount = player[fromKey];
    const requiredAmount = exchangeFrom === 'top' || exchangeFrom === 'high' ? exchangeAmount : Math.ceil(exchangeAmount / exchangeRate);

    if (fromAmount < requiredAmount) {
      addLog(`[${exchangeFrom === 'low' ? '下品' : exchangeFrom === 'high' ? '高级' : '极品'}灵石]不足，无法兑换！`);
      return;
    }

    const toAmount = Math.floor(exchangeAmount);

    setPlayer(prev => {
      const next = { ...prev };
      next[fromKey] = prev[fromKey] - requiredAmount;
      next[toKey] = prev[toKey] + toAmount;
      saveGame(next);
      return next;
    });

    addLog(`成功兑换：${requiredAmount} ${exchangeFrom === 'low' ? '下品' : exchangeFrom === 'high' ? '高级' : '极品'}灵石 → ${toAmount} ${exchangeTo === 'low' ? '下品' : exchangeTo === 'high' ? '高级' : '极品'}灵石`);
    setStoneExchangeCooldown(43200); // 12 hours in seconds
  };

  const handleDoWork = (taskSlot: any, index: number) => {
    if (isPaused || taskSlot.status !== 'available') return;
    
    // Check if there's already a task being worked on
    const isWorking = availableTasks.some(slot => slot.status === 'working');
    if (isWorking) {
      addLog("你已经在处理一个任务了，分身乏术！先把手头的活干完。");
      setNpcQuote("贪多嚼不烂，小子，先把手头的活干完再说！");
      return;
    }

    const workTime = taskSlot.task.difficulty === '简单' ? 5 : 
                     taskSlot.task.difficulty === '普通' ? 15 : 30;

    setAvailableTasks(prev => {
      const next = [...prev];
      next[index] = { ...next[index], status: 'working', timer: workTime, totalTime: workTime };
      return next;
    });

    addLog(`你接取了任务 [${taskSlot.task.name}]，开始着手处理...`);
  };

  const completeWork = useCallback((index: number) => {
    setAvailableTasks(prev => {
      const taskSlot = prev[index];
      if (!taskSlot || taskSlot.status !== 'processing') return prev;

      // Use the stored success chance instead of calculating it fresh
      const successChance = taskSlot.successChance ?? getTaskSuccessChance(taskSlot.task.difficulty);
      const isSuccess = Math.random() < successChance;

      if (isSuccess) {
        // Reward scales with major realm
        const majorRealmLevel = Math.floor(player.stageIndex / 10) + 1;
        const reward = Math.floor(taskSlot.task.rewardBase * majorRealmLevel * (0.8 + Math.random() * 0.4));
        const stoneType = taskSlot.stoneType;
        const currencyKey = stoneType === 'low' ? 'stonesLow' : stoneType === 'high' ? 'stonesHigh' : 'stonesTop';
        const currencyName = stoneType === 'low' ? '下品灵石' : stoneType === 'high' ? '高级灵石' : '极品灵石';
        
        // 获得物品奖励（使用任务中显示的可能物品）
        let specialItem = taskSlot.possibleItem;
        
        setPlayer(p => {
          const nextPlayer = { 
            ...p, 
            [currencyKey]: p[currencyKey] + reward,
            inventory: { ...p.inventory }
          };
          
          // 添加物品到背包
          if (specialItem) {
            nextPlayer.inventory[specialItem.id] = (nextPlayer.inventory[specialItem.id] || 0) + 1;
          }
          
          saveGame(nextPlayer);
          return nextPlayer;
        });

        let logMsg = `完成任务 [${taskSlot.task.name}]：${taskSlot.task.desc} 获得${currencyName} x${reward}`;
        if (specialItem) {
          logMsg += `，以及 [${specialItem.name}]`;
        }
        logMsg += "。";
        addLog(logMsg);
      } else {
        addLog(`任务失败 [${taskSlot.task.name}]：由于修为不足或意外干扰，你未能完成任务，空手而归。`);
        setNpcQuote("意料之中，就你这点微末道行，还想接这种差事？");
      }
      
      // Significantly increased cooldowns
      const cooldownTime = taskSlot.task.difficulty === '简单' ? 60 : 
                           taskSlot.task.difficulty === '普通' ? 300 : 900;

      const next = [...prev];
      next[index] = { ...taskSlot, status: 'cooldown', timer: cooldownTime, totalTime: cooldownTime };
      return next;
    });
  }, [player.stageIndex, saveGame]);

  const replaceTask = useCallback((index: number) => {
    setAvailableTasks(prev => {
      const taskSlot = prev[index];
      if (!taskSlot || taskSlot.status !== 'replace_pending') return prev;

      const currentTaskNames = prev.map(s => s.task.name);
      const pool = WORK_TASKS.filter(t => !currentTaskNames.includes(t.name));
      const newTask = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : WORK_TASKS[Math.floor(Math.random() * WORK_TASKS.length)];
      
      // Determine stone type based on difficulty
      let stoneType: 'low' | 'high' | 'top' = 'low';
      const rand = Math.random();
      if (newTask.difficulty === '简单') {
        stoneType = rand > 0.9 ? 'high' : 'low';
      } else if (newTask.difficulty === '普通') {
        if (rand > 0.95) stoneType = 'top';
        else if (rand > 0.2) stoneType = 'high';
        else stoneType = 'low';
      } else {
        stoneType = 'top';
      }

      const next = [...prev];
      const successChance = getTaskSuccessChance(newTask.difficulty);
      next[index] = { task: newTask, status: 'available', timer: 0, totalTime: 0, stoneType, successChance };
      return next;
    });
  }, [getTaskSuccessChance]);

  const refreshMarket = useCallback(() => {
    const count = 4 + Math.floor(Math.random() * 3);
    const selected = [];
    const pool = [...MARKET_POOL];
    
    // Shuffle pool to ensure uniqueness and randomness
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    for (let i = 0; i < count; i++) {
      if (pool.length === 0) break;
      const item = pool.pop()!;
      // Cost scales with player progress
      const cost = Math.floor(item.costBase * (1 + player.stageIndex * 0.1));
      selected.push({ ...item, cost });
    }
    
    setMarketItems(selected);
    setMarketRefreshTime(300);
    addLog("【系统】坊市商品已刷新，快去看看有没有心仪的宝物！");
    setNpcQuote(CONDITIONAL_QUOTES.marketRefresh[Math.floor(Math.random() * CONDITIONAL_QUOTES.marketRefresh.length)]);
  }, [player.stageIndex]);

  const refreshTasks = useCallback(() => {
    const count = 4;
    const selected = [];
    const pool = [...WORK_TASKS];
    
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    for (let i = 0; i < count; i++) {
      if (pool.length === 0) break;
      const task = pool.pop()!;
      let stoneType: 'low' | 'high' | 'top' = 'low';
      const rand = Math.random();
      if (task.difficulty === '简单') {
        stoneType = rand > 0.9 ? 'high' : 'low';
      } else if (task.difficulty === '普通') {
        if (rand > 0.95) stoneType = 'top';
        else if (rand > 0.2) stoneType = 'high';
        else stoneType = 'low';
      } else {
        stoneType = 'top';
      }

      // 随机决定是否有物品奖励
      let possibleItem = null;
      if (Math.random() < 0.2) { // 20%的概率有物品奖励
        const possibleItems = [
          { id: 'elixir_small', name: "小还丹", desc: "提升少量修炼效率" },
          { id: 'savvy_scroll', name: "悟道残页", desc: "提升少量悟性" },
          { id: 'hp_pill', name: "补血丹", desc: "提升气血上限" },
          { id: 'atk_stone', name: "磨刀石", desc: "提升攻击力" },
          { id: 'def_charm', name: "护身符", desc: "提升防御力" }
        ];
        possibleItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      }

      const successChance = getTaskSuccessChance(task.difficulty);
      selected.push({ task, status: 'available', timer: 0, totalTime: 0, stoneType, successChance, possibleItem });
    }
    
    setAvailableTasks(selected);
  }, [getTaskSuccessChance]);

  const handleManualTaskRefresh = () => {
    if (taskRefreshCooldown > 0) {
      addLog("任务刷新冷却中，请稍后再试！");
      return;
    }
    
    refreshTasks();
    setTaskRefreshCooldown(18000); // 5小时冷却
    addLog("【系统】任务已刷新，新的任务已经发布！");
  };

  // --- Effects ---
  useEffect(() => {
    if (!player.spiritRootId && !showInitModal) {
      setShowInitModal(true);
      setInitStep('name');
    }
  }, [player.spiritRootId, showInitModal]);

  useEffect(() => {
    if (player.hp <= 0 && !player.isDead && player.spiritRootId) {
      setPlayer(prev => {
        const next = { ...prev, isDead: true };
        saveGame(next);
        return next;
      });
      addLog("你伤势过重，灵力枯竭，终究还是没能挺过去... 这一世结束了。");
    }
  }, [player.hp, player.isDead, player.spiritRootId, saveGame]);

  useEffect(() => {
    refreshMarket();
    refreshTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused || player.isDead || !player.spiritRootId) return;
      setMarketRefreshTime(prev => {
        if (prev <= 1) {
          refreshMarket();
          return 300;
        }
        return prev - 1;
      });

      // Handle Stone Exchange Cooldown
      setStoneExchangeCooldown(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });

      // Handle Task Refresh Cooldown
      setTaskRefreshCooldown(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });

      // Handle Auto Task Refresh
      setAutoTaskRefreshTime(prev => {
        if (prev <= 1) {
          refreshTasks();
          addLog("【系统】任务自动刷新，新的任务已经发布！");
          return 10800; // 3小时
        }
        return prev - 1;
      });

      // Handle Task Timers
      setAvailableTasks(prev => {
        let changed = false;
        const next = prev.map((slot, idx) => {
          if (slot.timer > 0) {
            changed = true;
            const newTimer = Math.max(0, slot.timer - 1);
            if (newTimer === 0) {
              if (slot.status === 'working') {
                // We can't call completeWork here directly because of state closure
                // So we'll handle completion in a separate effect or by status change
                return { ...slot, status: 'completed_pending', timer: 0 };
              } else if (slot.status === 'cooldown') {
                return { ...slot, status: 'replace_pending', timer: 0 };
              }
            }
            return { ...slot, timer: newTimer };
          }
          return slot;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, refreshMarket, refreshTasks]);

  // Handle Task Completion and Replacement
  useEffect(() => {
    const tasksToProcess = [...availableTasks];
    tasksToProcess.forEach((slot, i) => {
      if (slot.status === 'completed_pending') {
        // 立即修改状态，防止重复调用
        setAvailableTasks(prev => {
          const newTasks = [...prev];
          newTasks[i] = { ...newTasks[i], status: 'processing' };
          // 直接在状态更新后执行任务完成逻辑
          completeWork(i);
          return newTasks;
        });
      } else if (slot.status === 'replace_pending') {
        replaceTask(i);
      }
    });
  }, [availableTasks, completeWork, replaceTask]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused || player.isDead || !player.spiritRootId) return;
      const gain = getIdleExp();
      const facility = getFacilityStats();
      
      setPlayer(prev => {
        const req = getExpRequirement(prev.stageIndex);
        
        // Auto-heal: 1% of maxHp per second (0.1% per 100ms)
        const healAmount = prev.maxHp * 0.001;
        const newHp = Math.min(prev.maxHp, prev.hp + healAmount);

        const stoneGain = (facility.stoneRate || 0) / 10; // 100ms interval
        
        const next = { ...prev, exp: prev.exp >= req ? prev.exp : Math.min(req, prev.exp + gain / 10), hp: newHp };
        
        // 根据万宝商会的等级和玩家境界决定产出的灵石类型
        if (facility.stoneRate > 0 && player.sectId === 'wanbao') {
          const facilityLevel = player.arrayLevel;
          const majorRealmLevel = Math.floor(player.stageIndex / 10) + 1;
          
          if (facilityLevel >= 15 || majorRealmLevel >= 7) {
            // 后期：产出极品灵石
            next.stonesTop = (prev.stonesTop || 0) + (facility.stoneRate / 100) / 10; // 100ms interval
          } else if (facilityLevel >= 10 || majorRealmLevel >= 4) {
            // 中期：产出高级灵石
            next.stonesHigh = (prev.stonesHigh || 0) + (facility.stoneRate / 10) / 10; // 100ms interval
          } else {
            // 前期：产出下品灵石
            next.stonesLow = prev.stonesLow + facility.stoneRate / 10; // 100ms interval
          }
        }
        
        // Auto-save every 10 seconds
        if (Date.now() - lastSaveRef.current > 10000) {
          saveGame(next);
          lastSaveRef.current = Date.now();
        }
        
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, saveGame]);

  // --- NPC Logic ---
  const updateNpcQuote = useCallback(() => {
    let pool = [...OLD_MAN_QUOTES];

    if (player.stonesLow > 1000 || player.stonesHigh > 100 || player.stonesTop > 10) {
      pool = [...pool, ...CONDITIONAL_QUOTES.highStones];
    }
    if (consecutiveFails >= 2) {
      pool = [...pool, ...CONDITIONAL_QUOTES.consecutiveFails];
    }
    if (player.arrayLevel < 3 && player.stageIndex > 10) {
      pool = [...pool, ...CONDITIONAL_QUOTES.lowEfficiency];
    }
    if (player.hp < player.maxHp * 0.3) {
      pool = [...pool, ...CONDITIONAL_QUOTES.lowHp];
    }
    if (player.savvy > 30) {
      pool = [...pool, ...CONDITIONAL_QUOTES.highSavvy];
    }

    setNpcQuote(pool[Math.floor(Math.random() * pool.length)]);
  }, [player.stones, player.arrayLevel, player.stageIndex, player.hp, player.maxHp, player.savvy, consecutiveFails]);

  // Periodic NPC quotes
  useEffect(() => {
    const interval = setInterval(() => {
      updateNpcQuote();
    }, 30000);
    return () => clearInterval(interval);
  }, [updateNpcQuote]);

  // World Rumors trigger
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return;
      const rumor = WORLD_RUMORS[Math.floor(Math.random() * WORLD_RUMORS.length)];
      addLog(rumor);
    }, 60000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleReincarnation = () => {
    setShowInitModal(true);
    setInitStep('name');
    setTempName("");
    setShowReincarnationConfirm(false);
    setLogs(["欢迎来到修仙世界，开始你的长生之路吧。"]);
  };

  const expReq = getExpRequirement(player.stageIndex);
  const progress = Math.min(100, (player.exp / expReq) * 100);

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-5xl mx-auto h-full font-pixel">
      {/* Header */}
      <div className="flex justify-between w-full items-center bg-black/40 p-3 pixel-border border-arcade-blue">
        <h1 className="text-arcade-blue text-lg">凡人修仙传</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowReincarnationConfirm(true)} 
            className="pixel-button !py-1 !px-3 !text-[10px] !bg-arcade-pink/20 hover:!bg-arcade-pink/40"
          >
            兵解转生
          </button>
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className="pixel-button !py-1 !px-3 !text-[10px]"
          >
            {isPaused ? '继续' : '暂停'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full flex-1 min-h-0">
        {/* Left Panel: Status */}
        <div className="md:col-span-4 bg-black/60 p-4 pixel-border border-arcade-yellow flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-white/10 pb-2">
            <div className="w-12 h-12 bg-arcade-purple pixel-border flex items-center justify-center text-xl">
              修
            </div>
            <div>
                <div className="text-arcade-yellow text-sm">{player.name}</div>
                <div className="text-white/60 text-[10px]">名号：{getTitle(player.stageIndex)}</div>
              </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-arcade-green">当前境界: {getRealmName(player.stageIndex)}</span>
                <span className="text-white/40">{Math.floor(player.exp)} / {expReq}</span>
              </div>
              <div className="w-full h-3 bg-black/80 pixel-border border-black overflow-hidden">
                <div 
                  className="h-full bg-arcade-green transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">灵根</div>
                <div className="text-arcade-yellow">{SPIRIT_ROOTS.find(r => r.id === player.spiritRootId)?.name || "无"}</div>
                {player.rootBreakthroughLevel && player.rootBreakthroughLevel > 0 && (
                  <div className="text-arcade-green text-[8px] mt-1">突破等级: {player.rootBreakthroughLevel}</div>
                )}
                {player.specialRoot && (
                  <div className="text-arcade-pink text-[8px] mt-1">特殊体质: {player.specialRoot === 'hundun' ? '混沌体' : '特殊体质'}</div>
                )}
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">宗门</div>
                <div className="text-arcade-blue">{SECTS.find(s => s.id === player.sectId)?.name || "散修"}</div>
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5 col-span-2">
                <div className="text-white/40 mb-1">灵石储备</div>
                <div className="flex justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[8px]">下品</span>
                    <span className="text-arcade-yellow">{Math.floor(player.stonesLow)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[8px]">高级</span>
                    <span className="text-arcade-blue">{Math.floor(player.stonesHigh)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[8px]">极品</span>
                    <span className="text-arcade-pink">{Math.floor(player.stonesTop)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">修炼效率</div>
                <div className="text-arcade-blue">
                  x{( 
                    (1 + player.elixirCount * 0.2) * 
                    (player.savvy / 10) * 
                    (SPIRIT_ROOTS.find(r => r.id === player.spiritRootId)?.expBonus || 1) * 
                    (SECTS.find(s => s.id === player.sectId)?.expBonus || 1) 
                  ).toFixed(1)}
                </div>
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">攻击力</div>
                <div className="text-arcade-pink">{player.attack + (getFacilityStats().atk || 0)}</div>
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">防御力</div>
                <div className="text-arcade-blue">{player.defense + (getFacilityStats().def || 0)}</div>
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">气血值</div>
                <div className="text-red-400">{Math.floor(player.hp)} / {player.maxHp}</div>
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">悟性</div>
                <div className="text-purple-400">{player.savvy}</div>
              </div>
            </div>

            <div className="text-[10px] text-white/40 bg-black/20 p-2 rounded italic">
              自动修为: +{getIdleExp().toFixed(1)} /秒
            </div>
          </div>

          {/* NPC Section */}
          {hasRingElder && (
            <div className="mt-auto pt-4 border-t border-white/10">
              <div className="flex gap-2 items-start">
                <div className="w-8 h-8 bg-gray-700 pixel-border flex-shrink-0 flex items-center justify-center text-xs">👴</div>
                <div className="text-[9px] text-arcade-blue leading-relaxed">
                  <span className="text-white/40 block mb-1">戒指里的老爷爷：</span>
                  "{npcQuote}"
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Modules */}
        <div className="md:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Tabs */}
          <div className="flex gap-1">
            {(['cultivate', 'adventure', 'tasks', 'abode', 'market', 'inventory'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[10px] pixel-border transition-colors ${
                  activeTab === tab 
                  ? 'bg-arcade-blue text-white border-arcade-blue' 
                  : 'bg-black/40 text-white/40 border-white/10 hover:bg-black/60'
                }`}
              >
                {tab === 'cultivate' && '修行'}
                {tab === 'adventure' && '历练'}
                {tab === 'tasks' && '打工'}
                {tab === 'abode' && '洞府'}
                {tab === 'market' && '坊市'}
                {tab === 'inventory' && '背包'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-black/60 p-6 pixel-border border-white/10 overflow-y-auto">
            {activeTab === 'cultivate' && (
              <div className="flex flex-col items-center justify-center h-full gap-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-arcade-blue/20 rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-24 h-24 bg-arcade-blue/40 rounded-full animate-ping" />
                    {player.exp >= expReq && (
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-2 py-1 pixel-border animate-bounce">
                        瓶颈
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleManualCultivate}
                    className="absolute inset-0 flex items-center justify-center text-white font-pixel hover:scale-110 transition-transform"
                  >
                    闭关修炼
                  </button>
                </div>
                
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  {(() => {
                    const { chance, message } = getBreakthroughInfo();
                    const nextStageIndex = player.stageIndex + 1;
                    const needTribulation = nextStageIndex >= 30 && (player.stageIndex % 10 === 0 && player.stageIndex !== 0);
                    return (
                      <>
                        <button 
                          onClick={handleBreakthrough}
                          disabled={player.exp < expReq}
                          className={`w-full pixel-button ${player.exp < expReq ? 'opacity-50 grayscale cursor-not-allowed' : 'animate-bounce'}`}
                        >
                          {message} ({Math.floor(chance * 100)}% 成功率)
                        </button>
                        <p className="text-[9px] text-white/40 text-center">
                          {needTribulation 
                            ? "渡劫失败将扣除 50% 当前修为并受到重创，请谨慎行事。" 
                            : "突破失败将扣除 50% 当前修为，请谨慎行事。"}
                        </p>
                        {needTribulation && (
                          <div className="text-[9px] text-arcade-yellow text-center">
                            提示：使用渡劫丹或飞升丹可以提高渡劫成功率
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'adventure' && (
              <div className="flex flex-col h-full gap-4">
                <div className="flex justify-center py-4">
                  <button onClick={handleAdventure} className="pixel-button !px-12">
                    外出冒险
                  </button>
                </div>
                <div className="flex-1 bg-black/40 pixel-border border-white/5 p-3 overflow-y-auto font-mono text-[10px] space-y-2">
                  <div className="text-arcade-blue border-b border-white/5 pb-1 mb-2">历练日志</div>
                  {logs.map((log, i) => (
                    <div key={i} className={`${i === 0 ? 'text-white' : 'text-white/40'}`}>
                      {`> ${log}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'abode' && (
              <div className="space-y-6">
                <div className="bg-black/40 p-4 pixel-border border-arcade-green">
                  <h3 className="text-arcade-green text-sm mb-2">{getFacilityStats().name} (Lv.{player.arrayLevel})</h3>
                  <p className="text-[10px] text-white/60 mb-4">
                    {getFacilityStats().desc}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-[10px]">
                      <div className="text-white/40">当前效果: +{getIdleExp().toFixed(1)} 修为/秒</div>
                      {getFacilityStats().atk !== 0 && <div className="text-arcade-pink">攻击加成: {getFacilityStats().atk > 0 ? '+' : ''}{getFacilityStats().atk}</div>}
                      {getFacilityStats().def !== 0 && <div className="text-arcade-blue">防御加成: {getFacilityStats().def > 0 ? '+' : ''}{getFacilityStats().def}</div>}
                      {getFacilityStats().stoneRate > 0 && player.sectId === 'wanbao' && (
                        <div className="text-arcade-yellow">
                          {(() => {
                            const facilityLevel = player.arrayLevel;
                            const majorRealmLevel = Math.floor(player.stageIndex / 10) + 1;
                            const stoneRate = getFacilityStats().stoneRate;
                            
                            if (facilityLevel >= 15 || majorRealmLevel >= 7) {
                              return `灵石产出: +${(stoneRate / 100).toFixed(2)} 极品灵石/秒`;
                            } else if (facilityLevel >= 10 || majorRealmLevel >= 4) {
                              return `灵石产出: +${(stoneRate / 10).toFixed(2)} 高级灵石/秒`;
                            } else {
                              return `灵石产出: +${stoneRate.toFixed(1)} 下品灵石/秒`;
                            }
                          })()}
                        </div>
                      )}
                      {getFacilityStats().stoneRate > 0 && player.sectId !== 'wanbao' && <div className="text-arcade-yellow">灵石产出: +{getFacilityStats().stoneRate.toFixed(1)}/秒</div>}
                      {getFacilityStats().elixirMult > 1 && <div className="text-purple-400">丹药增益: +{((getFacilityStats().elixirMult - 1) * 100).toFixed(0)}%</div>}
                      <div className="text-arcade-green mt-1">升级后: 效果显著提升</div>
                    </div>
                    <button onClick={handleUpgradeArray} className="pixel-button !py-2 !px-4 !text-[10px]">
                      升级 (需 {
                        player.arrayLevel < 10 ? Math.floor(100 * Math.pow(1.5, player.arrayLevel)) :
                        player.arrayLevel < 20 ? Math.floor(50 * Math.pow(1.5, player.arrayLevel - 10)) :
                        Math.floor(20 * Math.pow(1.5, player.arrayLevel - 20))
                      } {
                        player.arrayLevel < 10 ? '下品灵石' :
                        player.arrayLevel < 20 ? '高级灵石' : '极品灵石'
                      })
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <div className="text-arcade-blue text-xs border-b border-white/10 pb-2 flex justify-between">
                  <span>储物袋</span>
                  <span className="text-[8px] text-white/40">点击物品即可使用</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(player.inventory).filter(([_, count]) => (count as number) > 0).map(([itemId, count]) => {
                    const item = MARKET_POOL.find(i => i.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="bg-black/40 p-3 pixel-border border-white/10 flex flex-col gap-2 group hover:border-arcade-blue transition-colors relative">
                        <div className="flex justify-between items-start">
                          <div className="text-white text-[10px]">{item.name}</div>
                          <div className="text-arcade-blue text-[10px]">x{count as number}</div>
                        </div>
                        <p className="text-[8px] text-white/40 line-clamp-2">{item.desc}</p>
                        <button 
                          onClick={() => handleUseItem(itemId)}
                          className="pixel-button !py-1 !px-3 !text-[8px] !bg-arcade-blue/20 hover:!bg-arcade-blue/40 mt-2"
                        >
                          使用
                        </button>
                      </div>
                    );
                  })}
                  {Object.values(player.inventory).every(count => (count as number) === 0) && (
                    <div className="col-span-2 py-12 text-center text-white/20 text-[10px]">
                      储物袋空空如也...
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="text-arcade-yellow text-xs border-b border-white/10 pb-2 flex justify-between items-center">
                  <span>悬赏告示栏</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-white/40">距离下次自动刷新: {Math.floor(autoTaskRefreshTime / 3600)}时{Math.floor((autoTaskRefreshTime % 3600) / 60)}分{autoTaskRefreshTime % 60}秒</span>
                    <button 
                      onClick={handleManualTaskRefresh}
                      className={`pixel-button !py-1 !px-2 !text-[8px] ${taskRefreshCooldown > 0 ? '!bg-gray-700 !cursor-not-allowed' : '!bg-arcade-green/20 hover:!bg-arcade-green/40'}`}
                      disabled={taskRefreshCooldown > 0}
                    >
                      {taskRefreshCooldown > 0 ? `刷新(${Math.floor(taskRefreshCooldown / 3600)}h${Math.floor((taskRefreshCooldown % 3600) / 60)}m)` : '刷新任务'}
                    </button>
                  </div>
                </div>
                <div className="grid gap-3">
                  {availableTasks.map((slot, i) => (
                    <div key={i} className="bg-black/40 p-3 pixel-border border-white/10 flex flex-col gap-2 group hover:border-arcade-yellow transition-colors relative overflow-hidden">
                      {/* Progress Bar for Working/Cooldown */}
                      {(slot.status === 'working' || slot.status === 'cooldown') && (
                        <div 
                          className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${slot.status === 'working' ? 'bg-arcade-blue' : 'bg-gray-600'}`}
                          style={{ width: `${(slot.timer / slot.totalTime) * 100}%` }}
                        />
                      )}

                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-[10px]">{slot.task.name}</span>
                            <span className={`text-[8px] px-1 ${
                              slot.task.difficulty === '简单' ? 'text-green-400' : 
                              slot.task.difficulty === '普通' ? 'text-blue-400' : 'text-red-400'
                            }`}>[{slot.task.difficulty}]</span>
                          </div>
                          <p className="text-[8px] text-white/40">{slot.task.desc}</p>
                          {slot.possibleItem && (
                            <div className="text-[8px] text-arcade-green">
                              额外奖励: {slot.possibleItem.name}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          <div className={`text-[10px] ${
                            slot.stoneType === 'low' ? 'text-arcade-yellow' : 
                            slot.stoneType === 'high' ? 'text-arcade-blue' : 'text-arcade-pink'
                          }`}>
                            {slot.stoneType === 'low' ? '下品' : slot.stoneType === 'high' ? '高级' : '极品'}灵石 x{Math.floor(slot.task.rewardBase * (Math.floor(player.stageIndex / 10) + 1) * 0.8)}-{Math.floor(slot.task.rewardBase * (Math.floor(player.stageIndex / 10) + 1) * 1.2)}
                          </div>
                          <div className="text-[8px] text-white/30">
                            成功率: {Math.floor((slot.successChance ?? getTaskSuccessChance(slot.task.difficulty)) * 100)}%
                          </div>
                          
                          {slot.status === 'available' && (
                            <button 
                              onClick={() => handleDoWork(slot, i)}
                              className="pixel-button !py-1 !px-3 !text-[8px] !bg-arcade-yellow/20 hover:!bg-arcade-yellow/40"
                            >
                              接取
                            </button>
                          )}
                          
                          {slot.status === 'working' && (
                            <div className="text-[8px] text-arcade-blue animate-pulse">
                              处理中 ({slot.timer}s)
                            </div>
                          )}

                          {slot.status === 'cooldown' && (
                            <div className="text-[8px] text-white/20">
                              冷却中 ({slot.timer}s)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] text-white/20 italic text-center">任务完成后该栏位会进入冷却并刷新...</p>
              </div>
            )}

            {activeTab === 'market' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h3 className="text-arcade-pink text-sm">万宝阁</h3>
                  <span className="text-[8px] text-white/40">距离下次刷新: {Math.floor(marketRefreshTime / 60)}分{marketRefreshTime % 60}秒</span>
                </div>
                
                {/* 灵石兑换 */}
                <div className="bg-black/40 p-4 pixel-border border-arcade-green/30">
                  <h4 className="text-arcade-green text-sm mb-3">灵石兑换</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <select 
                        value={exchangeFrom} 
                        onChange={(e) => setExchangeFrom(e.target.value as 'top' | 'high' | 'low')}
                        className="bg-black/60 text-white text-[10px] px-2 py-1 border border-white/20"
                      >
                        <option value="top">极品灵石</option>
                        <option value="high">高级灵石</option>
                        <option value="low">下品灵石</option>
                      </select>
                      <span className="text-white/40">→</span>
                      <select 
                        value={exchangeTo} 
                        onChange={(e) => setExchangeTo(e.target.value as 'top' | 'high' | 'low')}
                        className="bg-black/60 text-white text-[10px] px-2 py-1 border border-white/20"
                      >
                        <option value="top">极品灵石</option>
                        <option value="high">高级灵石</option>
                        <option value="low">下品灵石</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/60">数量：</span>
                      <input 
                        type="number" 
                        min="1" 
                        value={exchangeAmount} 
                        onChange={(e) => setExchangeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="bg-black/60 text-white text-[10px] px-2 py-1 border border-white/20 w-20"
                      />
                    </div>
                    <div className="text-[8px] text-white/40 mb-2">
                      兑换比例：1极品 = 1000高级 = 1,000,000下品
                    </div>
                    <button 
                      onClick={handleStoneExchange}
                      disabled={stoneExchangeCooldown > 0}
                      className={`pixel-button !py-2 !px-4 !text-[10px] ${stoneExchangeCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {stoneExchangeCooldown > 0 
                        ? `冷却中 (${Math.floor(stoneExchangeCooldown / 3600)}小时${Math.floor((stoneExchangeCooldown % 3600) / 60)}分)` 
                        : '兑换'}
                    </button>
                  </div>
                </div>
                
                {/* 商品列表 */}
                {marketItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <div className="text-2xl mb-2">📦</div>
                    <div className="text-[10px]">商品已售罄，请等待刷新</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {marketItems.map((item, i) => (
                      <div key={i} className="bg-black/40 p-3 pixel-border border-arcade-pink/20 hover:border-arcade-pink transition-colors flex flex-col justify-between">
                        <div className="mb-3">
                          <div className="text-white text-[10px] mb-1">{item.name}</div>
                          <p className="text-[8px] text-white/40 leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                          <span className={`text-[10px] ${
                            item.currencyType === 'low' ? 'text-arcade-yellow' : 
                            item.currencyType === 'high' ? 'text-arcade-blue' : 'text-arcade-pink'
                          }`}>
                            {item.cost} {item.currencyType === 'low' ? '下品' : item.currencyType === 'high' ? '高级' : '极品'}
                          </span>
                          <button 
                            onClick={() => handleBuyItem(item, i)}
                            className={`pixel-button !py-1 !px-3 !text-[8px] ${
                              item.currencyType === 'low' ? '!bg-arcade-pink/20 hover:!bg-arcade-pink/40' :
                              item.currencyType === 'high' ? '!bg-arcade-blue/20 hover:!bg-arcade-blue/40' :
                              '!bg-arcade-yellow/20 hover:!bg-arcade-yellow/40'
                            }`}
                          >
                            购买
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="bg-black/20 p-3 rounded text-[8px] text-white/40 leading-relaxed">
                  提示：万宝阁的商品价格会随着你的境界提升而略微上涨，但品质也会随之提高。
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="w-full p-4 bg-black/40 border-2 border-arcade-blue/30 rounded-lg">
        <h3 className="font-pixel text-[10px] text-arcade-blue mb-2">修仙指南</h3>
        <ul className="text-[10px] text-gray-400 font-pixel list-disc list-inside space-y-1">
          <li>点击“闭关修炼”手动获得修为，修为满后可尝试“突破”。</li>
          <li>“外出冒险”可以获得灵石，但也可能遭遇危险损失资源。</li>
          <li>在“洞府”升级聚灵阵可获得挂机修为，在“坊市”购买丹药可提升修炼效率。</li>
          <li>游戏会自动保存到本地，你可以随时回来继续你的长生之路。</li>
        </ul>
      </div>

      {/* Init/Reincarnation Modal */}
      {showInitModal && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 font-mono">
          <div className="max-w-md w-full bg-gray-900 pixel-border border-arcade-blue p-6 space-y-6">
            <h2 className="text-arcade-blue text-center text-lg">
              {player.isDead ? "转世重生" : "踏入仙途"}
            </h2>
            
            {initStep === 'name' && (
              <div className="space-y-4">
                <p className="text-white/60 text-sm">修行第一步，请定下你的道号：</p>
                <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="输入你的名字..."
                  className="w-full bg-black border border-white/20 p-2 text-white outline-none focus:border-arcade-blue"
                />
                <button 
                  disabled={!tempName.trim()}
                  onClick={() => setInitStep('root')}
                  className="w-full pixel-button disabled:opacity-50"
                >
                  确定
                </button>
              </div>
            )}

            {initStep === 'root' && (
              <div className="space-y-4 text-center">
                <p className="text-white/60 text-sm">感应天地灵气，测定你的灵根资质...</p>
                <button 
                  onClick={rollSpiritRoot}
                  className="w-full pixel-button animate-pulse"
                >
                  测定灵根
                </button>
              </div>
            )}

            {initStep === 'sect' && (
              <div className="space-y-4">
                <div className="p-3 bg-black/40 border border-arcade-yellow">
                  <p className="text-arcade-yellow text-xs mb-1">测定结果：</p>
                  <p className="text-white text-sm font-bold">{SPIRIT_ROOTS.find(r => r.id === rolledRootId)?.name}</p>
                  <p className="text-white/40 text-[10px] mt-1">{SPIRIT_ROOTS.find(r => r.id === rolledRootId)?.desc}</p>
                </div>
                
                <p className="text-white/60 text-xs">选择你的修行起点：</p>
                <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-arcade-blue">
                  <button 
                    onClick={() => handleInitPlayer(tempName, rolledRootId!, undefined)}
                    className="p-2 bg-black/40 border border-white/10 text-left hover:border-arcade-blue group"
                  >
                    <div className="text-white text-xs">散修 (自由城邦)</div>
                    <div className="text-white/40 text-[8px]">无拘无束，但资源匮乏。</div>
                  </button>
                  {SECTS.map(sect => {
                    const rootQuality = SPIRIT_ROOTS.find(r => r.id === rolledRootId)?.quality || 0;
                    const canJoin = rootQuality >= sect.minQuality;
                    return (
                      <button 
                        key={sect.id}
                        disabled={!canJoin}
                        onClick={() => handleInitPlayer(tempName, rolledRootId!, sect.id)}
                        className={`p-2 bg-black/40 border text-left transition-colors ${
                          canJoin ? 'border-white/10 hover:border-arcade-blue' : 'border-red-900/50 opacity-50 grayscale'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white text-xs">{sect.name} ({sect.rank})</span>
                          {!canJoin && <span className="text-red-500 text-[8px]">资质不足</span>}
                        </div>
                        <div className="text-white/40 text-[8px]">{sect.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Death Modal */}
      {player.isDead && !showInitModal && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 font-mono">
          <div className="max-w-md w-full bg-gray-900 pixel-border border-red-600 p-8 text-center space-y-8">
            <h2 className="text-red-600 text-2xl animate-pulse">道消身死</h2>
            <div className="space-y-4">
              <p className="text-white/60 text-sm">
                [{player.name}] 这一世的修行已到尽头。
              </p>
              <p className="text-white/40 text-xs italic">
                "修仙之路，本就是逆天而行，陨落亦是常态..."
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  setShowInitModal(true);
                  setInitStep('name');
                  setTempName("");
                }}
                className="w-full pixel-button !bg-red-900/40 hover:!bg-red-800/60"
              >
                转世重生
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="text-white/20 text-[10px] hover:text-white/40 transition-colors"
              >
                结束游戏
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reincarnation Confirmation Modal */}
      {showReincarnationConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a2e] pixel-border border-arcade-pink p-6 max-w-sm w-full text-center space-y-6">
            <h3 className="text-arcade-pink font-pixel text-sm">确认兵解转生？</h3>
            <p className="text-[10px] text-white/60 leading-relaxed">
              确定要兵解转生，重入轮回吗？<br />
              此操作将散尽全身修为与财货，不可逆转！
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowReincarnationConfirm(false)}
                className="flex-1 pixel-button !bg-gray-600 !py-2"
              >
                暂缓转生
              </button>
              <button 
                onClick={handleReincarnation}
                className="flex-1 pixel-button !bg-arcade-pink !py-2"
              >
                即刻兵解
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
