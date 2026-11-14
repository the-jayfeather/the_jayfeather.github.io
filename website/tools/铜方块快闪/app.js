/* ==========================================================================
   铜方块快闪 · 交互层
   ========================================================================== */
(function () {
  "use strict";

  const D = window.CopperData;
  const A = window.CopperArt;
  const STORAGE_KEY = "copperBlockFlash.v1";
  const speechSupported =
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined";
  const synth = speechSupported ? window.speechSynthesis : null;

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const formatNumber = (value) => Number(value).toLocaleString("zh-CN");

  const els = {
    stage: $("#stage"),
    blockArt: $("#blockArt"),
    categoryBadge: $("#categoryBadge"),
    seqNo: $("#seqNo"),
    modeHint: $("#modeHint"),
    speakingPill: $("#speakingPill"),
    facingBadge: $("#facingBadge"),
    facingText: $("#facingText"),
    facingNeedle: $("#facingNeedle"),
    waterBadge: $("#waterBadge"),
    waxStamp: $("#waxStamp"),
    oxBadge: $("#oxBadge"),
    waxBadge: $("#waxBadge"),
    blockName: $("#blockName"),
    stateChips: $("#stateChips"),
    blockId: $("#blockId"),
    nextNameBtn: $("#nextNameBtn"),
    typeProgress: $("#typeProgress"),
    progressLabel: $("#progressLabel"),
    playHint: $("#playHint"),
    progressTrack: $(".progress-track"),
    progressFill: $("#progressFill"),
    playBtn: $("#playBtn"),
    playIcon: $("#playIcon"),
    playLabel: $("#playLabel"),
    prevBtn: $("#prevBtn"),
    nextBtn: $("#nextBtn"),
    ttsToggle: $("#ttsToggle"),
    voiceSelect: $("#voiceSelect"),
    ttsRateSelect: $("#ttsRateSelect"),
    loopBtn: $("#loopBtn"),
    speedRange: $("#speedRange"),
    speedLabel: $("#speedLabel"),
    totalBadge: $("#totalBadge"),
    selectedSummary: $("#selectedSummary"),
    customCount: $("#customCount"),
    libraryList: $("#libraryList"),
    customList: $("#customList"),
    searchInput: $("#searchInput"),
    selectAllBtn: $("#selectAllBtn"),
    clearAllBtn: $("#clearAllBtn"),
    modeDescription: $("#modeDescription"),
    segments: $$(".segment"),
    panelTabs: $$(".panel-tab"),
    panelPanes: $$(".panel-pane"),
    addCustomBtn: $("#addCustomBtn"),
    customDialog: $("#customDialog"),
    customForm: $("#customForm"),
    customName: $("#customName"),
    customOx: $("#customOx"),
    customWaxed: $("#customWaxed"),
    customStates: $("#customStates"),
    customIcon: $("#customIcon"),
    customEn: $("#customEn"),
    helpDialog: $("#helpDialog"),
    helpBtn: $("#helpBtn"),
    fullscreenBtn: $("#fullscreenBtn"),
    resetDataBtn: $("#resetDataBtn"),
    toast: $("#toast"),
  };

  const app = {
    selected: new Set(D.BLOCK_TYPES.map((type) => type.id)),
    custom: [],
    items: [],
    index: 0,
    mode: "full",
    duration: 1600,
    loop: true,
    tts: false,
    playing: false,
    finished: false,
    speaking: false,
    timer: null,
    speechToken: 0,
    speechStartTimer: null,
    speechWatchdog: null,
    speechNextTimer: null,
    ttsActive: null,
    ttsQueued: null,
    voices: [],
    voice: null,
    voicePreference: "auto",
    ttsRateMode: "auto",
    localFallbackLocked: false,
    toastTimer: null,
    libraryQuery: "",
  };

  /* ------------------------------------------------------------------------
     持久化
     ------------------------------------------------------------------------ */

  function loadState() {
    let saved = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (error) {
      saved = null;
    }
    if (!saved || typeof saved !== "object") return;

    const validIds = new Set(D.BLOCK_TYPES.map((type) => type.id));
    if (Array.isArray(saved.selected)) {
      app.selected = new Set(saved.selected.filter((id) => validIds.has(id)));
    }
    if (saved.mode === "simple" || saved.mode === "full") app.mode = saved.mode;
    if (Number.isFinite(Number(saved.duration))) {
      app.duration = Math.max(600, Math.min(5000, Number(saved.duration)));
    }
    if (typeof saved.loop === "boolean") app.loop = saved.loop;
    if (typeof saved.tts === "boolean") app.tts = saved.tts && speechSupported;
    if (typeof saved.voice === "string" && saved.voice) app.voicePreference = saved.voice;
    if (typeof saved.ttsRate === "string") {
      if (saved.ttsRate === "auto") {
        app.ttsRateMode = "auto";
      } else {
        const rate = Number(saved.ttsRate);
        if (Number.isFinite(rate) && rate >= 0.5 && rate <= 2) {
          app.ttsRateMode = String(rate);
        }
      }
    }
    if (Array.isArray(saved.custom)) {
      app.custom = saved.custom
        .filter((entry) => entry && entry.id && entry.baseName)
        .slice(0, 100)
        .map((entry) => ({
          id: String(entry.id),
          baseName: String(entry.baseName).slice(0, 28),
          oxidation: Math.max(0, Math.min(3, Number(entry.oxidation) || 0)),
          waxed: Boolean(entry.waxed),
          extraStates: Array.isArray(entry.extraStates)
            ? entry.extraStates.filter(Boolean).map(String).slice(0, 10)
            : [],
          icon: entry.icon || "custom",
          en: entry.en || "",
          createdAt: Number(entry.createdAt) || Date.now(),
        }));
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selected: Array.from(app.selected),
          mode: app.mode,
          duration: app.duration,
          loop: app.loop,
          tts: app.tts,
          voice: app.voicePreference,
          ttsRate: app.ttsRateMode,
          custom: app.custom,
        })
      );
    } catch (error) {
      /* file:// 或隐私模式可能禁止 localStorage，页面本身仍然可用 */
    }
  }

  /* ------------------------------------------------------------------------
     基础工具
     ------------------------------------------------------------------------ */

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (ch) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function formatIndex(value) {
    return String(value).padStart(4, "0");
  }

  function currentItem() {
    return app.items[app.index] || null;
  }

  function toast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(app.toastTimer);
    app.toastTimer = setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, 2600);
  }

  function setHint(text) {
    if (els.playHint) els.playHint.textContent = text;
  }

  function focusStageOnMobile() {
    if (!els.stage || window.innerWidth > 900) return;
    els.stage.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }

  function setSpeaking(on) {
    app.speaking = Boolean(on);
    if (els.speakingPill) els.speakingPill.hidden = !app.speaking;
    if (els.stage) els.stage.classList.toggle("is-speaking", app.speaking);
    if (app.speaking && app.playing) {
      setHint(nextItem() ? "正在朗读 · 下一项已预加载" : "正在朗读 · 最后一项");
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty("--ox", theme.ox);
    root.style.setProperty("--ox-hi", theme.hi);
    root.style.setProperty("--ox-deep", theme.deep);
    root.style.setProperty("--ox-soft", theme.soft);
    root.style.setProperty("--ox-glow", theme.glow);
    root.style.setProperty("--ox-rgb", theme.rgb);
  }

  /* ------------------------------------------------------------------------
     播放列表
     ------------------------------------------------------------------------ */

  function rebuildItems(options) {
    const opts = options || {};
    const previous = currentItem();
    const oldUid = previous ? previous.uid : null;
    const oldType = previous ? previous.typeKey : null;

    if (app.playing) pausePlayback({ silent: true });

    app.items = D.buildAllItems(Array.from(app.selected), app.custom, app.mode);

    if (!app.items.length) {
      app.index = 0;
    } else if (opts.keepCurrent !== false && oldUid) {
      const same = app.items.findIndex((item) => item.uid === oldUid);
      if (same >= 0) {
        app.index = same;
      } else {
        const sameType = app.items.findIndex((item) => item.typeKey === oldType);
        app.index = sameType >= 0 ? sameType : 0;
      }
    } else {
      app.index = 0;
    }

    app.finished = false;
    updateTotals();
    updateModeUI();
    renderCurrent();
    updatePlayUI();
    if (!opts.silent && !app.items.length) {
      toast("播放列表为空，请先在方块库中选择方块");
    }
  }

  function updateTotals() {
    const total = app.items.length;
    els.totalBadge.textContent = `${formatNumber(total)} 个状态`;
    els.selectedSummary.textContent = `已选 ${app.selected.size} / ${D.BLOCK_TYPES.length} 类`;
    els.customCount.textContent = String(app.custom.length);
    const disabled = total === 0;
    els.playBtn.disabled = disabled;
    els.prevBtn.disabled = disabled;
    els.nextBtn.disabled = disabled;
    els.nextNameBtn.disabled = disabled;
    els.loopBtn.disabled = disabled;
    els.speedRange.disabled = disabled;
    if (disabled) {
      els.modeHint.textContent = app.mode === "full" ? "完整状态 · 0 项" : "精简状态 · 0 项";
    } else {
      els.modeHint.textContent = `${app.mode === "full" ? "完整状态" : "精简状态"} · ${formatNumber(total)} 项`;
    }
  }

  function updateModeUI() {
    els.segments.forEach((button) => {
      const active = button.dataset.mode === app.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    els.modeDescription.textContent =
      app.mode === "full"
        ? "展开全部朝向、含水、开关与连接状态"
        : "每类保留一个代表状态，通常为 8 个氧化/涂蜡变种";
  }

  function nextItem() {
    if (!app.items.length) return null;
    if (app.index < app.items.length - 1) return app.items[app.index + 1];
    return app.loop ? app.items[0] : null;
  }

  /* ------------------------------------------------------------------------
     主舞台渲染
     ------------------------------------------------------------------------ */

  function chipClass(kind) {
    if (!kind) return "";
    return ` state-chip--${kind}`;
  }

  function renderCurrent() {
    if (!app.items.length) {
      renderEmptyState();
      return;
    }

    const item = app.items[app.index];
    applyTheme(item.theme);
    els.stage.dataset.ox = item.oxidation === null ? "special" : String(item.oxidation);

    els.categoryBadge.textContent = item.categoryLabel;
    els.seqNo.textContent = `#${formatIndex(app.index + 1)}`;

    if (item.special) {
      els.oxBadge.textContent = "特殊方块";
      els.waxBadge.textContent = "不可涂蜡";
      els.waxBadge.classList.remove("is-waxed");
    } else {
      const ox = D.OXIDATION[item.oxidation];
      els.oxBadge.textContent = ox ? ox.label : "未氧化";
      els.waxBadge.textContent = item.waxed ? "涂蜡" : "未涂蜡";
      els.waxBadge.classList.toggle("is-waxed", item.waxed);
    }

    els.blockName.textContent = item.name;
    els.blockName.classList.toggle("is-long", item.name.length > 13);
    els.blockName.classList.toggle("is-very-long", item.name.length > 20);
    els.blockName.classList.toggle("is-ultra-long", item.name.length > 32);
    els.stateChips.innerHTML = item.stateChips
      .map((chip) => `<span class="state-chip${chipClass(chip.kind)}">${escapeHTML(chip.label)}</span>`)
      .join("");

    els.blockId.textContent = item.mcId;
    els.blockId.title = item.mcId;

    const facingValue = item.stateValues && item.stateValues.facing;
    if (facingValue) {
      els.facingBadge.hidden = false;
      els.facingText.textContent = facingValue.label;
      const rotation = Number.isFinite(Number(facingValue.rotation)) ? Number(facingValue.rotation) : 0;
      els.facingNeedle.style.transform = `rotate(${rotation}deg)`;
    } else {
      els.facingBadge.hidden = true;
    }

    els.waterBadge.hidden = !item.waterlogged;
    els.waxStamp.hidden = !item.waxed;

    els.nextNameBtn.textContent = nextItem() ? nextItem().name : "已是最后一项";
    els.nextNameBtn.dataset.hasNext = nextItem() ? "1" : "0";

    if (item.isCustom) {
      els.typeProgress.textContent = `自定义条目 · 第 ${item.customOrdinal || 1} / ${item.customTotal || 1} 条`;
    } else {
      els.typeProgress.textContent = `本类 ${item.typeOrdinal} / ${item.typeTotal}`;
    }

    els.progressLabel.textContent = `${formatIndex(app.index + 1)} / ${formatNumber(app.items.length)}`;
    const percentage = ((app.index + 1) / app.items.length) * 100;
    els.progressFill.style.width = `${percentage}%`;
    els.progressTrack.setAttribute("aria-valuenow", String(Math.round(percentage)));
    els.progressTrack.setAttribute("aria-valuemax", "100");
    els.progressTrack.setAttribute("aria-valuemin", "0");

    els.blockArt.innerHTML = A.render(item);
    els.blockArt.classList.remove("is-flashing");
    void els.blockArt.offsetWidth;
    els.blockArt.classList.add("is-flashing");

    document.title = `${item.name} · 铜方块快闪`;
    updatePlayUI();
  }

  function renderEmptyState() {
    applyTheme(D.OXIDATION[0].theme);
    els.stage.dataset.ox = "empty";
    els.categoryBadge.textContent = "空闲";
    els.seqNo.textContent = "—";
    els.oxBadge.textContent = "等待选择";
    els.waxBadge.textContent = "—";
    els.waxBadge.classList.remove("is-waxed");
    els.blockName.textContent = "还没有选择方块";
    els.blockName.classList.remove("is-long", "is-very-long", "is-ultra-long");
    els.stateChips.innerHTML = `<span class="state-chip state-chip--none">在右侧方块库选择要播放的铜方块</span>`;
    els.blockId.textContent = "playlist is empty";
    els.blockId.title = "playlist is empty";
    els.facingBadge.hidden = true;
    els.waterBadge.hidden = true;
    els.waxStamp.hidden = true;
    els.nextNameBtn.textContent = "—";
    els.nextNameBtn.dataset.hasNext = "0";
    els.typeProgress.textContent = "—";
    els.progressLabel.textContent = `0000 / 0000`;
    els.progressFill.style.width = "0%";
    els.progressTrack.setAttribute("aria-valuenow", "0");
    els.blockArt.innerHTML = emptyArtwork();
    els.blockArt.classList.remove("is-flashing");
    setHint("播放列表为空");
    document.title = "铜方块快闪 · Copper Block Flash";
    updatePlayUI();
  }

  function emptyArtwork() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" aria-hidden="true">
      <defs>
        <pattern id="emptyTex" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect x="2" y="2" width="2" height="2" fill="#d8874a" opacity=".14"/>
          <rect x="7" y="6" width="1" height="1" fill="#d8874a" opacity=".1"/>
        </pattern>
      </defs>
      <ellipse cx="130" cy="225" rx="78" ry="12" fill="#000" opacity=".25"/>
      <g opacity=".26">
        <polygon points="130,38 212,80 130,122 48,80" fill="#d8874a"/>
        <polygon points="48,80 130,122 130,208 48,166" fill="#8f4f26"/>
        <polygon points="212,80 130,122 130,208 212,166" fill="#c77a3f"/>
        <polygon points="48,80 130,122 130,208 48,166" fill="url(#emptyTex)"/>
        <polygon points="212,80 130,122 130,208 212,166" fill="url(#emptyTex)"/>
        <polygon points="130,38 212,80 130,122 48,80" fill="url(#emptyTex)"/>
      </g>
      <g fill="none" stroke="#d8874a" stroke-width="1.4" opacity=".32">
        <polygon points="130,20 218,65 130,110 42,65"/>
        <path d="M42 65v92M218 65v92M130 110v92"/>
      </g>
      <text x="130" y="246" fill="#8fa69d" font-family="monospace" font-size="10" text-anchor="middle" opacity=".7">SELECT COPPER BLOCKS</text>
    </svg>`;
  }

  /* ------------------------------------------------------------------------
     播放状态
     ------------------------------------------------------------------------ */

  function updatePlayUI() {
    const hasItems = app.items.length > 0;
    const iconHref = app.playing ? "#i-pause" : "#i-play";
    if (els.playIcon) els.playIcon.innerHTML = `<use href="${iconHref}"></use>`;
    if (app.playing) {
      els.playLabel.textContent = "暂停";
      els.playBtn.setAttribute("aria-label", "暂停快闪");
      els.stage.classList.add("is-playing");
    } else {
      els.playLabel.textContent = app.finished
        ? "重新播放"
        : app.index > 0
          ? "继续播放"
          : "开始快闪";
      els.playBtn.setAttribute("aria-label", app.finished ? "重新播放" : "开始快闪");
      els.stage.classList.remove("is-playing");
    }

    els.playBtn.disabled = !hasItems;
    els.prevBtn.disabled = !hasItems;
    els.nextBtn.disabled = !hasItems;

    if (!hasItems) {
      setHint("播放列表为空");
    } else if (app.playing) {
      if (app.tts && speechSupported) {
        setHint(
          app.speaking
            ? nextItem()
              ? "正在朗读 · 下一项已预加载"
              : "正在朗读 · 最后一项"
            : "朗读模式 · 预加载下一项"
        );
      } else {
        setHint(`自动播放 · ${(app.duration / 1000).toFixed(1)}s/项`);
      }
    } else if (app.finished) {
      setHint("播放完毕");
    } else if (app.index > 0) {
      setHint("已暂停 · 空格继续");
    } else {
      setHint("已暂停 · 按空格开始");
    }

    if (!els.speakingPill.hidden && !app.speaking) {
      els.speakingPill.hidden = true;
    }
  }

  function clearAdvanceTimer() {
    clearTimeout(app.timer);
    app.timer = null;
  }

  function cancelSpeech() {
    app.speechToken += 1;
    clearTimeout(app.speechStartTimer);
    clearTimeout(app.speechWatchdog);
    clearTimeout(app.speechNextTimer);
    app.speechStartTimer = null;
    app.speechWatchdog = null;
    app.speechNextTimer = null;
    app.ttsActive = null;
    app.ttsQueued = null;
    setSpeaking(false);
    if (synth) {
      try {
        synth.cancel();
      } catch (error) {
        /* ignore */
      }
    }
  }

  const VOICE_NAME_BONUSES = [
    [/晓晓|Xiaoxiao/i, 28],
    [/晓伊|Xiaoyi/i, 20],
    [/云希|Yunxi/i, 14],
    [/云健|Yunjian/i, 12],
    [/云扬|Yunyang/i, 10],
    [/云夏|Yunxia/i, 8],
    [/Huihui/i, 10],
    [/Yaoyao/i, 8],
    [/Kangkang/i, 4],
  ];

  function scoreVoice(voice) {
    if (!voice || !/^zh/i.test(voice.lang)) return -9999;
    let score = 60;
    const lang = String(voice.lang).toLowerCase();
    if (lang === "zh-cn") score += 40;
    else if (lang.startsWith("zh-cn-")) score += 15;
    else if (lang === "zh-tw" || lang === "zh-hk") score -= 25;

    if (/Microsoft/i.test(voice.name)) score += 15; // Edge 内置语音
    if (/Online\s*\(Natural\)/i.test(voice.name)) score += 70;
    else if (/Natural/i.test(voice.name)) score += 45;
    if (/Mandarin, Simplified|Simplified, PRC|Chinese \(Mainland\)/i.test(voice.name)) score += 10;
    for (const [pattern, bonus] of VOICE_NAME_BONUSES) {
      if (pattern.test(voice.name)) score += bonus;
    }

    if (voice.localService) {
      score += 3;
      if (navigator.onLine === false) score += 120;
    } else if (navigator.onLine === false) {
      score -= 120;
    }
    if (voice.default) score += 2;
    return score;
  }

  function pickBestVoice() {
    if (!app.voices.length) return null;
    const chinese = app.voices.filter((voice) => /^zh/i.test(voice.lang));
    if (chinese.length) {
      return chinese.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
    }
    return app.voices.find((voice) => voice.default) || null;
  }

  function pickLocalVoice() {
    const local = app.voices.filter((voice) => /^zh/i.test(voice.lang) && voice.localService);
    return local.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
  }

  function shortVoiceName(voice) {
    if (!voice) return "浏览器默认语音";
    return voice.name
      .replace(/^Microsoft\s+/i, "")
      .replace(/\s+-\s+Chinese.*$/i, "")
      .replace(/\s+-\s+.*$/i, "")
      .trim();
  }

  function ttsRateFor(voice) {
    if (app.ttsRateMode !== "auto") {
      const customRate = Number(app.ttsRateMode);
      if (Number.isFinite(customRate) && customRate >= 0.5 && customRate <= 2) {
        return customRate;
      }
    }
    if (!voice) return 1.12;
    return voice.localService ? 1.24 : 1.1;
  }

  function voiceInfoText() {
    const voice = app.voice;
    const rate = ttsRateFor(voice);
    const kind = voice ? (voice.localService ? "本地" : "自然") : "默认";
    return `${shortVoiceName(voice)} · ${kind} · ${rate.toFixed(2)}×`;
  }

  function resolveVoice() {
    if (app.voicePreference !== "auto") {
      const chosen = app.voices.find((voice) => voice.name === app.voicePreference);
      if (chosen) return chosen;
    }
    if (app.localFallbackLocked) {
      return pickLocalVoice() || pickBestVoice();
    }
    return pickBestVoice();
  }

  function syncVoiceSelect() {
    if (!els.voiceSelect) return;
    if (
      app.voicePreference !== "auto" &&
      app.voices.some((voice) => voice.name === app.voicePreference)
    ) {
      els.voiceSelect.value = app.voicePreference;
    } else {
      els.voiceSelect.value = "auto";
    }
  }

  function renderVoiceOptions() {
    if (!els.voiceSelect) return;
    if (!speechSupported) {
      els.voiceSelect.innerHTML = `<option value="auto">当前浏览器不支持语音</option>`;
      els.voiceSelect.disabled = true;
      return;
    }

    const chinese = app.voices
      .filter((voice) => /^zh/i.test(voice.lang))
      .slice()
      .sort((a, b) => scoreVoice(b) - scoreVoice(a));
    const online = chinese.filter((voice) => !voice.localService && /Natural|Online/i.test(voice.name));
    const local = chinese.filter((voice) => voice.localService);
    const other = chinese.filter((voice) => !online.includes(voice) && !local.includes(voice));

    const groups = [
      ["在线自然语音", online],
      ["本地语音", local],
      ["其他中文语音", other],
    ];

    let html = `<option value="auto">自动（优先自然语音）</option>`;
    for (const [label, voices] of groups) {
      if (!voices.length) continue;
      html += `<optgroup label="${escapeHTML(label)}">`;
      for (const voice of voices) {
        const type = voice.localService ? "本地" : "在线";
        const optionLabel = `${shortVoiceName(voice)} · ${type}${voice.default ? " · 默认" : ""}`;
        html += `<option value="${escapeHTML(voice.name)}">${escapeHTML(optionLabel)}</option>`;
      }
      html += `</optgroup>`;
    }

    els.voiceSelect.innerHTML = html;
    els.voiceSelect.disabled = chinese.length === 0;
    syncVoiceSelect();
  }

  function refreshVoices() {
    if (!synth) return;
    try {
      app.voices = synth.getVoices() || [];
    } catch (error) {
      app.voices = [];
    }
    app.voice = resolveVoice();
    renderVoiceOptions();
    updateTtsUI();
  }

  function buildSpeechUtterance(item) {
    const utterance = new SpeechSynthesisUtterance(item.speech);
    utterance.lang = "zh-CN";
    utterance.rate = ttsRateFor(app.voice);
    utterance.pitch = 1;
    utterance.volume = 1;
    if (app.voice) utterance.voice = app.voice;
    return utterance;
  }

  function setDisplayIndex(index) {
    if (!app.items[index] || app.index === index) return;
    app.index = index;
    app.finished = false;
    renderCurrent();
  }

  function getNextSpeechIndex(index) {
    if (!app.items.length) return null;
    if (index < app.items.length - 1) return index + 1;
    return app.loop ? 0 : null;
  }

  function applyLocalFallback(local) {
    if (!local) return;
    const wasManual = app.voicePreference !== "auto";
    app.voice = local;
    if (wasManual) {
      app.voicePreference = local.name;
      app.localFallbackLocked = false;
    } else {
      app.localFallbackLocked = true;
    }
    renderVoiceOptions();
    updateTtsUI();
    toast(`在线自然语音不可用，已改用本地语音 · ${ttsRateFor(local).toFixed(2)}×`);
  }

  function clearSpeechTimers() {
    clearTimeout(app.speechStartTimer);
    clearTimeout(app.speechWatchdog);
    clearTimeout(app.speechNextTimer);
    app.speechStartTimer = null;
    app.speechWatchdog = null;
    app.speechNextTimer = null;
  }

  function finishTtsPlayback() {
    app.playing = false;
    app.finished = true;
    clearAdvanceTimer();
    cancelSpeech();
    updatePlayUI();
    toast("播放完毕");
  }

  function advanceFromSpeech(speech) {
    if (!app.playing || !app.tts) return;
    if (app.ttsActive && app.ttsActive !== speech) {
      if (app.index !== app.ttsActive.index) setDisplayIndex(app.ttsActive.index);
      return;
    }
    if (app.ttsActive === speech) app.ttsActive = null;
    const queued = app.ttsQueued;
    if (queued && queued.token === speech.token) {
      setDisplayIndex(queued.index);
      setHint("朗读模式 · 下一项已预加载");
      clearTimeout(app.speechNextTimer);
      app.speechNextTimer = setTimeout(() => {
        if (
          queued.token === app.speechToken &&
          app.ttsQueued === queued &&
          !queued.started &&
          app.playing
        ) {
          startTtsSequence(queued.index);
        }
      }, 5000);
      return;
    }
    finishTtsPlayback();
  }

  function handleSpeechEnd(speech) {
    if (speech.token !== app.speechToken || speech.finished) return;
    speech.finished = true;
    clearSpeechTimers();
    if (!app.playing || !app.tts) return;
    advanceFromSpeech(speech);
  }

  function handleSpeechError(speech) {
    if (speech.token !== app.speechToken || speech.finished) return;
    speech.finished = true;
    clearSpeechTimers();
    if (!app.playing || !app.tts) return;
    if (app.voice && !app.voice.localService) {
      const local = pickLocalVoice();
      if (local) {
        applyLocalFallback(local);
        startTtsSequence(speech.index);
        return;
      }
    }
    advanceFromSpeech(speech);
  }

  function handleSpeechStart(speech) {
    if (speech.token !== app.speechToken || !app.playing || !app.tts || speech.finished) return;
    speech.started = true;
    clearTimeout(app.speechStartTimer);
    clearTimeout(app.speechNextTimer);
    app.speechStartTimer = null;
    app.speechNextTimer = null;

    if (speech.kind === "queued") {
      if (app.ttsQueued !== speech) return;
      speech.kind = "active";
      app.ttsActive = speech;
      app.ttsQueued = null;
    }
    if (app.ttsActive !== speech) return;

    if (app.index !== speech.index) setDisplayIndex(speech.index);
    setSpeaking(true);
    const next = getNextSpeechIndex(speech.index);
    setHint(next !== null ? "正在朗读 · 下一项已预加载" : "正在朗读 · 最后一项");
    clearTimeout(app.speechWatchdog);
    app.speechWatchdog = setTimeout(() => handleSpeechEnd(speech), 25000);

    if (next !== null && !app.ttsQueued) {
      queueSpeech(next, speech.token, "queued");
    }
  }

  function handleSpeechStartTimeout(speech) {
    if (speech.token !== app.speechToken || speech.started || speech.finished || !app.playing) return;
    if (synth.speaking || synth.pending) return;
    clearTimeout(app.speechStartTimer);
    app.speechStartTimer = null;
    if (app.voice && !app.voice.localService) {
      const local = pickLocalVoice();
      if (local) {
        applyLocalFallback(local);
        startTtsSequence(speech.index);
        return;
      }
    }
    clearAdvanceTimer();
    app.timer = setTimeout(() => {
      if (speech.token === app.speechToken) advanceAfterCurrent();
    }, app.duration);
  }

  function queueSpeech(index, token, kind) {
    if (token !== app.speechToken || !app.playing || !app.tts) return null;
    const item = app.items[index];
    if (!item) return null;

    const utterance = buildSpeechUtterance(item);
    const speech = {
      index,
      token,
      kind,
      utterance,
      started: false,
      finished: false,
    };
    utterance.onstart = () => handleSpeechStart(speech);
    utterance.onend = () => handleSpeechEnd(speech);
    utterance.onerror = () => handleSpeechError(speech);

    if (kind === "active") {
      app.ttsActive = speech;
      app.speechStartTimer = setTimeout(() => handleSpeechStartTimeout(speech), 1800);
    } else {
      app.ttsQueued = speech;
    }

    try {
      synth.speak(utterance);
      if (synth.paused) synth.resume();
    } catch (error) {
      handleSpeechError(speech);
    }
    return speech;
  }

  function startTtsSequence(startIndex) {
    if (!app.playing) return;
    if (!app.tts || !speechSupported || !synth) {
      clearAdvanceTimer();
      app.timer = setTimeout(() => advanceAfterCurrent(), app.duration);
      return;
    }
    if (typeof startIndex === "number" && app.items[startIndex]) {
      app.index = startIndex;
      app.finished = false;
      renderCurrent();
    }
    clearAdvanceTimer();
    cancelSpeech();
    const token = app.speechToken;
    setHint("朗读模式 · 预加载下一项");
    queueSpeech(app.index, token, "active");
  }

  function speakCurrent(onDone) {
    if (!app.tts || !speechSupported || !synth) {
      onDone();
      return;
    }

    const token = ++app.speechToken;
    try {
      synth.cancel();
    } catch (error) {
      /* ignore */
    }
    app.ttsActive = null;
    app.ttsQueued = null;
    setSpeaking(false);

    const item = currentItem();
    if (!item) {
      onDone();
      return;
    }

    const utterance = buildSpeechUtterance(item);

    let finished = false;
    let started = false;
    let retriedLocal = false;

    const retryWithLocalVoice = () => {
      if (retriedLocal || !app.tts) return false;
      if (!app.voice || app.voice.localService) return false;
      const local = pickLocalVoice();
      if (!local) return false;
      retriedLocal = true;
      const wasManual = app.voicePreference !== "auto";
      app.voice = local;
      if (wasManual) {
        app.voicePreference = local.name;
        app.localFallbackLocked = false;
      } else {
        app.localFallbackLocked = true;
      }
      renderVoiceOptions();
      updateTtsUI();
      toast(`在线自然语音不可用，已改用本地语音 · ${ttsRateFor(local).toFixed(2)}×`);
      speakCurrent(onDone);
      return true;
    };

    const finish = (advance) => {
      if (finished) return;
      finished = true;
      clearTimeout(app.speechStartTimer);
      clearTimeout(app.speechWatchdog);
      app.speechStartTimer = null;
      app.speechWatchdog = null;
      if (token !== app.speechToken) return;
      setSpeaking(false);
      if (advance) {
        setTimeout(() => {
          if (token === app.speechToken) onDone();
        }, 190);
      } else {
        onDone();
      }
    };

    utterance.onstart = () => {
      if (token !== app.speechToken) return;
      started = true;
      clearTimeout(app.speechStartTimer);
      setSpeaking(true);
    };

    utterance.onend = () => finish(true);
    utterance.onerror = () => {
      if (token !== app.speechToken) return;
      if (retryWithLocalVoice()) return;
      finish(true);
    };

    app.speechWatchdog = setTimeout(() => {
      if (token !== app.speechToken) return;
      finish(true);
    }, 18000);

    app.speechStartTimer = setTimeout(() => {
      if (token !== app.speechToken) return;
      if (started) return;
      if (synth.speaking || synth.pending) return;
      clearTimeout(app.speechStartTimer);
      app.speechStartTimer = null;
      setSpeaking(false);
      if (retryWithLocalVoice()) return;
      if (app.playing) {
        clearAdvanceTimer();
        app.timer = setTimeout(() => {
          if (token === app.speechToken) onDone();
        }, app.duration);
      }
    }, 1600);

    try {
      synth.speak(utterance);
      if (synth.paused) synth.resume();
    } catch (error) {
      finish(true);
    }
  }

  function armAdvance() {
    clearAdvanceTimer();
    if (!app.playing) return;

    if (app.tts && speechSupported) {
      startTtsSequence();
    } else {
      setHint(`自动播放 · ${(app.duration / 1000).toFixed(1)}s/项`);
      app.timer = setTimeout(() => {
        advanceAfterCurrent();
      }, app.duration);
    }
  }

  function advanceAfterCurrent() {
    if (!app.playing) return;
    if (!app.items.length) {
      app.playing = false;
      updatePlayUI();
      return;
    }
    if (app.index >= app.items.length - 1) {
      if (app.loop) {
        showIndex(0, { arm: true });
      } else {
        app.playing = false;
        app.finished = true;
        clearAdvanceTimer();
        cancelSpeech();
        updatePlayUI();
        toast("播放完毕");
      }
      return;
    }
    showIndex(app.index + 1, { arm: true });
  }

  function showIndex(index, options) {
    const opts = options || {};
    if (!app.items.length) {
      app.index = 0;
      renderEmptyState();
      updatePlayUI();
      return;
    }

    clearAdvanceTimer();
    cancelSpeech();
    app.index = Math.max(0, Math.min(app.items.length - 1, index));
    app.finished = false;
    renderCurrent();
    if (opts.arm !== false && app.playing) armAdvance();
    updatePlayUI();
  }

  function startPlayback() {
    if (!app.items.length) {
      toast("播放列表为空");
      return;
    }
    if (app.finished) {
      app.finished = false;
      app.index = 0;
      renderCurrent();
    }
    app.playing = true;
    updatePlayUI();
    armAdvance();
  }

  function pausePlayback(options) {
    const opts = options || {};
    if (!app.playing && !app.speaking) return;
    app.playing = false;
    app.finished = false;
    clearAdvanceTimer();
    cancelSpeech();
    updatePlayUI();
    if (!opts.silent && !opts.keepHint) {
      setHint("已暂停 · 空格继续");
    }
  }

  function togglePlayback() {
    if (app.playing) pausePlayback();
    else startPlayback();
  }

  function step(delta) {
    if (!app.items.length) return;
    let next = app.index + delta;
    if (next < 0) next = app.loop ? app.items.length - 1 : 0;
    if (next >= app.items.length) next = app.loop ? 0 : app.items.length - 1;
    if (next === app.index) {
      toast(delta > 0 ? "已经是最后一项" : "已经是第一项");
      return;
    }
    showIndex(next, { arm: app.playing });
  }

  function resetToStart() {
    if (!app.items.length) return;
    app.finished = false;
    showIndex(0, { arm: app.playing });
  }

  /* ------------------------------------------------------------------------
     TTS 控件
     ------------------------------------------------------------------------ */

  function updateTtsUI() {
    const available = speechSupported;
    els.ttsToggle.classList.toggle("is-on", app.tts);
    els.ttsToggle.classList.toggle("is-unavailable", !available);
    els.ttsToggle.setAttribute("aria-checked", String(app.tts));
    els.ttsToggle.setAttribute("aria-disabled", String(!available));
    const icon = $("use", els.ttsToggle);
    if (icon) icon.setAttribute("href", app.tts ? "#i-speaker" : "#i-muted");
    const rate = ttsRateFor(app.voice);
    els.ttsToggle.dataset.voice = app.voice ? app.voice.name : "";
    els.ttsToggle.dataset.rate = rate.toFixed(2);
    if (els.voiceSelect) {
      els.voiceSelect.title = voiceInfoText();
    }
    if (els.ttsRateSelect) {
      els.ttsRateSelect.value = app.ttsRateMode;
      els.ttsRateSelect.title = `朗读语速 · ${rate.toFixed(2)}×${app.ttsRateMode === "auto" ? "（自动）" : ""}`;
    }
    if (!available) {
      els.ttsToggle.title = "当前浏览器不支持语音合成";
    } else {
      els.ttsToggle.title = `朗读（T）· ${voiceInfoText()}`;
    }
  }

  function toggleTts() {
    if (!speechSupported) {
      toast("当前浏览器不支持 Web Speech 语音合成");
      return;
    }
    app.tts = !app.tts;
    if (app.tts) {
      app.localFallbackLocked = false;
      refreshVoices();
    }
    updateTtsUI();
    saveState();
    if (!app.tts) {
      clearAdvanceTimer();
      cancelSpeech();
    }
    if (app.playing) {
      clearAdvanceTimer();
      cancelSpeech();
      armAdvance();
    } else if (app.tts && currentItem()) {
      toast(`已开启朗读 · ${voiceInfoText()}`);
      speakCurrent(() => {});
    } else {
      toast("已关闭朗读");
    }
    updatePlayUI();
  }

  function changeVoice(value) {
    app.localFallbackLocked = false;
    app.voicePreference = value || "auto";
    app.voice = resolveVoice();
    if (app.voicePreference !== "auto" && !app.voice) {
      app.voicePreference = "auto";
      app.voice = resolveVoice();
      toast("该音色当前不可用，已恢复自动选择");
    }
    saveState();
    syncVoiceSelect();
    updateTtsUI();
    if (app.tts) {
      if (app.playing) {
        clearAdvanceTimer();
        cancelSpeech();
        armAdvance();
      } else if (currentItem()) {
        toast(`已切换音色 · ${voiceInfoText()}`);
        speakCurrent(() => {});
      }
    } else {
      toast(`已切换音色 · ${voiceInfoText()}`);
    }
    updatePlayUI();
  }

  function changeTtsRate(value) {
    app.ttsRateMode = value || "auto";
    if (app.ttsRateMode !== "auto") {
      const rate = Number(app.ttsRateMode);
      if (!Number.isFinite(rate) || rate < 0.5 || rate > 2) app.ttsRateMode = "auto";
    }
    saveState();
    updateTtsUI();
    const rateText = `${ttsRateFor(app.voice).toFixed(2)}×${app.ttsRateMode === "auto" ? "（自动）" : ""}`;
    if (app.tts) {
      if (app.playing) {
        clearAdvanceTimer();
        cancelSpeech();
        armAdvance();
      } else if (currentItem()) {
        toast(`朗读语速 · ${rateText}`);
        speakCurrent(() => {});
      }
    } else {
      toast(`朗读语速已设为 ${rateText}`);
    }
    updatePlayUI();
  }

  function updateSpeedUI() {
    els.speedRange.value = String(app.duration);
    els.speedLabel.value = `${(app.duration / 1000).toFixed(1)}s`;
    els.speedLabel.textContent = `${(app.duration / 1000).toFixed(1)}s`;
  }

  function toggleLoop() {
    app.loop = !app.loop;
    els.loopBtn.classList.toggle("is-on", app.loop);
    els.loopBtn.setAttribute("aria-checked", String(app.loop));
    saveState();
    if (app.playing) {
      clearAdvanceTimer();
      armAdvance();
    }
  }

  /* ------------------------------------------------------------------------
     侧栏：方块库
     ------------------------------------------------------------------------ */

  function typeMatchesQuery(type, query) {
    if (!query) return true;
    const haystack = [
      type.baseName,
      type.en,
      type.desc,
      ...(type.aliases || []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }

  function renderLibrary() {
    const query = app.libraryQuery.trim().toLowerCase();
    const visible = D.BLOCK_TYPES.filter((type) => typeMatchesQuery(type, query));
    if (!visible.length) {
      els.libraryList.innerHTML = `<div class="lib-empty">没有找到匹配的铜方块。</div>`;
      return;
    }

    const groups = new Map();
    visible.forEach((type) => {
      if (!groups.has(type.category)) groups.set(type.category, []);
      groups.get(type.category).push(type);
    });

    const html = Array.from(groups.entries())
      .sort((a, b) => {
        const ca = D.CATEGORIES[a[0]] || { order: 99 };
        const cb = D.CATEGORIES[b[0]] || { order: 99 };
        return ca.order - cb.order;
      })
      .map(([category, types]) => {
        const categoryInfo = D.CATEGORIES[category] || { label: category };
        const rows = types
          .map((type) => {
            const selected = app.selected.has(type.id);
            const count = D.countType(type, app.mode);
            const title = `${type.baseName} · ${type.en}`;
            const alias = (type.aliases || []).find(
              (candidate) =>
                candidate !== type.baseName &&
                /[\u4e00-\u9fa5]/.test(candidate) &&
                candidate.toLowerCase() !== type.en.toLowerCase()
            );
            return `<div class="lib-item${selected ? " is-selected" : ""}" data-type-id="${type.id}" title="${escapeHTML(title)}">
              <label class="lib-check" aria-label="选择 ${escapeHTML(type.baseName)}">
                <input type="checkbox" ${selected ? "checked" : ""} tabindex="0">
                <svg aria-hidden="true"><use href="#i-check"></use></svg>
              </label>
              <span class="lib-glyph" style="--glyph:${type.glyph}" aria-hidden="true"></span>
              <span class="lib-name">
                <strong>${escapeHTML(type.baseName)}</strong>
                <small>${escapeHTML(type.en)}${alias ? ` · ${escapeHTML(alias)}` : ""}</small>
              </span>
              <span class="lib-count">${formatNumber(count)}</span>
              <button class="lib-jump" type="button" data-jump="${type.id}" aria-label="从 ${escapeHTML(type.baseName)} 开始播放" title="从这一类开始播放">
                <svg><use href="#i-jump"></use></svg>
              </button>
            </div>`;
          })
          .join("");
        return `<div class="lib-group">
          <p class="lib-group-title">${escapeHTML(categoryInfo.label)}</p>
          ${rows}
        </div>`;
      })
      .join("");

    els.libraryList.innerHTML = html;
  }

  function toggleType(typeId) {
    if (app.selected.has(typeId)) app.selected.delete(typeId);
    else app.selected.add(typeId);
    if (app.playing) pausePlayback({ silent: true });
    saveState();
    renderLibrary();
    rebuildItems({ keepCurrent: true, silent: true });
  }

  function selectAll(select) {
    if (app.playing) pausePlayback({ silent: true });
    app.selected = new Set(select ? D.BLOCK_TYPES.map((type) => type.id) : []);
    saveState();
    renderLibrary();
    rebuildItems({ keepCurrent: true, silent: true });
    if (!select) toast("已清空方块库；自定义条目仍会保留");
  }

  function jumpToType(typeId) {
    const type = D.getTypeById(typeId);
    if (!type) return;
    const wasSelected = app.selected.has(typeId);
    if (!wasSelected) {
      app.selected.add(typeId);
      saveState();
      renderLibrary();
    }
    if (app.playing) pausePlayback({ silent: true });
    rebuildItems({ keepCurrent: false, silent: true });
    const firstIndex = app.items.findIndex((item) => item.typeId === typeId && !item.isCustom);
    if (firstIndex < 0) {
      toast("这一类暂时没有可播放项");
      return;
    }
    app.index = firstIndex;
    app.finished = false;
    app.playing = true;
    renderCurrent();
    updatePlayUI();
    armAdvance();
    focusStageOnMobile();
    toast(`从「${type.baseName}」开始播放`);
  }

  /* ------------------------------------------------------------------------
     侧栏：自定义
     ------------------------------------------------------------------------ */

  function renderCustomList() {
    els.customCount.textContent = String(app.custom.length);
    if (!app.custom.length) {
      els.customList.innerHTML = `<div class="custom-empty">还没有自定义条目。<br>可以添加模组方块、恶搞方块，或任何想让它闪一下的铜制方块。</div>`;
      return;
    }

    els.customList.innerHTML = app.custom
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((entry) => {
        const item = D.makeCustomItem(entry);
        const chips = [
          D.OXIDATION[item.oxidation].label,
          item.waxed ? "涂蜡" : "未涂蜡",
          ...(entry.extraStates || []),
        ];
        return `<div class="custom-card" data-custom-id="${escapeHTML(entry.id)}">
          <div class="custom-card-head">
            <span class="lib-glyph" style="--glyph:${item.theme.ox}" aria-hidden="true"></span>
            <div class="custom-card-title">
              <strong title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</strong>
              <small title="${escapeHTML(item.mcId)}">${escapeHTML(item.mcId)}</small>
            </div>
            <div class="custom-card-actions">
              <button type="button" data-action="jump" data-custom-id="${escapeHTML(entry.id)}" aria-label="定位到 ${escapeHTML(item.name)}" title="定位并暂停">
                <svg><use href="#i-jump"></use></svg>
              </button>
              <button type="button" data-action="delete" data-custom-id="${escapeHTML(entry.id)}" aria-label="删除 ${escapeHTML(item.name)}" title="删除">
                <svg><use href="#i-trash"></use></svg>
              </button>
            </div>
          </div>
          <div class="custom-card-chips">
            ${chips.map((chip) => `<span>${escapeHTML(chip)}</span>`).join("")}
          </div>
        </div>`;
      })
      .join("");
  }

  function openCustomDialog() {
    if (!els.customDialog) return;
    els.customForm.reset();
    els.customName.setCustomValidity("");
    els.customOx.value = "0";
    els.customWaxed.checked = false;
    els.customIcon.value = "cube";
    if (typeof els.customDialog.showModal === "function") {
      els.customDialog.showModal();
    } else {
      els.customDialog.setAttribute("open", "");
    }
    setTimeout(() => els.customName.focus(), 60);
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function parseExtraStates(value) {
    const seen = new Set();
    return String(value || "")
      .split(/[,，、;；\n]+/)
      .map((part) => part.trim())
      .filter((part) => {
        if (!part || seen.has(part)) return false;
        seen.add(part);
        return true;
      })
      .slice(0, 10);
  }

  function addCustomEntry() {
    const baseName = els.customName.value.trim();
    if (!baseName) {
      els.customName.setCustomValidity("请输入方块名称");
      els.customName.reportValidity();
      els.customName.focus();
      return;
    }
    els.customName.setCustomValidity("");

    const oxidation = Number(els.customOx.value) || 0;
    const waxed = els.customWaxed.checked;
    const extraStates = parseExtraStates(els.customStates.value);
    const icon = els.customIcon.value || "custom";
    const en = els.customEn.value.trim();
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    app.custom.push({
      id,
      baseName: baseName.slice(0, 28),
      oxidation,
      waxed,
      extraStates,
      icon,
      en,
      createdAt: Date.now(),
    });
    const addedEntry = app.custom[app.custom.length - 1];
    const addedName = D.makeCustomItem(addedEntry).name;
    saveState();
    renderCustomList();
    closeDialog(els.customDialog);
    showTab("custom");
    rebuildItems({ keepCurrent: true, silent: true });
    const newIndex = app.items.findIndex((item) => item.uid === `custom:${id}`);
    if (newIndex >= 0) {
      app.playing = false;
      app.finished = false;
      app.index = newIndex;
      renderCurrent();
      updatePlayUI();
      focusStageOnMobile();
    }
    toast(`已添加「${addedName}」`);
  }

  function deleteCustomEntry(id) {
    const entry = app.custom.find((item) => item.id === id);
    if (!entry) return;
    const removedName = D.makeCustomItem(entry).name;
    app.custom = app.custom.filter((item) => item.id !== id);
    saveState();
    renderCustomList();
    if (app.playing) pausePlayback({ silent: true });
    rebuildItems({ keepCurrent: true, silent: true });
    toast(`已删除「${removedName}」`);
  }

  function jumpToCustom(id) {
    if (app.playing) pausePlayback({ silent: true });
    const index = app.items.findIndex((item) => item.uid === `custom:${id}`);
    if (index < 0) {
      toast("该条目尚未加入播放列表");
      return;
    }
    app.playing = false;
    app.finished = false;
    app.index = index;
    renderCurrent();
    updatePlayUI();
    setHint("已暂停 · 空格开始");
    focusStageOnMobile();
    toast("已定位到自定义条目");
  }

  /* ------------------------------------------------------------------------
     侧栏标签
     ------------------------------------------------------------------------ */

  function showTab(name) {
    els.panelTabs.forEach((button) => {
      const active = button.dataset.tab === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    els.panelPanes.forEach((pane) => {
      const active = pane.id === `pane-${name}`;
      pane.classList.toggle("is-active", active);
      pane.hidden = !active;
    });
  }

  /* ------------------------------------------------------------------------
     全屏 / 粒子
     ------------------------------------------------------------------------ */

  function setupParticles() {
    const container = $("#particles");
    if (!container) return;
    const count = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 22;
    const colors = ["#d8874a", "#4fa9a0", "#e8a45f", "#2d8f87", "#b87845"];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("i");
      const size = 1 + Math.round(Math.random() * 3);
      particle.className = "particle";
      particle.style.setProperty("--s", `${size}px`);
      particle.style.setProperty("--t", `${Math.round(Math.random() * 100)}%`);
      particle.style.setProperty("--l", `${Math.round(Math.random() * 100)}%`);
      particle.style.setProperty("--d", `${9 + Math.random() * 14}s`);
      particle.style.setProperty("--delay", `${-Math.random() * 20}s`);
      particle.style.setProperty("--dx", `${-35 + Math.random() * 70}px`);
      particle.style.setProperty("--c", colors[i % colors.length]);
      fragment.appendChild(particle);
    }
    container.appendChild(fragment);
  }

  function updateFullscreenIcon() {
    const icon = $("use", els.fullscreenBtn);
    if (!icon) return;
    icon.setAttribute("href", document.fullscreenElement ? "#i-collapse" : "#i-expand");
    els.fullscreenBtn.setAttribute(
      "aria-label",
      document.fullscreenElement ? "退出全屏" : "进入全屏"
    );
  }

  function toggleFullscreen() {
    const root = document.documentElement;
    if (!document.fullscreenElement) {
      if (root.requestFullscreen) {
        root.requestFullscreen().catch(() => toast("当前环境不允许进入全屏"));
      } else {
        toast("当前浏览器不支持全屏");
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  /* ------------------------------------------------------------------------
     事件绑定
     ------------------------------------------------------------------------ */

  function bindEvents() {
    els.playBtn.addEventListener("click", togglePlayback);
    els.prevBtn.addEventListener("click", () => step(-1));
    els.nextBtn.addEventListener("click", () => step(1));
    els.nextNameBtn.addEventListener("click", () => step(1));
    els.ttsToggle.addEventListener("click", toggleTts);
    els.voiceSelect.addEventListener("change", () => changeVoice(els.voiceSelect.value));
    els.ttsRateSelect.addEventListener("change", () => changeTtsRate(els.ttsRateSelect.value));
    els.loopBtn.addEventListener("click", toggleLoop);
    els.speedRange.addEventListener("input", () => {
      app.duration = Number(els.speedRange.value);
      updateSpeedUI();
      saveState();
      if (app.playing && !(app.tts && speechSupported)) {
        clearAdvanceTimer();
        armAdvance();
      }
    });

    els.helpBtn.addEventListener("click", () => {
      if (typeof els.helpDialog.showModal === "function") els.helpDialog.showModal();
      else els.helpDialog.setAttribute("open", "");
    });
    els.fullscreenBtn.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", updateFullscreenIcon);

    els.panelTabs.forEach((button) => {
      button.addEventListener("click", () => showTab(button.dataset.tab));
    });

    els.searchInput.addEventListener("input", () => {
      app.libraryQuery = els.searchInput.value;
      renderLibrary();
    });
    els.selectAllBtn.addEventListener("click", () => selectAll(true));
    els.clearAllBtn.addEventListener("click", () => selectAll(false));

    els.segments.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.mode;
        if (mode === app.mode) return;
        app.mode = mode;
        saveState();
        updateModeUI();
        if (app.playing) pausePlayback({ silent: true });
        rebuildItems({ keepCurrent: true, silent: true });
        renderLibrary();
      });
    });

    els.libraryList.addEventListener("click", (event) => {
      const jump = event.target.closest("[data-jump]");
      if (jump) {
        event.preventDefault();
        jumpToType(jump.dataset.jump);
        return;
      }
      if (event.target.closest(".lib-check")) return;
      const row = event.target.closest(".lib-item");
      if (!row) return;
      toggleType(row.dataset.typeId);
    });

    els.libraryList.addEventListener("change", (event) => {
      if (!event.target.matches('input[type="checkbox"]')) return;
      const row = event.target.closest(".lib-item");
      if (row) toggleType(row.dataset.typeId);
    });

    els.addCustomBtn.addEventListener("click", openCustomDialog);
    els.customForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addCustomEntry();
    });
    els.customName.addEventListener("input", () => els.customName.setCustomValidity(""));

    els.customList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const id = button.dataset.customId;
      if (button.dataset.action === "delete") deleteCustomEntry(id);
      if (button.dataset.action === "jump") jumpToCustom(id);
    });

    $$("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(button.closest("dialog")));
    });
    [els.customDialog, els.helpDialog].forEach((dialog) => {
      if (!dialog) return;
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    });

    els.resetDataBtn.addEventListener("click", () => {
      if (!window.confirm("确定要重置本机设置和所有自定义条目吗？")) return;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        /* ignore */
      }
      window.location.reload();
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "select" || tag === "textarea") return;
      if (els.customDialog.open || els.helpDialog.open) return;
      if (event.code === "Space" && (tag === "button" || tag === "a")) return;

      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        toggleTts();
      } else if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        toggleLoop();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetToStart();
      }
    });

    window.addEventListener("beforeunload", saveState);
  }

  /* ------------------------------------------------------------------------
     初始化
     ------------------------------------------------------------------------ */

  function init() {
    loadState();
    refreshVoices();
    if (synth) {
      synth.onvoiceschanged = refreshVoices;
    }

    setupParticles();
    updateSpeedUI();
    els.loopBtn.classList.toggle("is-on", app.loop);
    els.loopBtn.setAttribute("aria-checked", String(app.loop));
    updateTtsUI();
    updateModeUI();
    renderLibrary();
    renderCustomList();
    bindEvents();
    rebuildItems({ keepCurrent: false, silent: true });
    updateFullscreenIcon();

    if (!speechSupported) {
      els.ttsToggle.title = "当前浏览器不支持语音合成";
    }

    if (!app.items.length) {
      renderEmptyState();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
