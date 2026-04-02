import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Data & Config ---
const REALMS = [
  "凡人", "炼气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫", "大帝"
];

const BREAKTHROUGH_MESSAGES: Record<string, { success: string; fail: string }> = {
  "炼气": { success: "引气入体，经脉初开，你终于踏入了修仙之门。", fail: "灵气暴走，经脉受损，看来根基尚不够稳固。" },
  "筑基": { success: "灵力液化，筑基台稳固，从此脱离凡胎，寿元大增。", fail: "筑基台崩裂，灵力溃散，险些道基全毁。" },
  "金丹": { success: "金丹凝结，圆润无暇，从此我命由我不由天！", fail: "金丹碎裂，险些身陨，修为大损。" },
  "元婴": { success: "破丹成婴，元神出窍，天地造化尽在掌握。", fail: "元婴难成，神魂受创，需要闭关修养。" },
  "化神": { success: "神与意合，化神而生，举手投足间皆是法则。", fail: "神魂不稳，险些走火入魔，功亏一篑。" },
  "炼虚": { success: "虚实转换，炼虚合道，你已触及这方世界的本源。", fail: "虚实失衡，肉身受损，修仙之路果然艰辛。" },
  "合体": { success: "身神合一，不死不灭，这世间已鲜有敌手。", fail: "合体失败，肉身崩溃，幸得保住一丝神魂。" },
  "大乘": { success: "大乘圆满，法则尽通，只待飞升之日。", fail: "法则反噬，修为倒退，大乘之路难如登天。" },
  "渡劫": { success: "天劫已过，仙灵之气入体，你已半步成仙。", fail: "天雷轰顶，险些灰飞烟灭，需要重修道心。" },
  "大帝": { success: "证道成帝，镇压万古，诸天万界唯你独尊！", fail: "帝路断绝，万古成空，终究还是差了一线。" }
};

const CULTIVATION_PARTS = {
  actions: ["你运转功法", "你吞吐灵气", "你闭目冥想", "你感悟天地", "你引导紫气", "你洗涤经脉", "你凝练灵力"],
  sensations: ["周身穴位发热", "丹田隐隐作痛", "神识一片清明", "灵气如潮水涌动", "经脉微微震颤", "心境古井无波"],
  results: ["修为略有精进。", "灵力更显凝实。", "一丝感悟涌上心头。", "气息稳步攀升。", "根基愈发深厚。", "距离突破又近一步。"]
};

const WORLD_RUMORS = [
  "【传闻】据说极北之地有异宝出世，引得无数老怪前往。",
  "【传闻】万宝阁今日举行大型拍卖会，压轴宝物竟是一枚九品丹药。",
  "【传闻】某位隐世大能的洞府被发现，修仙界又要掀起一番腥风血雨了。",
  "【传闻】听说东海之滨有龙吟声传出，不知是真是假。",
  "【传闻】最近坊市间的灵石汇率波动剧烈，不少散修叫苦连天。",
  "【传闻】天剑宗的天才弟子闭关百年，今日终于破关而出了。",
  "【传闻】南疆瘴气林中出现了一头万年妖王，路过修士请务必小心。"
];

const MONSTERS = [
  "疾风狼", "嗜血虎", "幻影蛛", "铁甲犀", "青鳞蟒", "烈焰狮", "冰原熊", "地底蝎", "金翅雕", "九头蛇", "撼天猿"
];

