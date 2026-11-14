/* ==========================================================================
   铜方块数据层
   - 参考 Minecraft Java 版 1.21.9「铜器时代」的方块种类、官方中文译名与方块状态
   - 所有状态组合按需求顺序生成，不使用随机排序
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     氧化阶段与配色
     ------------------------------------------------------------------------ */

  const OXIDATION = [
    {
      key: "",
      mc: "",
      label: "未氧化",
      adj: "",
      en: "",
      theme: {
        ox: "#d87f33",
        hi: "#f0b36e",
        deep: "#8a4b20",
        soft: "rgba(216, 127, 51, 0.12)",
        glow: "rgba(216, 127, 51, 0.32)",
        rgb: "216, 127, 51",
      },
    },
    {
      key: "exposed_",
      mc: "exposed",
      label: "斑驳",
      adj: "斑驳",
      en: "Exposed ",
      theme: {
        ox: "#a38676",
        hi: "#d7b39b",
        deep: "#5d473f",
        soft: "rgba(163, 134, 118, 0.12)",
        glow: "rgba(163, 134, 118, 0.31)",
        rgb: "163, 134, 118",
      },
    },
    {
      key: "weathered_",
      mc: "weathered",
      label: "锈蚀",
      adj: "锈蚀",
      en: "Weathered ",
      theme: {
        ox: "#4fa59f",
        hi: "#8adbd0",
        deep: "#246462",
        soft: "rgba(79, 165, 159, 0.12)",
        glow: "rgba(79, 165, 159, 0.31)",
        rgb: "79, 165, 159",
      },
    },
    {
      key: "oxidized_",
      mc: "oxidized",
      label: "氧化",
      adj: "氧化",
      en: "Oxidized ",
      theme: {
        ox: "#1d8d94",
        hi: "#63d8d1",
        deep: "#0b5962",
        soft: "rgba(29, 141, 148, 0.13)",
        glow: "rgba(29, 141, 148, 0.34)",
        rgb: "29, 141, 148",
      },
    },
  ];

  const SPECIAL_THEME = {
    ox: "#6fce8f",
    hi: "#b8ffd1",
    deep: "#2d7452",
    soft: "rgba(111, 206, 143, 0.13)",
    glow: "rgba(111, 206, 143, 0.3)",
    rgb: "111, 206, 143",
  };

  const PALETTES = [
    {
      aged: false,
      top: "#e8a45f",
      right: "#c77a3f",
      left: "#8f4f26",
      edge: "#5b3218",
      hi: "#ffd39a",
      speck: "#f0bf83",
      patina: "#5d9d86",
      glow: "#ffb35c",
      glowSoft: "#ffe0ad",
    },
    {
      aged: true,
      top: "#b79a88",
      right: "#8c6f64",
      left: "#5d4a42",
      edge: "#3d302b",
      hi: "#ddbda8",
      speck: "#cbaa98",
      patina: "#6e9e8f",
      glow: "#d9a27c",
      glowSoft: "#f0d4bb",
    },
    {
      aged: true,
      top: "#67bdb4",
      right: "#3a908c",
      left: "#236966",
      edge: "#163f3e",
      hi: "#b0e3da",
      speck: "#8ccfc4",
      patina: "#7dd8c6",
      glow: "#58d7c9",
      glowSoft: "#c6fff7",
    },
    {
      aged: true,
      top: "#38a6a4",
      right: "#167f87",
      left: "#0c5e67",
      edge: "#073e46",
      hi: "#93dcd3",
      speck: "#53c0b7",
      patina: "#3bb8a9",
      glow: "#62e5d6",
      glowSoft: "#c5fffa",
    },
  ];

  const SPECIAL_PALETTE = {
    aged: false,
    top: "#9fe3b0",
    right: "#54af7d",
    left: "#2f7454",
    edge: "#1d4b37",
    hi: "#d5ffdf",
    speck: "#b7f5c4",
    patina: "#62d08c",
    glow: "#96ffb0",
    glowSoft: "#e1ffea",
  };

  const CATEGORIES = {
    core: { label: "基础方块", order: 0 },
    build: { label: "建筑与装饰", order: 1 },
    light: { label: "照明", order: 2 },
    redstone: { label: "红石与功能", order: 3 },
    story: { label: "容器与傀儡", order: 4 },
    extra: { label: "彩蛋", order: 5 },
  };

  /* ------------------------------------------------------------------------
     状态值
     ------------------------------------------------------------------------ */

  const V = (id, label, extra) => Object.assign({ id, label, speak: label }, extra || {});

  const FACING4 = [
    V("north", "朝北", { default: true, rotation: 0 }),
    V("east", "朝东", { rotation: 90 }),
    V("south", "朝南", { rotation: 180 }),
    V("west", "朝西", { rotation: 270 }),
  ];

  const FACING6 = [
    V("up", "朝上", { default: true, rotation: 0, vertical: "up" }),
    V("down", "朝下", { rotation: 180, vertical: "down" }),
    V("north", "朝北", { rotation: 0 }),
    V("south", "朝南", { rotation: 180 }),
    V("east", "朝东", { rotation: 90 }),
    V("west", "朝西", { rotation: 270 }),
  ];

  const STAIR_HALF = [
    V("bottom", "正置", { default: true }),
    V("top", "倒置"),
  ];

  const STAIR_SHAPE = [
    V("outer_left", "向左外角"),
    V("outer_right", "向右外角"),
    V("inner_left", "向左内角"),
    V("inner_right", "向右内角"),
    V("straight", "直形", { default: true }),
  ];

  const SLAB_TYPE = [
    V("bottom", "下半", { default: true }),
    V("top", "上半"),
    V("double", "双层"),
  ];

  const DOOR_HALF = [
    V("lower", "下半", { default: true }),
    V("upper", "上半"),
  ];

  const TRAPDOOR_HALF = [
    V("bottom", "下装", { default: true }),
    V("top", "上装"),
  ];

  const HINGE = [
    V("left", "左铰链", { default: true }),
    V("right", "右铰链"),
  ];

  const OPEN = [
    V("false", "关闭", { default: true }),
    V("true", "打开"),
  ];

  const POWERED = [
    V("false", "未激活", { default: true }),
    V("true", "已激活"),
  ];

  const LIT = [
    V("false", "熄灭", { default: true }),
    V("true", "点亮"),
  ];

  const HANGING = [
    V("false", "放置", { default: true }),
    V("true", "悬挂"),
  ];

  const AXIS = [
    V("y", "竖直", { default: true }),
    V("x", "东西向"),
    V("z", "南北向"),
  ];

  const CHEST_TYPE = [
    V("single", "单箱", { default: true }),
    V("left", "左半"),
    V("right", "右半"),
  ];

  const POSE = [
    V("standing", "站立", { default: true }),
    V("sitting", "坐下"),
    V("running", "奔跑"),
    V("star", "大字"),
  ];

  function makeConnectionValues() {
    const dirs = [
      { key: "east", label: "东", flag: 1 },
      { key: "north", label: "北", flag: 2 },
      { key: "south", label: "南", flag: 4 },
      { key: "west", label: "西", flag: 8 },
    ];
    const list = [];
    for (let mask = 0; mask < 16; mask += 1) {
      const connections = {};
      dirs.forEach((d) => {
        connections[d.key] = (mask & d.flag) !== 0;
      });
      const active = dirs.filter((d) => connections[d.key]).map((d) => d.label);
      list.push(
        V(String(mask), active.length ? `连接${active.join("、")}` : "无连接", {
          connections,
          default: mask === 0,
        })
      );
    }
    return list;
  }

  const CONNECTIONS = makeConnectionValues();

  /* ------------------------------------------------------------------------
     方块种类
     ------------------------------------------------------------------------ */

  const BLOCK_TYPES = [
    {
      id: "copper_block",
      baseName: "铜块",
      en: "Block of Copper",
      enStages: ["Block of Copper", "Exposed Copper", "Weathered Copper", "Oxidized Copper"],
      aliases: ["block of copper", "铜方块", "氧化铜块"],
      icon: "cube",
      category: "core",
      order: 1,
      glyph: "#d8874a",
      desc: "铜系列的基础方块，会随时间氧化。",
      states: [],
    },
    {
      id: "cut_copper",
      baseName: "切制铜块",
      en: "Cut Copper",
      aliases: ["cut copper", "切制铜", "切制铜方块"],
      icon: "cut",
      category: "core",
      order: 2,
      glyph: "#cf8148",
      desc: "由铜块切制而成的建筑方块。",
      states: [],
    },
    {
      id: "chiseled_copper",
      baseName: "雕纹铜块",
      en: "Chiseled Copper",
      aliases: ["chiseled copper", "雕纹铜", "雕花铜块"],
      icon: "chiseled",
      category: "core",
      order: 3,
      glyph: "#c88a55",
      desc: "带雕纹图案的铜质建筑方块。",
      states: [],
    },
    {
      id: "cut_copper_slab",
      baseName: "切制铜台阶",
      en: "Cut Copper Slab",
      aliases: ["cut copper slab", "铜台阶", "半砖"],
      icon: "slab",
      category: "build",
      order: 4,
      glyph: "#d39655",
      desc: "切制铜制成的台阶，可含水。",
      states: [{ key: "type", label: "台阶", values: SLAB_TYPE }],
      waterloggable: true,
    },
    {
      id: "cut_copper_stairs",
      baseName: "切制铜楼梯",
      en: "Cut Copper Stairs",
      aliases: ["cut copper stairs", "铜楼梯", "楼梯"],
      icon: "stairs",
      category: "build",
      order: 5,
      glyph: "#cf8b4c",
      desc: "可含水、可朝向四个方向的切制铜楼梯。",
      states: [
        { key: "half", label: "摆放", values: STAIR_HALF },
        { key: "shape", label: "形状", values: STAIR_SHAPE },
        { key: "facing", label: "朝向", values: FACING4 },
      ],
      waterloggable: true,
    },
    {
      id: "copper_grate",
      baseName: "铜格栅",
      en: "Copper Grate",
      aliases: ["copper grate", "铜格栅方块", "格栅"],
      icon: "grate",
      category: "build",
      order: 6,
      glyph: "#b98250",
      desc: "带孔洞的铜质装饰方块，可含水。",
      states: [],
      waterloggable: true,
    },
    {
      id: "copper_bars",
      baseName: "铜栏杆",
      en: "Copper Bars",
      aliases: ["copper bars", "铜栅栏", "栏杆", "铜栏杆方块"],
      icon: "bars",
      category: "build",
      order: 7,
      glyph: "#d09358",
      desc: "类似铁栏杆的铜质装饰方块，玩家也常称“铜栅栏”。",
      states: [{ key: "connections", label: "连接", values: CONNECTIONS }],
      waterloggable: true,
    },
    {
      id: "copper_chain",
      baseName: "铜链",
      en: "Copper Chain",
      aliases: ["copper chain", "铜链条", "链条"],
      icon: "chain",
      category: "build",
      order: 8,
      glyph: "#c49a68",
      desc: "可沿三个轴放置的铜质链条，可含水。",
      states: [{ key: "axis", label: "轴向", values: AXIS }],
      waterloggable: true,
    },
    {
      id: "copper_lantern",
      baseName: "铜灯笼",
      en: "Copper Lantern",
      aliases: ["copper lantern", "铜灯灯笼", "绿灯"],
      icon: "lantern",
      category: "light",
      order: 9,
      glyph: "#ddb25e",
      desc: "发出绿色火焰、亮度为 15 的铜质灯笼。",
      states: [{ key: "hanging", label: "悬挂", values: HANGING }],
      waterloggable: true,
    },
    {
      id: "copper_bulb",
      baseName: "铜灯",
      en: "Copper Bulb",
      aliases: ["copper bulb", "铜灯泡", "灯泡"],
      icon: "bulb",
      category: "light",
      order: 10,
      glyph: "#e4a84f",
      desc: "由红石脉冲切换亮灭；氧化程度会影响亮度。",
      states: [
        { key: "lit", label: "亮灭", values: LIT },
        { key: "powered", label: "红石", values: POWERED },
      ],
    },
    {
      id: "copper_door",
      baseName: "铜门",
      en: "Copper Door",
      aliases: ["copper door", "铜制门"],
      icon: "door",
      category: "redstone",
      order: 11,
      glyph: "#c87850",
      desc: "可用手或红石开启的铜质双格门。",
      states: [
        { key: "half", label: "门格", values: DOOR_HALF },
        { key: "hinge", label: "铰链", values: HINGE },
        { key: "facing", label: "朝向", values: FACING4 },
        { key: "open", label: "开合", values: OPEN },
        { key: "powered", label: "红石", values: POWERED },
      ],
    },
    {
      id: "copper_trapdoor",
      baseName: "铜活板门",
      en: "Copper Trapdoor",
      aliases: ["copper trapdoor", "铜活板", "活板门"],
      icon: "trapdoor",
      category: "redstone",
      order: 12,
      glyph: "#c28b60",
      desc: "可上装或下装、可用红石激活的铜活板门，可含水。",
      states: [
        { key: "half", label: "安装", values: TRAPDOOR_HALF },
        { key: "facing", label: "朝向", values: FACING4 },
        { key: "open", label: "开合", values: OPEN },
        { key: "powered", label: "红石", values: POWERED },
      ],
      waterloggable: true,
    },
    {
      id: "copper_chest",
      baseName: "铜箱子",
      en: "Copper Chest",
      aliases: ["copper chest", "铜箱", "铜容器"],
      icon: "chest",
      category: "story",
      order: 13,
      glyph: "#b9895d",
      desc: "铜傀儡会从中取物的容器方块，可氧化和涂蜡。",
      states: [
        { key: "type", label: "箱体", values: CHEST_TYPE },
        { key: "facing", label: "朝向", values: FACING4 },
      ],
      waterloggable: true,
    },
    {
      id: "copper_golem_statue",
      baseName: "铜傀儡像",
      en: "Copper Golem Statue",
      aliases: ["copper golem statue", "铜傀儡", "铜傀儡雕像", "傀儡像"],
      icon: "statue",
      category: "story",
      order: 14,
      glyph: "#b69d7b",
      desc: "铜傀儡完全氧化后形成的方块，有四种姿势。",
      states: [
        { key: "pose", label: "姿势", values: POSE },
        { key: "facing", label: "朝向", values: FACING4 },
      ],
      waterloggable: true,
    },
    {
      id: "lightning_rod",
      baseName: "避雷针",
      en: "Lightning Rod",
      aliases: ["lightning rod", "铜避雷针", "避雷针方块"],
      icon: "rod",
      category: "redstone",
      order: 15,
      glyph: "#b69468",
      desc: "1.21.9 起可氧化、可涂蜡的铜质避雷针。",
      states: [
        { key: "facing", label: "朝向", values: FACING6 },
        { key: "powered", label: "红石", values: POWERED },
      ],
      waterloggable: true,
    },
    {
      id: "copper_torch",
      baseName: "铜火把",
      en: "Copper Torch",
      aliases: ["copper torch", "铜火把方块", "绿色火把"],
      icon: "torch",
      category: "extra",
      order: 16,
      glyph: "#76c696",
      desc: "铜器时代加入的绿色火焰火把；不氧化，也不可涂蜡。",
      special: true,
      noOxidation: true,
      states: [],
    },
  ];

  /* ------------------------------------------------------------------------
     命名与生成
     ------------------------------------------------------------------------ */

  /**
   * 把状态串联成自然短语，放在方块名前面。
   * 例：含水的涂蜡的倒置的向右外角的朝北的斑驳的铜楼梯
   */
  function buildPhrase(baseName, oxidation, waxed, waterlogged, stateLabels) {
    const parts = [];
    if (waterlogged) parts.push("含水");
    if (waxed) parts.push("涂蜡");
    (stateLabels || []).forEach((label) => {
      if (label) parts.push(label);
    });
    if (oxidation > 0) parts.push(OXIDATION[oxidation].adj);
    return parts.length ? `${parts.join("的")}的${baseName}` : baseName;
  }

  function buildEn(type, oxidation, waxed) {
    let base = type.en;
    if (type.enStages) {
      base = type.enStages[oxidation] || type.en;
      return `${waxed ? "Waxed " : ""}${base}`;
    }
    return `${waxed ? "Waxed " : ""}${OXIDATION[oxidation].en}${base}`;
  }

  function nameToMcBase(type, oxidation) {
    const stems = ["copper_block", "exposed_copper", "weathered_copper", "oxidized_copper"];
    if (type.id === "copper_block") return stems[oxidation];
    return `${OXIDATION[oxidation].key}${type.id}`;
  }

  function stateChipKind(key) {
    if (key === "facing" || key === "axis" || key === "connections" || key === "half" || key === "type" || key === "pose") {
      return "facing";
    }
    if (key === "open" || key === "powered" || key === "lit") return "power";
    return "";
  }

  function cartesian(states) {
    let result = [{}];
    for (const state of states) {
      const next = [];
      for (const base of result) {
        for (const value of state.values) {
          next.push(Object.assign({}, base, { [state.key]: value }));
        }
      }
      result = next;
    }
    return result;
  }

  function defaultCombo(type) {
    const result = {};
    for (const state of type.states) {
      result[state.key] = state.values.find((value) => value.default) || state.values[0];
    }
    return result;
  }

  function makeItem(type, options) {
    const { oxidation, waxed, waterlogged, combo } = options;
    const enFull = buildEn(type, oxidation, waxed);
    const mcBase = nameToMcBase(type, oxidation);
    const idParts = [];
    const chips = [];
    const spoken = [];
    const stateLabels = [];
    const comboKeyParts = [];

    for (const state of type.states) {
      const value = combo[state.key];
      if (!value) continue;

      if (state.key === "connections" && value.connections) {
        ["east", "north", "south", "west"].forEach((dir) => {
          idParts.push(`${dir}=${value.connections[dir] ? "true" : "false"}`);
        });
      } else {
        idParts.push(`${state.key}=${value.id}`);
      }

      chips.push({
        label: value.label,
        kind: stateChipKind(state.key),
        key: state.key,
      });
      if (value.speak) spoken.push(value.speak);
      stateLabels.push(value.label);
      comboKeyParts.push(`${state.key}:${value.id}`);
    }

    if (waterlogged) {
      idParts.push("waterlogged=true");
      chips.push({ label: "含水", kind: "water", key: "waterlogged" });
      spoken.push("含水");
    } else if (type.waterloggable) {
      idParts.push("waterlogged=false");
    }

    if (!chips.length) {
      chips.push({ label: "无额外方块状态", kind: "none", key: "none" });
    }

    const stateId = idParts.length ? `[${idParts.join(",")}]` : "";
    const mcId = `minecraft:${waxed ? "waxed_" : ""}${mcBase}${stateId}`;
    const uid = [
      type.id,
      waxed ? "w" : "u",
      type.waterloggable ? (waterlogged ? "water" : "dry") : "nowater",
      oxidation,
      comboKeyParts.join("|"),
    ].join(":");
    const stateText = chips.map((chip) => chip.label).join(" ");
    const category = CATEGORIES[type.category] || { label: type.category };
    const displayName = buildPhrase(type.baseName, oxidation, waxed, waterlogged, stateLabels);

    return {
      uid,
      typeId: type.id,
      typeKey: type.id,
      typeName: type.baseName,
      baseName: type.baseName,
      typeEn: type.en,
      typeDesc: type.desc,
      category: type.category,
      categoryLabel: category.label,
      icon: type.icon,
      aliases: type.aliases || [],
      oxidation,
      waxed,
      waterlogged: Boolean(waterlogged),
      special: false,
      isCustom: false,
      name: displayName,
      en: enFull,
      mcId,
      stateValues: combo,
      stateChips: chips,
      spokenStates: spoken,
      speech: displayName,
      searchText: [
        displayName,
        enFull,
        type.baseName,
        type.en,
        mcId,
        stateText,
        ...(type.aliases || []),
      ]
        .join(" ")
        .toLowerCase(),
      theme: OXIDATION[oxidation].theme,
      palette: PALETTES[oxidation],
    };
  }

  function makeSpecialItem(type) {
    const chips = [
      { label: "不氧化", kind: "none", key: "special" },
      { label: "不可涂蜡", kind: "none", key: "special" },
    ];
    return {
      uid: `special:${type.id}`,
      typeId: type.id,
      typeKey: type.id,
      typeName: type.baseName,
      typeEn: type.en,
      typeDesc: type.desc,
      category: type.category,
      categoryLabel: (CATEGORIES[type.category] || {}).label || "彩蛋",
      icon: type.icon,
      aliases: type.aliases || [],
      oxidation: null,
      waxed: false,
      waterlogged: false,
      special: true,
      isCustom: false,
      name: type.baseName,
      en: type.en,
      mcId: `minecraft:${type.id}`,
      stateValues: {},
      stateChips: chips,
      spokenStates: ["不氧化", "不可涂蜡"],
      speech: `${type.baseName}。不氧化，不可涂蜡`,
      searchText: [type.baseName, type.en, ...(type.aliases || []), "不氧化 不可涂蜡"].join(" ").toLowerCase(),
      theme: SPECIAL_THEME,
      palette: SPECIAL_PALETTE,
    };
  }

  function countType(type, mode) {
    if (type.special) return 1;
    if (mode === "simple") return 8;
    const stateCombos = type.states.reduce((total, state) => total * state.values.length, 1);
    const waterCombos = type.waterloggable ? 2 : 1;
    return 8 * stateCombos * waterCombos;
  }

  function generateTypeItems(type, mode) {
    if (type.special) {
      return [makeSpecialItem(type)];
    }

    const items = [];
    const waters = mode === "full" && type.waterloggable ? [false, true] : [false];
    const combos = mode === "full" ? cartesian(type.states) : [defaultCombo(type)];

    for (const waxed of [false, true]) {
      for (const waterlogged of waters) {
        for (let oxidation = 0; oxidation < OXIDATION.length; oxidation += 1) {
          for (const combo of combos) {
            items.push(makeItem(type, { oxidation, waxed, waterlogged, combo }));
          }
        }
      }
    }
    return items;
  }

  function buildAllItems(selectedIds, customEntries, mode) {
    const selected = new Set(selectedIds);
    const items = [];

    for (const type of BLOCK_TYPES) {
      if (!selected.has(type.id)) continue;
      items.push(...generateTypeItems(type, mode));
    }

    for (const entry of customEntries || []) {
      items.push(makeCustomItem(entry));
    }

    const totals = new Map();
    items.forEach((item) => {
      totals.set(item.typeKey, (totals.get(item.typeKey) || 0) + 1);
    });
    const seen = new Map();
    let customOrdinal = 0;
    const customTotal = items.filter((item) => item.isCustom).length;
    items.forEach((item, index) => {
      const ordinal = (seen.get(item.typeKey) || 0) + 1;
      seen.set(item.typeKey, ordinal);
      item.typeOrdinal = ordinal;
      item.typeTotal = totals.get(item.typeKey) || 1;
      item.index = index;
      if (item.isCustom) {
        customOrdinal += 1;
        item.customOrdinal = customOrdinal;
        item.customTotal = customTotal;
      }
    });

    return items;
  }

  /* ------------------------------------------------------------------------
     自定义方块
     ------------------------------------------------------------------------ */

  function asciiSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_\-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 36);
  }

  function customChipKind(label) {
    if (/含水|水/.test(label)) return "water";
    if (/朝|向|面|角|连接/.test(label)) return "facing";
    if (/激活|点亮|打开|通电|燃烧|发光/.test(label)) return "power";
    return "custom";
  }

  function normalizeStateWord(label) {
    return String(label || "").trim().replace(/的$/, "");
  }

  function makeCustomItem(entry) {
    const oxidation = Math.max(0, Math.min(3, Number(entry.oxidation) || 0));
    const waxed = Boolean(entry.waxed);
    const baseName = String(entry.baseName || "自定义铜方块").trim() || "自定义铜方块";
    const extraStates = (entry.extraStates || []).filter(Boolean);
    const chips = extraStates.map((state) => ({
      label: state,
      kind: customChipKind(state),
      key: "custom",
    }));
    if (!chips.length) {
      chips.push({ label: "自定义条目", kind: "custom", key: "custom" });
    }
    const stateValues = {};
    const facingLabel = extraStates.find((state) => /^朝[北东南西上下]的?$/.test(normalizeStateWord(state)));
    const facingWord = facingLabel ? normalizeStateWord(facingLabel) : "";
    if (facingWord) {
      const facingId = { 北: "north", 东: "east", 南: "south", 西: "west", 上: "up", 下: "down" }[
        facingWord.slice(1)
      ];
      const rotation = { north: 0, east: 90, south: 180, west: 270, up: 0, down: 180 }[facingId] || 0;
      stateValues.facing = { id: facingId, label: facingWord, rotation };
    }
    const waterlogged = extraStates.some((state) => /含水/.test(state));
    const extraPhraseLabels = extraStates
      .map(normalizeStateWord)
      .filter((state) => state && !/含水/.test(state) && state !== facingWord && state !== "涂蜡");
    const phraseLabels = [];
    if (facingWord) phraseLabels.push(facingWord);
    phraseLabels.push(...extraPhraseLabels);
    const displayName = buildPhrase(baseName, oxidation, waxed, waterlogged, phraseLabels);
    const en = String(entry.en || "").trim();
    let mcId;
    if (en) {
      mcId = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/i.test(en)
        ? en
        : `custom:${asciiSlug(en) || "entry"}`;
    } else {
      mcId = `custom:entry_${String(entry.id || "").replace(/[^a-z0-9]/gi, "").slice(0, 8) || "custom"}`;
    }
    const theme = OXIDATION[oxidation].theme;

    return {
      uid: `custom:${entry.id}`,
      customId: entry.id,
      typeId: "custom",
      typeKey: `custom:${entry.id}`,
      typeName: baseName,
      baseName,
      typeEn: entry.en || "Custom Entry",
      typeDesc: "自定义条目",
      category: "custom",
      categoryLabel: "自定义",
      icon: entry.icon || "custom",
      aliases: ["自定义", baseName, en],
      oxidation,
      waxed,
      waterlogged,
      special: false,
      isCustom: true,
      name: displayName,
      en: en || "Custom Entry",
      mcId,
      stateValues,
      stateChips: chips,
      spokenStates: extraStates.slice(),
      speech: displayName,
      searchText: [displayName, en, baseName, ...extraStates, "自定义"].join(" ").toLowerCase(),
      theme,
      palette: PALETTES[oxidation],
      typeOrdinal: 1,
      typeTotal: 1,
    };
  }

  window.CopperData = {
    OXIDATION,
    SPECIAL_THEME,
    PALETTES,
    SPECIAL_PALETTE,
    CATEGORIES,
    BLOCK_TYPES,
    countType,
    buildAllItems,
    makeCustomItem,
    getTypeById(id) {
      return BLOCK_TYPES.find((type) => type.id === id) || null;
    },
  };
})();
