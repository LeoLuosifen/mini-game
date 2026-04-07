/**
 * Cultivation Game Static Data & Constants
 */

export const REALMS = [
  "凡人", "炼气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫", "大帝"
];

export const BREAKTHROUGH_MESSAGES: Record<string, { success: string; fail: string }> = {
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

export const CULTIVATION_PARTS = {
  actions: ["你运转功法", "你吞吐灵气", "你闭目冥想", "你感悟天地", "你引导紫气", "你洗涤经脉", "你凝练灵力"],
  sensations: ["周身穴位发热", "丹田隐隐作痛", "神识一片清明", "灵气如潮水涌动", "经脉微微震颤", "心境古井无波"],
  results: ["修为略有精进。", "灵力更显凝实。", "一丝感悟涌上心头。", "气息稳步攀升。", "根基愈发深厚。", "距离突破又近一步。"]
};

export interface Rumor {
  text: string;
  options: {
    text: string;
    action: string;
    reward?: {
      stonesLow?: number;
      stonesHigh?: number;
      stonesTop?: number;
      exp?: number;
      savvy?: number;
      item?: string;
    };
    risk?: {
      stonesLow?: number;
      stonesHigh?: number;
      stonesTop?: number;
      hp?: number;
    };
  }[];
}

export const WORLD_RUMORS: Rumor[] = [
  {
    text: "【传闻】据说极北之地有异宝出世，引得无数老怪前往。",
    options: [
      {
        text: "前往极北之地探索",
        action: "explore",
        reward: {
          stonesHigh: 50,
          exp: 200,
          item: "elixir_large"
        },
        risk: {
          hp: -30
        }
      }
    ]
  },
  {
    text: "【传闻】万宝阁今日举行大型拍卖会，压轴宝物竟是一枚九品丹药。",
    options: [
      {
        text: "前往万宝阁参加拍卖会",
        action: "auction",
        reward: {
          item: "immortal_pill"
        },
        risk: {
          stonesHigh: -1000
        }
      }
    ]
  },
  {
    text: "【传闻】某位隐世大能的洞府被发现，修仙界又要掀起一番腥风血雨了。",
    options: [
      {
        text: "前往洞府寻宝",
        action: "treasure",
        reward: {
          stonesTop: 10,
          exp: 500,
          savvy: 5
        },
        risk: {
          hp: -50,
          stonesHigh: -200
        }
      }
    ]
  },
  {
    text: "【传闻】听说东海之滨有龙吟声传出，不知是真是假。",
    options: [
      {
        text: "前往东海之滨一探究竟",
        action: "investigate",
        reward: {
          stonesHigh: 30,
          exp: 150,
          item: "hp_essence"
        },
        risk: {
          hp: -20
        }
      }
    ]
  },
  {
    text: "【传闻】最近坊市间的灵石汇率波动剧烈，不少散修叫苦连天。",
    options: [
      {
        text: "前往坊市兑换灵石",
        action: "exchange",
        reward: {
          stonesLow: 500
        },
        risk: {
          stonesHigh: -5
        }
      }
    ]
  },
  {
    text: "【传闻】天剑宗的天才弟子闭关百年，今日终于破关而出了。",
    options: [
      {
        text: "前往天剑宗一睹风采",
        action: "visit",
        reward: {
          exp: 100,
          savvy: 2
        },
        risk: {
          stonesLow: -100
        }
      }
    ]
  },
  {
    text: "【传闻】南疆瘴气林中出现了一头万年妖王，路过修士请务必小心。",
    options: [
      {
        text: "前往南疆挑战妖王",
        action: "challenge",
        reward: {
          stonesTop: 20,
          exp: 800,
          item: "atk_gem"
        },
        risk: {
          hp: -80,
          stonesHigh: -300
        }
      }
    ]
  },
  {
    text: "【传闻】西荒沙漠中出现了一座移动的沙城，据说里面藏有上古秘宝。",
    options: [
      {
        text: "前往西荒沙漠寻找沙城",
        action: "desert",
        reward: {
          stonesHigh: 80,
          exp: 300,
          item: "savvy_book"
        },
        risk: {
          hp: -40,
          stonesLow: -200
        }
      }
    ]
  },
  {
    text: "【传闻】北域冰原中发现了一株千年雪莲，具有起死回生之效。",
    options: [
      {
        text: "前往北域冰原寻找雪莲",
        action: "snow",
        reward: {
          stonesHigh: 60,
          exp: 250,
          item: "hp_pill"
        },
        risk: {
          hp: -35
        }
      }
    ]
  },
  {
    text: "【传闻】中洲城的拍卖行将拍卖一把仙器，引起了各方势力的关注。",
    options: [
      {
        text: "前往中洲城参加拍卖会",
        action: "auction2",
        reward: {
          item: "def_shield"
        },
        risk: {
          stonesTop: -5
        }
      }
    ]
  },
  {
    text: "【传闻】一位神秘的炼丹大师在附近开设了炼丹坊，据说能炼制各种珍贵丹药。",
    options: [
      {
        text: "前往炼丹坊购买丹药",
        action: "alchemy",
        reward: {
          item: "elixir_mid"
        },
        risk: {
          stonesLow: -300
        }
      }
    ]
  },
  {
    text: "【传闻】最近有一批海外修士来到中土，带来了许多稀有物品。",
    options: [
      {
        text: "与海外修士交易",
        action: "trade",
        reward: {
          stonesHigh: 40,
          item: "array_guide"
        },
        risk: {
          stonesLow: -500
        }
      }
    ]
  },
  {
    text: "【传闻】东极海域出现了一座漂浮的仙岛，岛上有仙人遗留的传承。",
    options: [
      {
        text: "前往东极海域寻找仙岛",
        action: "island",
        reward: {
          stonesTop: 15,
          exp: 600,
          savvy: 8
        },
        risk: {
          hp: -45,
          stonesHigh: -150
        }
      }
    ]
  },
  {
    text: "【传闻】西昆仑山脉发现了一处灵脉，灵气浓郁程度前所未有。",
    options: [
      {
        text: "前往西昆仑山脉修炼",
        action: "spiritvein",
        reward: {
          exp: 400,
          savvy: 3,
          item: "elixir_large"
        },
        risk: {
          hp: -25,
          stonesLow: -100
        }
      }
    ]
  },
  {
    text: "【传闻】南蛮之地的古巫族正在举行祭祀大典，据说会有宝物现世。",
    options: [
      {
        text: "混入古巫族祭祀大典",
        action: "sacrifice",
        reward: {
          stonesHigh: 70,
          item: "atk_stone"
        },
        risk: {
          hp: -60,
          stonesLow: -300
        }
      }
    ]
  },
  {
    text: "【传闻】北邙山出现了阴兵借道的异象，据说与一件上古神器有关。",
    options: [
      {
        text: "前往北邙山一探究竟",
        action: "ghost",
        reward: {
          stonesTop: 25,
          exp: 700,
          item: "def_charm"
        },
        risk: {
          hp: -70,
          stonesHigh: -250
        }
      }
    ]
  },
  {
    text: "【传闻】中域的太玄宗将举办千年一度的宗门大比，胜者可获得稀世珍宝。",
    options: [
      {
        text: "参加太玄宗宗门大比",
        action: "competition",
        reward: {
          stonesHigh: 100,
          exp: 500,
          item: "savvy_scroll"
        },
        risk: {
          hp: -30,
          stonesLow: -400
        }
      }
    ]
  },
  {
    text: "【传闻】海外仙岛的蓬莱阁将招收新弟子，要求资质过人。",
    options: [
      {
        text: "前往蓬莱阁参加选拔",
        action: "recruit",
        reward: {
          exp: 300,
          savvy: 5,
          item: "hp_pill"
        },
        risk: {
          stonesHigh: -100,
          stonesLow: -200
        }
      }
    ]
  },
  {
    text: "【传闻】不周山巅出现了五色神光，可能是天地灵物现世的征兆。",
    options: [
      {
        text: "前往不周山巅探寻",
        action: "light",
        reward: {
          stonesTop: 30,
          exp: 900,
          item: "immortal_pill"
        },
        risk: {
          hp: -90,
          stonesHigh: -350
        }
      }
    ]
  }
];

export const MONSTERS = [
  "疾风狼", "嗜血虎", "幻影蛛", "铁甲犀", "青鳞蟒", "烈焰狮", "冰原熊", "地底蝎", "金翅雕", "九头蛇", "撼天猿"
];

export const EVENTS = {
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

export const MARKET_POOL = [
  { id: 'elixir_small', name: "小还丹", desc: "提升少量修炼效率", costBase: 100, currencyType: 'low', effect: { elixir: 1 } },
  { id: 'elixir_mid', name: "大还丹", desc: "提升中量修炼效率", costBase: 500, currencyType: 'low', effect: { elixir: 3 } },
  { id: 'elixir_large', name: "九转金丹", desc: "大幅提升修炼效率", costBase: 2000, currencyType: 'high', effect: { elixir: 10 } },
  { id: 'savvy_scroll', name: "悟道残页", desc: "提升少量悟性", costBase: 300, currencyType: 'low', effect: { savvy: 2 } },
  { id: 'savvy_book', name: "天书残卷", desc: "提升中量悟性", costBase: 1200, currencyType: 'high', effect: { savvy: 8 } },
  { id: 'hp_pill', name: "补血丹", desc: "提升气血上限", costBase: 200, currencyType: 'low', effect: { hp: 50 } },
  { id: 'hp_essence', name: "龙血精元", desc: "大幅提升气血上限", costBase: 1500, currencyType: 'high', effect: { hp: 400 } },
  { id: 'atk_stone', name: "磨刀石", desc: "提升攻击力", costBase: 400, currencyType: 'low', effect: { attack: 10 } },
  { id: 'atk_gem', name: "庚金之精", desc: "大幅提升攻击力", costBase: 1800, currencyType: 'high', effect: { attack: 50 } },
  { id: 'def_charm', name: "护身符", desc: "提升防御力", costBase: 400, currencyType: 'low', effect: { defense: 5 } },
  { id: 'def_shield', name: "玄武甲片", desc: "大幅提升防御力", costBase: 1800, currencyType: 'high', effect: { defense: 25 } },
  { id: 'array_guide', name: "阵法心得", desc: "提升聚灵阵效率（额外加成）", costBase: 1000, currencyType: 'high', effect: { elixir: 5 } },
  { id: 'tribulation_pill', name: "渡劫丹", desc: "增加20%渡劫成功率", costBase: 3000, currencyType: 'high', effect: {} },
  { id: 'immortal_pill', name: "飞升丹", desc: "传说中的神丹，大幅提升各项属性并增加30%渡劫成功率", costBase: 500, currencyType: 'top', effect: { attack: 100, defense: 50, hp: 1000, savvy: 20 } },
  { id: 'jiedan_pill', name: "结丹丹", desc: "帮助突破到金丹期的瓶颈", costBase: 5000, currencyType: 'high', effect: { breakthrough: 'jiedan' } },
  { id: 'yingbian_pill', name: "婴变丹", desc: "帮助突破到元婴期的瓶颈", costBase: 10000, currencyType: 'high', effect: { breakthrough: 'yingbian' } },
  { id: 'huashen_pill', name: "化神丹", desc: "帮助突破到化神期的瓶颈", costBase: 20000, currencyType: 'top', effect: { breakthrough: 'huashen' } },
  { id: 'pozhang_pill', name: "破障丹", desc: "帮助突破灵根限制，提升境界上限", costBase: 30000, currencyType: 'top', effect: { breakthrough: 'pozhang' } }
];

export const WORK_TASKS = [
  { name: "打扫炼丹房", difficulty: "简单", rewardBase: 30, desc: "虽然辛苦，但偶尔能闻到丹香，令人神清气爽。" },
  { name: "看守药园", difficulty: "简单", rewardBase: 50, desc: "枯燥的差事，但胜在安全稳妥。" },
  { name: "灵田除草", difficulty: "简单", rewardBase: 40, desc: "小心那些会咬人的灵草，它们可不安分。" },
  { name: "挑水砍柴", difficulty: "简单", rewardBase: 25, desc: "基础的杂活，虽然累但能锻炼体魄。" },
  { name: "擦拭法器", difficulty: "简单", rewardBase: 35, desc: "需要细心呵护这些宝贵的法器。" },
  { name: "后山采药", difficulty: "普通", rewardBase: 150, desc: "需要避开一些低级妖兽，有一定风险。" },
  { name: "驱赶灵兽", difficulty: "普通", rewardBase: 200, desc: "那些调皮的灵鹤总是乱跑，真让人头疼。" },
  { name: "整理经阁", difficulty: "普通", rewardBase: 180, desc: "在书海中寻找遗失的卷轴，或许能增长见识。" },
  { name: "护送弟子", difficulty: "普通", rewardBase: 160, desc: "保护新入门的弟子前往指定地点。" },
  { name: "采集灵矿", difficulty: "普通", rewardBase: 170, desc: "深入矿洞采集珍贵的灵矿。" },
  { name: "押送货运", difficulty: "困难", rewardBase: 600, desc: "路途遥远，且常有劫匪出没，非强者不可为。" },
  { name: "镇压魔窟", difficulty: "困难", rewardBase: 1000, desc: "九死一生的任务，但奖励极其丰厚。" },
  { name: "猎杀悬赏", difficulty: "困难", rewardBase: 800, desc: "目标是为祸一方的凶兽，需要极强的战斗力。" },
  { name: "探索秘境", difficulty: "困难", rewardBase: 900, desc: "进入危险的秘境寻找宝藏。" },
  { name: "挑战擂台", difficulty: "困难", rewardBase: 700, desc: "在宗门擂台上挑战其他弟子。" }
];

export const OLD_MAN_QUOTES = [
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

export const CONDITIONAL_QUOTES = {
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

export interface SpiritRoot {
  id: string;
  name: string;
  quality: number; // 1-7
  prob: number; // 0-1
  expBonus: number; // multiplier
  desc: string;
}

export const SPIRIT_ROOTS: SpiritRoot[] = [
  { id: 'waste', name: "废灵根", quality: 1, prob: 0.65, expBonus: 0.5, desc: "五行俱全，杂乱无章，修炼如龟速。" },
  { id: 'pseudo', name: "伪灵根", quality: 2, prob: 0.22, expBonus: 0.8, desc: "四属性或三属性分布不均，资质平平。" },
  { id: 'true', name: "真灵根", quality: 3, prob: 0.08, expBonus: 1.2, desc: "双属性或某属性突出，修炼速度可观。" },
  { id: 'earth', name: "地灵根", quality: 4, prob: 0.03, expBonus: 1.8, desc: "属性相辅相成，元婴有望，化神可期。" },
  { id: 'heaven', name: "天灵根", quality: 5, prob: 0.01, expBonus: 3.0, desc: "单一纯属性，天之骄子，修炼无瓶颈。" },
  { id: 'mutated', name: "变异灵根", quality: 6, prob: 0.008, expBonus: 2.5, desc: "雷、冰、风等变异属性，威力强横。" },
  { id: 'special', name: "特殊体质", quality: 7, prob: 0.002, expBonus: 5.0, desc: "先天道体或圣体，无视规则，上限极高。" }
];

export interface Sect {
  id: string;
  name: string;
  rank: string;
  minQuality: number;
  expBonus: number;
  atkBonus: number;
  defBonus: number;
  desc: string;
}

export const SECTS: Sect[] = [
  { id: 'tianxuan', name: "天璇剑宗", rank: "顶级宗门", minQuality: 3, expBonus: 1.5, atkBonus: 20, defBonus: 0, desc: "正道魁首，以剑修为主，攻击力冠绝天下。" },
  { id: 'youming', name: "幽冥鬼府", rank: "顶级宗门", minQuality: 1, expBonus: 1.4, atkBonus: 10, defBonus: 10, desc: "魔道霸主，修魂炼尸，弱肉强食。" },
  { id: 'wanbao', name: "万宝商会", rank: "中等偏上", minQuality: 2, expBonus: 1.2, atkBonus: 0, defBonus: 5, desc: "中立富商，富可敌国，资源丰富。" },
  { id: 'guixu', name: "归墟海阁", rank: "隐世圣地", minQuality: 4, expBonus: 2.0, atkBonus: 15, defBonus: 15, desc: "海外孤岛，与世无争，实力深不可测。" },
  { id: 'blood', name: "血灵宗", rank: "中等魔道", minQuality: 1, expBonus: 1.8, atkBonus: 25, defBonus: -10, desc: "邪道疯子，汲取精血，进境极快但易疯狂。" },
  { id: 'qingyu', name: "青羽门", rank: "小门派", minQuality: 1, expBonus: 1.1, atkBonus: 5, defBonus: 5, desc: "没落贵族，祖上阔过，适合新手起步。" }
];

export interface PlayerData {
  name: string;
  stageIndex: number;
  exp: number;
  stonesLow: number;
  stonesHigh: number;
  stonesTop: number;
  arrayLevel: number;
  elixirCount: number;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  savvy: number;
  inventory: Record<string, number>;
  spiritRootId?: string;
  sectId?: string;
  isDead?: boolean;
  rootBreakthroughLevel?: number; // 灵根突破等级，每突破一次增加1
  specialRoot?: string; // 特殊灵根或体质
  hasBreakthroughPill?: boolean; // 是否服用过突破丹药
}

export const TITLES = {
  // 凡人阶段
  0: "初入仙途",
  // 炼气期
  1: "炼气弟子",
  4: "炼气中期",
  7: "炼气后期",
  10: "炼气巅峰",
  // 筑基期
  11: "筑基修士",
  14: "筑基中期",
  17: "筑基后期",
  20: "筑基巅峰",
  // 金丹期
  21: "金丹真人",
  24: "金丹中期",
  27: "金丹后期",
  30: "金丹巅峰",
  // 元婴期
  31: "元婴真君",
  34: "元婴中期",
  37: "元婴后期",
  40: "元婴巅峰",
  // 化神期
  41: "化神尊者",
  44: "化神中期",
  47: "化神后期",
  50: "化神巅峰",
  // 炼虚期
  51: "炼虚仙人",
  54: "炼虚中期",
  57: "炼虚后期",
  60: "炼虚巅峰",
  // 合体期
  61: "合体大能",
  64: "合体中期",
  67: "合体后期",
  70: "合体巅峰",
  // 大乘期
  71: "大乘圣君",
  74: "大乘中期",
  77: "大乘后期",
  80: "大乘巅峰",
  // 渡劫期
  81: "渡劫准帝",
  84: "渡劫中期",
  87: "渡劫后期",
  90: "渡劫巅峰",
  // 大帝期
  91: "万古大帝",
  95: "混沌主宰",
  99: "道祖" 
};

export const STORAGE_KEY = 'pixel_joy_cultivation_save';