const EVENTS = {
  positive: [
    { text: "你在山间偶遇一处废弃洞府，获得灵石 x{val}。", type: 'stones', base: 50 },
    { text: "路遇一位重伤散修，你施以援手，对方赠予你灵石 x{val}。", type: 'stones', base: 30 },
    { text: "在一处悬崖边发现一株百年灵药，服下后修为大增！", type: 'exp', base: 100 },
    { text: "捡到一枚储物戒指，里面竟有灵石 x{val}。", type: 'stones', base: 80 },
    { text: "感悟天地法则，瞬间获得大量修为！", type: 'exp', base: 200 },
    { text: "遇到神秘残魂指点，你的悟性提升了！", type: 'savvy', base: 1 },
    { text: "误服朱果，你的气血上限提升了！", type: 'hp', base: 20 }
  ],
  negative: [
    { text: "历练途中遭遇劫匪，虽然逃脱，但丢失了灵石 x{val}。", type: 'stones', base: -20 },
    { text: "强行突破经脉，导致灵力反噬，损失部分修为。", type: 'exp', base: -50 },
    { text: "误入迷阵，困了数日才脱身，身心俱疲。", type: 'none', base: 0 },
    { text: "遭遇妖兽袭击，负伤逃走，损失灵石 x{val} 购买伤药。", type: 'stones', base: -15 },
    { text: "修炼时不慎走火入魔，修为略有倒退。", type: 'exp', base: -30 }
  ],
  neutral: [
    { text: "今日天气晴朗，你坐在崖边感悟天地，心境平和。", type: 'none', base: 0 },
    { text: "在茶馆听说了一些修仙界的奇闻异事。", type: 'none', base: 0 },
    { text: "路过一座凡人小镇，感受了一番人间烟火。", type: 'none', base: 0 },
    { text: "看到两名修士为争夺宝物大打出手，你悄悄绕开。", type: 'none', base: 0 },
    { text: "在林间漫步，偶然惊起一群灵鸟。", type: 'none', base: 0 }
  ]
};

const MARKET_POOL = [
  { id: 'elixir_small', name: "小还丹", desc: "提升少量修炼效率", costBase: 100, effect: { elixir: 1 } },
  { id: 'elixir_mid', name: "大还丹", desc: "提升中量修炼效率", costBase: 500, effect: { elixir: 3 } },
  { id: 'elixir_large', name: "九转金丹", desc: "大幅提升修炼效率", costBase: 2000, effect: { elixir: 10 } },
  { id: 'savvy_scroll', name: "悟道残页", desc: "提升少量悟性", costBase: 300, effect: { savvy: 2 } },
  { id: 'savvy_book', name: "天书残卷", desc: "提升中量悟性", costBase: 1200, effect: { savvy: 8 } },
  { id: 'hp_pill', name: "补血丹", desc: "提升气血上限", costBase: 200, effect: { hp: 50 } },
  { id: 'hp_essence', name: "龙血精元", desc: "大幅提升气血上限", costBase: 1500, effect: { hp: 400 } },
  { id: 'atk_stone', name: "磨刀石", desc: "提升攻击力", costBase: 400, effect: { attack: 10 } },
  { id: 'atk_gem', name: "庚金之精", desc: "大幅提升攻击力", costBase: 1800, effect: { attack: 50 } },
  { id: 'def_charm', name: "护身符", desc: "提升防御力", costBase: 400, effect: { defense: 5 } },
  { id: 'def_shield', name: "玄武甲片", desc: "大幅提升防御力", costBase: 1800, effect: { defense: 25 } },
  { id: 'array_guide', name: "阵法心得", desc: "提升聚灵阵效率（额外加成）", costBase: 1000, effect: { elixir: 5 } }
];

const WORK_TASKS = [
  { name: "打扫炼丹房", difficulty: "简单", rewardBase: 30, desc: "虽然辛苦，但偶尔能闻到丹香，令人神清气爽。" },
  { name: "看守宗门", difficulty: "简单", rewardBase: 50, desc: "枯燥的差事，但胜在安全稳妥。" },
  { name: "灵田除草", difficulty: "简单", rewardBase: 40, desc: "小心那些会咬人的灵草，它们可不安分。" },
  { name: "后山采药", difficulty: "普通", rewardBase: 150, desc: "需要避开一些低级妖兽，有一定风险。" },
  { name: "驱赶灵兽", difficulty: "普通", rewardBase: 200, desc: "那些调皮的灵鹤总是乱跑，真让人头疼。" },
  { name: "整理经阁", difficulty: "普通", rewardBase: 180, desc: "在书海中寻找遗失的卷轴，或许能增长见识。" },
  { name: "押送货运", difficulty: "困难", rewardBase: 600, desc: "路途遥远，且常有劫匪出没，非强者不可为。" },
  { name: "镇压魔窟", difficulty: "困难", rewardBase: 1000, desc: "九死一生的任务，但奖励极其丰厚。" },
  { name: "猎杀悬赏", difficulty: "困难", rewardBase: 800, desc: "目标是为祸一方的凶兽，需要极强的战斗力。" }
];

const OLD_MAN_QUOTES = [
  "小子，就你这速度，老夫当年闭着眼都比你快！",
  "不错，这根骨虽然一般，但胜在心性坚定。",
  "快点突破，老夫还等着你重塑肉身呢！",
  "别整天想着奇遇，脚踏实地才是正道。",
  "哎，现在的年轻人，真是一代不如一代了...",
  "修炼一途，如逆水行舟，不进则退啊。",
  "这方天地的灵气，似乎比老夫那个时代稀薄了不少。",
  "道心不稳，万事皆空，你要时刻自省。",
  "修仙不只是打打杀杀，更多的是对天道的感悟。",
  "老夫当年纵横寰宇时，你祖宗还没出生呢！"
];

const CONDITIONAL_QUOTES = {
  highStones: [
    "怀揣这么多灵石作甚？赶紧去坊市换点有用的丹药！",
    "财不露白，小心被那些邪修盯上，去万宝阁消费一番吧。",
    "灵石只是身外之物，转化为实力才是硬道理。",
    "这么多灵石，老夫看着都眼红，可惜老夫现在只是个魂体。"
  ],
  consecutiveFails: [
    "胜败乃兵家常事，莫要灰心，稳固道心再试一次。",
    "看来是心魔作祟，去历练一番放松下心情再突破吧。",
    "突破失败也是一种磨炼，老夫当年也曾数次折戟。",
    "别急着突破，欲速则不达，先去打打工赚点灵石买点丹药补补。"
  ],
  lowEfficiency: [
    "这聚灵阵也太简陋了，简直是在浪费时间！",
    "就这灵气浓度，你还想修成大帝？赶紧升级阵法！",
    "老夫看着这阵法都心疼，去洞府里捯饬捯饬吧。",
    "工欲善其事，必先利其器，阵法不行，修炼再勤也是白搭。"
  ],
  lowHp: [
    "气血亏损如此严重，还不赶紧闭关调养？",
    "命都没了还修什么仙？快去休息！",
    "你这副残躯，怕是连只疾风狼都打不过。",
    "脸色这么难看，是不是又去招惹那些惹不起的妖兽了？"
  ],
  highSavvy: [
    "这悟性，倒是有老夫当年的几分风采。",
    "灵台清明，悟性极佳，是个修仙的好苗子。",
    "悟性虽高，也需勤加修炼，莫要荒废了天赋。",
    "天纵奇才啊，老夫果然没看错人。"
  ],
  marketRefresh: [
    "坊市那边似乎来了批新货，小子，不去凑凑热闹？",
    "万宝阁钟声响了，看来是有好东西上架了。",
    "去坊市转转吧，说不定能捡到什么漏。"
  ]
};

interface PlayerData {
  name: string;
  stageIndex: number; // 扁平化的等级索引：0=凡人, 1=炼气一层, 10=炼气巅峰, 11=筑基一层...
  exp: number;
  stones: number;
  arrayLevel: number;
  elixirCount: number;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  savvy: number; // 悟性
}

const STORAGE_KEY = 'pixel_joy_cultivation_save';

export default function Cultivation() {
  // --- State ---
  const [player, setPlayer] = useState<PlayerData>(() => {
    const defaultData = {
      name: "无名修士",
      stageIndex: 0,
      exp: 0,
      stones: 0,
      arrayLevel: 0,
      elixirCount: 0,
      attack: 10,
      defense: 5,
      hp: 100,
      maxHp: 100,
      savvy: 10
    };
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

  const [logs, setLogs] = useState<string[]>(["欢迎来到修仙世界，开始你的长生之路吧。"]);
  const [activeTab, setActiveTab] = useState<'cultivate' | 'adventure' | 'abode' | 'market' | 'tasks'>('cultivate');
  const [isPaused, setIsPaused] = useState(false);
  const [showReincarnationConfirm, setShowReincarnationConfirm] = useState(false);
  const [npcQuote, setNpcQuote] = useState(OLD_MAN_QUOTES[0]);
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [marketRefreshTime, setMarketRefreshTime] = useState(300); // 5 minutes in seconds
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);

  // --- Refs for game loop ---
  const lastSaveRef = useRef(Date.now());

  // --- Formulas ---
  const getExpRequirement = (index: number) => Math.floor(100 * Math.pow(1.12, index));
  const getIdleExp = () => (player.arrayLevel * 2 + 1) * (1 + player.elixirCount * 0.5) * ((player.savvy || 10) / 10);
  const getManualExp = () => (5 + Math.floor(player.stageIndex / 5)) * (1 + player.elixirCount * 0.5) * ((player.savvy || 10) / 10);
  const getBreakthroughChance = () => {
    if (player.stageIndex === 0) return 1; // 凡人必过
    const isMajor = player.stageIndex % 10 === 0;
    if (isMajor) return Math.max(0.1, 0.8 - (player.stageIndex / 100)); // 大境界突破较难
    return 0.95; // 小境界突破较易
  };

  // --- Actions ---
  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50));
  };

  const saveGame = useCallback((data: PlayerData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

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

    const chance = getBreakthroughChance();
    const currentMajorRealm = REALMS[Math.floor((player.stageIndex - 1) / 10) + 1] || "凡人";
    const isMajorBreakthrough = player.stageIndex % 10 === 0 && player.stageIndex !== 0;
    const msgSet = BREAKTHROUGH_MESSAGES[currentMajorRealm];

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
        saveGame(next);
        return next;
      });
      
      const successMsg = isMajorBreakthrough && msgSet ? msgSet.success : `恭喜！你成功突破到了 ${getRealmName(player.stageIndex + 1)}！`;
      addLog(successMsg);
      addLog("突破成功，气血已完全恢复，体质得到进一步强化！");
      setConsecutiveFails(0);
      updateNpcQuote();
    } else {
      setPlayer(prev => {
        const next = { ...prev, exp: Math.floor(prev.exp * 0.7) };
        saveGame(next);
        return next;
      });
      const failMsg = isMajorBreakthrough && msgSet ? msgSet.fail : "突破失败！灵力反噬，损失了三成修为...";
      addLog(failMsg);
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
    let expGain = 0;
    let savvyGain = 0;
    let hpMaxGain = 0;

    const majorRealmLevel = Math.floor(player.stageIndex / 10) + 1;

    if (event.type === 'stones') {
      stoneGain = Math.floor(Math.abs(event.base || 0) * majorRealmLevel * (0.5 + Math.random()));
      if (event.base && event.base < 0) stoneGain = -Math.min(player.stones, Math.abs(stoneGain));
      logMsg = logMsg.replace('{val}', Math.abs(stoneGain).toString());
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
      
      const playerDmg = Math.max(5, player.attack - monsterDef);
      const monsterDmg = Math.max(2, monsterAtk - player.defense);
      
      const roundsToKill = Math.ceil(monsterHp / playerDmg);
      const totalDamageTaken = roundsToKill * monsterDmg;

      if (totalDamageTaken < player.hp) {
        stoneGain = monsterLevel * 25;
        expGain = monsterLevel * 15;
        logMsg = `你祭出法宝与 [${monsterName}] (等级 ${monsterLevel}) 激战，经过 ${roundsToKill} 个回合将其击杀，获得灵石 x${stoneGain}，修为 x${expGain}。`;
        
        setPlayer(prev => ({ ...prev, hp: Math.max(1, prev.hp - totalDamageTaken) }));
      } else {
        stoneGain = -Math.min(player.stones, monsterLevel * 5);
        logMsg = `你与 [${monsterName}] 激战数十回合，终因实力不济负伤遁走，损失了灵石 x${Math.abs(stoneGain)}。`;
        setPlayer(prev => ({ ...prev, hp: Math.max(1, Math.floor(prev.hp * 0.1)) }));
      }
    }

    setPlayer(prev => {
      const req = getExpRequirement(prev.stageIndex);
      const currentSavvy = prev.savvy || 10;
      const currentMaxHp = prev.maxHp || 100;
      const currentHp = prev.hp || 100;
      
      const next = {
        ...prev,
        stones: Math.max(0, prev.stones + stoneGain),
        exp: Math.min(req, Math.max(0, prev.exp + expGain)),
        savvy: currentSavvy + (savvyGain || 0),
        maxHp: currentMaxHp + (hpMaxGain || 0),
        hp: Math.min(currentMaxHp + (hpMaxGain || 0), currentHp + (hpMaxGain || 0))
      };
      saveGame(next);
      return next;
    });
    addLog(logMsg);
  };

  const handleUpgradeArray = () => {
    const cost = Math.floor(50 * Math.pow(1.8, player.arrayLevel));
    if (player.stones < cost) {
      addLog("灵石不足，无法升级聚灵阵！");
      return;
    }
    setPlayer(prev => {
      const next = {
        ...prev,
        stones: prev.stones - cost,
        arrayLevel: prev.arrayLevel + 1
      };
      saveGame(next);
      return next;
    });
    addLog(`聚灵阵升级成功！当前等级：${player.arrayLevel + 1}`);
  };

  const handleBuyItem = (item: any, index: number) => {
    if (player.stones < item.cost) {
      addLog("灵石不足，无法购买！");
      return;
    }

    setPlayer(prev => {
      const next = { ...prev, stones: prev.stones - item.cost };
      if (item.effect.elixir) next.elixirCount += item.effect.elixir;
      if (item.effect.savvy) next.savvy += item.effect.savvy;
      if (item.effect.hp) {
        next.maxHp += item.effect.hp;
        next.hp += item.effect.hp;
      }
      if (item.effect.attack) next.attack += item.effect.attack;
      if (item.effect.defense) next.defense += item.effect.defense;
      
      saveGame(next);
      return next;
    });

    // Remove item from market after purchase
    const newMarket = [...marketItems];
    newMarket.splice(index, 1);
    setMarketItems(newMarket);
    addLog(`购买成功：获得了 ${item.name}！`);
  };

  const handleDoWork = (task: any, index: number) => {
    if (isPaused) return;
    
    // Reward scales with major realm
    const majorRealmLevel = Math.floor(player.stageIndex / 10) + 1;
    const reward = Math.floor(task.rewardBase * majorRealmLevel * (0.8 + Math.random() * 0.4));
    
    setPlayer(prev => {
      const next = { ...prev, stones: prev.stones + reward };
      saveGame(next);
      return next;
    });

    addLog(`完成任务 [${task.name}]：${task.desc} 获得灵石 x${reward}。`);
    
    // Refresh tasks after one is done
    refreshTasks();
  };

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
      selected.push(pool.pop()!);
    }
    setAvailableTasks(selected);
  }, []);

  // --- Effects ---
  useEffect(() => {
    refreshMarket();
    refreshTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return;
      setMarketRefreshTime(prev => {
        if (prev <= 1) {
          refreshMarket();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, refreshMarket]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return;
      const gain = getIdleExp();
      setPlayer(prev => {
        const req = getExpRequirement(prev.stageIndex);
        
        // Auto-heal: 1% of maxHp per second (0.1% per 100ms)
        const healAmount = prev.maxHp * 0.001;
        const newHp = Math.min(prev.maxHp, prev.hp + healAmount);

        if (prev.exp >= req) return { ...prev, hp: newHp };
        
        const next = { ...prev, exp: Math.min(req, prev.exp + gain / 10), hp: newHp }; // Update every 100ms for smoothness
        
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

    if (player.stones > 1000) {
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
    localStorage.removeItem(STORAGE_KEY);
    setPlayer({
      name: "无名修士",
      stageIndex: 0,
      exp: 0,
      stones: 0,
      arrayLevel: 0,
      elixirCount: 0,
      attack: 10,
      defense: 5,
      hp: 100,
      maxHp: 100,
      savvy: 10
    });
    setLogs(["你已兵解转生，前尘往事尽成云烟。新的轮回开始了。"]);
    addLog("你已兵解转生，前尘往事尽成云烟。新的轮回开始了。");
    setShowReincarnationConfirm(false);
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
              <div className="text-white/60 text-[10px]">名号：初入仙途</div>
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
                <div className="text-white/40">灵石</div>
                <div className="text-arcade-yellow">{Math.floor(player.stones)}</div>
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">修炼效率</div>
                <div className="text-arcade-blue">x{( (1 + player.elixirCount * 0.5) * (player.savvy / 10) ).toFixed(1)}</div>
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">攻击力</div>
                <div className="text-arcade-pink">{player.attack}</div>
              </div>
              <div className="bg-black/40 p-2 pixel-border border-white/5">
                <div className="text-white/40">防御力</div>
                <div className="text-arcade-blue">{player.defense}</div>
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
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex gap-2 items-start">
              <div className="w-8 h-8 bg-gray-700 pixel-border flex-shrink-0 flex items-center justify-center text-xs">👴</div>
              <div className="text-[9px] text-arcade-blue leading-relaxed">
                <span className="text-white/40 block mb-1">戒指里的老爷爷：</span>
                "{npcQuote}"
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Modules */}
        <div className="md:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Tabs */}
          <div className="flex gap-1">
            {(['cultivate', 'adventure', 'tasks', 'abode', 'market'] as const).map(tab => (
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
                  </div>
                  <button 
                    onClick={handleManualCultivate}
                    className="absolute inset-0 flex items-center justify-center text-white font-pixel hover:scale-110 transition-transform"
                  >
                    闭关修炼
                  </button>
                </div>
                
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  <button 
                    onClick={handleBreakthrough}
                    disabled={player.exp < expReq}
                    className={`w-full pixel-button ${player.exp < expReq ? 'opacity-50 grayscale cursor-not-allowed' : 'animate-bounce'}`}
                  >
                    突破境界 ({Math.floor(getBreakthroughChance() * 100)}% 成功率)
                  </button>
                  <p className="text-[9px] text-white/40 text-center">
                    突破失败将扣除 30% 当前修为，请谨慎行事。
                  </p>
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
                  <h3 className="text-arcade-green text-sm mb-2">聚灵阵 (Lv.{player.arrayLevel})</h3>
                  <p className="text-[10px] text-white/60 mb-4">
                    通过在洞府中布置聚灵阵，可以大幅提升天地灵气的汇聚速度，实现自动增长修为。
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-[10px]">
                      <div className="text-white/40">当前效果: +{getIdleExp().toFixed(1)} 修为/秒</div>
                      <div className="text-arcade-green">升级后: +{(((player.arrayLevel + 1) * 2 + 1) * (1 + player.elixirCount * 0.5)).toFixed(1)} 修为/秒</div>
                    </div>
                    <button onClick={handleUpgradeArray} className="pixel-button !py-2 !px-4 !text-[10px]">
                      升级 (需 {Math.floor(50 * Math.pow(1.8, player.arrayLevel))} 灵石)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="text-arcade-yellow text-xs border-b border-white/10 pb-2 flex justify-between">
                  <span>宗门任务榜</span>
                  <span className="text-[8px] text-white/40">完成任务可获得灵石奖励</span>
                </div>
                <div className="grid gap-3">
                  {availableTasks.map((task, i) => (
                    <div key={i} className="bg-black/40 p-3 pixel-border border-white/10 flex justify-between items-center group hover:border-arcade-yellow transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-[10px]">{task.name}</span>
                          <span className={`text-[8px] px-1 ${
                            task.difficulty === '简单' ? 'text-green-400' : 
                            task.difficulty === '普通' ? 'text-blue-400' : 'text-red-400'
                          }`}>[{task.difficulty}]</span>
                        </div>
                        <p className="text-[8px] text-white/40">{task.desc}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-arcade-yellow text-[10px]">灵石 x{Math.floor(task.rewardBase * (Math.floor(player.stageIndex / 10) + 1))}</div>
                        <button 
                          onClick={() => handleDoWork(task, i)}
                          className="pixel-button !py-1 !px-3 !text-[8px] !bg-arcade-yellow/20 hover:!bg-arcade-yellow/40"
                        >
                          接取
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] text-white/20 italic text-center">任务完成后会自动刷新榜单...</p>
              </div>
            )}

            {activeTab === 'market' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h3 className="text-arcade-pink text-sm">万宝阁</h3>
                  <span className="text-[8px] text-white/40">距离下次刷新: {Math.floor(marketRefreshTime / 60)}分{marketRefreshTime % 60}秒</span>
                </div>
                
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
                          <span className="text-arcade-yellow text-[10px]">{item.cost} 灵石</span>
                          <button 
                            onClick={() => handleBuyItem(item, i)}
                            className="pixel-button !py-1 !px-3 !text-[8px] !bg-arcade-pink/20 hover:!bg-arcade-pink/40"
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
