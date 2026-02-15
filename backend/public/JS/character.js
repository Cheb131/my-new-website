/* public/JS/character.js
  FINAL (one-file):
  ✅ Tabs always clickable
  ✅ Edit/Save/Cancel ổn định
  ✅ Editor chuẩn bảng cho: Coins, Equipment, Features, Attacks, Spells
  ✅ Thêm Spellcasting: Ability / Save DC / Attack Bonus (có edit + auto calc)
  ✅ Tính toán: PB, Initiative, Passive Perception/Insight/Investigation, HP (auto)
  ✅ Persist các phần chưa được backend UPDATE (coins/defenses/attacks/spells/features/senses/hpMode/spellcast) qua notes[]

  Notes formats:
    - Coins:   "Coins: CP=0 SP=0 EP=0 GP=0 PP=0"
    - Defenses:"Resist: ..."  "Immune: ..."  "Vuln: ..."
    - Senses:  "Senses: PP=10 PI=10 PINV=10"
    - HP mode: "HPMode: auto" | "HPMode: manual"
    - Spellcast:"Spellcast: abil=wis auto=1 dc=12 atk=+4"
    - Attacks: "Attack: name|abil|prof|dice|addMod|notes|range|comp|duration"
    - Spells:  "Spell: prep|level|name|saveAtk|time|range|comp|duration|notes"
    - Features:"Feature: ..."
*/

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const qs = () => new URLSearchParams(location.search);

  const NOTE_MAX = 240;

  // ====== D&D helpers ======
  const ABILS = ["str", "dex", "con", "int", "wis", "cha"];
  const ABIL_LABEL = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };

  // Skill keys we store (snake_case)
  const SKILLS = {
    acrobatics: "dex",
    animal_handling: "wis",
    arcana: "int",
    athletics: "str",
    deception: "cha",
    history: "int",
    insight: "wis",
    intimidation: "cha",
    investigation: "int",
    medicine: "wis",
    nature: "int",
    perception: "wis",
    performance: "cha",
    persuasion: "cha",
    religion: "int",
    sleight_of_hand: "dex",
    stealth: "dex",
    survival: "wis",
  };

  const SKILL_LABEL = {
    acrobatics: "Acrobatics",
    animal_handling: "Animal Handling",
    arcana: "Arcana",
    athletics: "Athletics",
    deception: "Deception",
    history: "History",
    insight: "Insight",
    intimidation: "Intimidation",
    investigation: "Investigation",
    medicine: "Medicine",
    nature: "Nature",
    perception: "Perception",
    performance: "Performance",
    persuasion: "Persuasion",
    religion: "Religion",
    sleight_of_hand: "Sleight of Hand",
    stealth: "Stealth",
    survival: "Survival",
  };

  // Hit die by class (best-effort). Fallback d8.
  const HIT_DIE = {
    barbarian: 12,
    fighter: 10,
    paladin: 10,
    ranger: 10,
    bard: 8,
    cleric: 8,
    druid: 8,
    monk: 8,
    rogue: 8,
    warlock: 8,
    sorcerer: 6,
    wizard: 6,
    artificer: 8,
  };

  // Spellcasting default by class
  const SPELLCAST_DEFAULT = {
    artificer: "int",
    bard: "cha",
    cleric: "wis",
    druid: "wis",
    paladin: "cha",
    ranger: "wis",
    sorcerer: "cha",
    warlock: "cha",
    wizard: "int",
  };

  const fmt = (n) => (Number(n) >= 0 ? `+${Number(n)}` : `${Number(n)}`);
  const mod = (s) => Math.floor((Number(s || 10) - 10) / 2);
  const clampInt = (n, a, b) => {
    const x = Math.trunc(Number(n));
    if (!Number.isFinite(x)) return a;
    return Math.min(b, Math.max(a, x));
  };
  const pb = (lv) => 2 + Math.floor((clampInt(lv || 1, 1, 20) - 1) / 4);

  // Avg per level beyond 1 in 5e: floor(die/2)+1
  const avgDie = (die) => Math.floor(Number(die || 8) / 2) + 1;

  function classHitDie(className) {
    const key = String(className || "").trim().toLowerCase();
    return HIT_DIE[key] || 8;
  }

  function calcHp({ level, class_name, conScore }) {
    const lv = clampInt(level || 1, 1, 20);
    const die = classHitDie(class_name);
    const conMod = mod(conScore || 10);
    const lv1 = die + conMod;
    const perLv = avgDie(die) + conMod;
    const total = lv1 + Math.max(0, lv - 1) * perLv;
    return Math.max(1, total);
  }

  function calcPassive({ abilityScore, level, isProf }) {
    const base = 10 + mod(abilityScore || 10);
    const add = isProf ? pb(level || 1) : 0;
    return clampInt(base + add, 0, 99);
  }

  function guessSpellcastingAbility(className) {
    const key = String(className || "").trim().toLowerCase();
    return SPELLCAST_DEFAULT[key] || "int";
  }

  // ====== Notes prefixes ======
  const PFX = {
    coins: "Coins:",
    resist: "Resist:",
    immune: "Immune:",
    vuln: "Vuln:",
    senses: "Senses:",
    hpMode: "HPMode:",
    spellcast: "Spellcast:",
    attack: "Attack:",
    spell: "Spell:",
    feature: "Feature:",
  };

  function safeArr(v) {
    return Array.isArray(v) ? v : [];
  }

  function splitToMax(line, maxLen = NOTE_MAX) {
    const s = String(line ?? "");
    if (s.length <= maxLen) return [s];
    const out = [];
    for (let i = 0; i < s.length; i += maxLen) out.push(s.slice(i, i + maxLen));
    return out;
  }

  // For structured lines, keep 1 line by truncating tail
  function fitStructured(line, maxLen = NOTE_MAX) {
    const s = String(line ?? "");
    if (s.length <= maxLen) return s;
    if (maxLen <= 1) return s.slice(0, maxLen);
    return s.slice(0, maxLen - 1) + "…";
  }

  function normSkillKey(k) {
    return String(k || "").trim().toLowerCase();
  }

  // ====== Coins ======
  function parseCoinsLine(line) {
    const s = String(line || "");
    const get = (sym) => {
      const m = new RegExp(`${sym}\\s*=\\s*(\\d+)`, "i").exec(s);
      return m ? clampInt(m[1], 0, 999999) : 0;
    };
    return { cp: get("CP"), sp: get("SP"), ep: get("EP"), gp: get("GP"), pp: get("PP") };
  }

  function coinsToLine(coins) {
    const c = coins || {};
    return `${PFX.coins} CP=${clampInt(c.cp || 0, 0, 999999)} SP=${clampInt(c.sp || 0, 0, 999999)} EP=${clampInt(
      c.ep || 0,
      0,
      999999
    )} GP=${clampInt(c.gp || 0, 0, 999999)} PP=${clampInt(c.pp || 0, 0, 999999)}`;
  }

  // ====== Defenses ======
  function parseListLine(line, prefix) {
    const s = String(line || "");
    if (!s.toLowerCase().startsWith(prefix.toLowerCase())) return [];
    const rest = s.slice(prefix.length).trim();
    if (!rest) return [];
    return rest
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function listToLine(prefix, arr) {
    const a = safeArr(arr)
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    return `${prefix} ${a.join(", ")}`.trim();
  }

  // ====== Senses ======
  function parseSensesLine(line) {
    const s = String(line || "");
    const get = (key) => {
      const m = new RegExp(`${key}\\s*=\\s*(\\d+)`, "i").exec(s);
      return m ? clampInt(m[1], 0, 99) : null;
    };
    const ppv = get("PP");
    const piv = get("PI");
    const pinv = get("PINV");
    const out = {};
    if (ppv !== null) out.passivePerception = ppv;
    if (piv !== null) out.passiveInsight = piv;
    if (pinv !== null) out.passiveInvestigation = pinv;
    return out;
  }

  function sensesToLine(senses) {
    const s = senses || {};
    const ppv = clampInt(s.passivePerception ?? 0, 0, 99);
    const piv = clampInt(s.passiveInsight ?? 0, 0, 99);
    const pinv = clampInt(s.passiveInvestigation ?? 0, 0, 99);
    return `${PFX.senses} PP=${ppv} PI=${piv} PINV=${pinv}`;
  }

  // ====== HP mode ======
  function parseHpMode(line) {
    const s = String(line || "").trim().toLowerCase();
    if (!s.startsWith(PFX.hpMode.toLowerCase())) return null;
    const v = s.slice(PFX.hpMode.length).trim();
    if (v.includes("auto")) return "auto";
    if (v.includes("manual")) return "manual";
    return null;
  }

  function hpModeToLine(mode) {
    const m = mode === "manual" ? "manual" : "auto";
    return `${PFX.hpMode} ${m}`;
  }

  // ====== Spellcasting block ======
  function parseSpellcastLine(line) {
    const s = String(line || "").trim();
    if (!s.toLowerCase().startsWith(PFX.spellcast.toLowerCase())) return null;
    const body = s.slice(PFX.spellcast.length).trim();

    const abil = /abil\s*=\s*(str|dex|con|int|wis|cha)/i.exec(body);
    const auto = /auto\s*=\s*(0|1|true|false)/i.exec(body);
    const dc = /dc\s*=\s*([+-]?\d+)/i.exec(body);
    const atk = /atk\s*=\s*([+-]?\d+)/i.exec(body);

    return {
      ability: abil ? abil[1].toLowerCase() : null,
      auto: auto ? !(auto[1].toLowerCase() === "0" || auto[1].toLowerCase() === "false") : null,
      dc: dc ? Number(dc[1]) : null,
      atk: atk ? Number(atk[1]) : null,
    };
  }

  function spellcastToLine(sc) {
    const ability = ABILS.includes(sc?.ability) ? sc.ability : "int";
    const auto = sc?.auto ? 1 : 0;
    const dc = clampInt(sc?.dc ?? 0, 0, 99);
    const atk = clampInt(sc?.atk ?? 0, -30, 30);
    return fitStructured(`${PFX.spellcast} abil=${ability} auto=${auto} dc=${dc} atk=${atk >= 0 ? "+" + atk : atk}`);
  }

  // ====== Attack/Spell lines (pipe-separated) ======
  function escapePipe(s) {
    return String(s ?? "").replaceAll("|", "\\|");
  }
  function unescapePipe(s) {
    return String(s ?? "").replaceAll("\\|", "|");
  }

  function splitPipes(line) {
    const s = String(line || "");
    const out = [];
    let cur = "";
    let esc = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (esc) {
        cur += ch;
        esc = false;
        continue;
      }
      if (ch === "\\") {
        esc = true;
        cur += ch;
        continue;
      }
      if (ch === "|") {
        out.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out;
  }

  function parseAttackLine(line) {
    const s = String(line || "");
    if (!s.toLowerCase().startsWith(PFX.attack.toLowerCase())) return null;
    const raw = s.slice(PFX.attack.length).trim();
    const parts = splitPipes(raw).map(unescapePipe);
    const [name, abil, prof, dice, addMod, notes, range, comp, duration] = parts;
    const a = {
      name: String(name || "").trim(),
      ability: ABILS.includes(String(abil || "").trim().toLowerCase()) ? String(abil).trim().toLowerCase() : "str",
      prof: String(prof || "").trim() === "1" || String(prof || "").trim().toLowerCase() === "true",
      dice: String(dice || "").trim(),
      addMod: String(addMod || "").trim() === "1" || String(addMod || "").trim().toLowerCase() === "true",
      notes: String(notes || "").trim(),
      range: String(range || "").trim(),
      comp: String(comp || "").trim(),
      duration: String(duration || "").trim(),
    };
    if (!a.name) a.name = "Attack";
    if (!a.dice) a.dice = "1d6";
    return a;
  }

  function attackToLine(a) {
    const x = a || {};
    const line = `${PFX.attack} ${escapePipe(x.name || "")}|${escapePipe(x.ability || "str")}|${x.prof ? "1" : "0"}|${escapePipe(
      x.dice || ""
    )}|${x.addMod ? "1" : "0"}|${escapePipe(x.notes || "")}|${escapePipe(x.range || "")}|${escapePipe(
      x.comp || ""
    )}|${escapePipe(x.duration || "")}`;
    return fitStructured(line);
  }

  function parseSpellLine(line) {
    const s = String(line || "");
    if (!s.toLowerCase().startsWith(PFX.spell.toLowerCase())) return null;
    const raw = s.slice(PFX.spell.length).trim();
    const parts = splitPipes(raw).map(unescapePipe);
    const [prep, level, name, saveAtk, time, range, comp, duration, notes] = parts;
    const sp = {
      prep: String(prep || "").trim() === "1" || String(prep || "").trim().toLowerCase() === "true",
      level: clampInt(level || 0, 0, 9),
      name: String(name || "").trim(),
      saveAtk: String(saveAtk || "").trim(),
      time: String(time || "").trim(),
      range: String(range || "").trim(),
      comp: String(comp || "").trim(),
      duration: String(duration || "").trim(),
      notes: String(notes || "").trim(),
    };
    if (!sp.name) sp.name = "Spell";
    return sp;
  }

  function spellToLine(sp) {
    const x = sp || {};
    // prep|level|name|saveAtk|time|range|comp|duration|notes
    const line = `${PFX.spell} ${x.prep ? "1" : "0"}|${clampInt(x.level ?? 0, 0, 9)}|${escapePipe(x.name || "")}|${escapePipe(
      x.saveAtk || ""
    )}|${escapePipe(x.time || "")}|${escapePipe(x.range || "")}|${escapePipe(x.comp || "")}|${escapePipe(
      x.duration || ""
    )}|${escapePipe(x.notes || "")}`;
    return fitStructured(line);
  }

  function parseFeatureLine(line) {
    const s = String(line || "");
    if (!s.toLowerCase().startsWith(PFX.feature.toLowerCase())) return null;
    return s.slice(PFX.feature.length).trim();
  }

  function featureToLine(text) {
    return fitStructured(`${PFX.feature} ${String(text || "").trim()}`);
  }

  // ====== UI State ======
  let ID = null;
  let CHAR = null;
  let VIEW_PUBLIC = false;
  let EDIT = false;
  let ORIG_SNAPSHOT = null;

  // Derived & editable sections
  let COINS = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  let DEF = { resistances: [], immunities: [], vulnerabilities: [] };
  let HP_MODE = "auto"; // auto | manual
  let SPELLCAST = { ability: "int", auto: true, dc: 0, atk: 0 };

  let ATTACKS = [];
  let SPELLS = [];
  let FEATURES = [];
  let REM_NOTES = [];

  // ====== Small style injection ======
  function injectEditorStyles() {
    if (document.getElementById("chEditorStyles")) return;
    const st = document.createElement("style");
    st.id = "chEditorStyles";
    st.textContent = `
      .ch-table input, .ch-table select { width:100%; box-sizing:border-box; }
      .ch-table .cell-actions{ display:flex; gap:8px; align-items:center; justify-content:flex-end; }
      .ch-table .tiny{ width:78px; }
      .ch-table .xs{ width:56px; }
      .ch-inlineToggle{ display:flex; align-items:center; gap:8px; margin-top:6px; opacity:.9; }
      .ch-inlineToggle input{ width:auto !important; }
    `;
    document.head.appendChild(st);
  }

  // ====== Messaging ======
  function toast(msg, danger = false) {
    const box = $("msgBox");
    if (!box) {
      alert(msg);
      return;
    }
    box.style.display = "block";
    box.textContent = msg;
    box.style.borderColor = danger ? "rgba(255,80,80,.35)" : "rgba(212,160,23,.28)";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      box.style.display = "none";
    }, 2200);
  }

  // ====== Tabs ======
  function initTabs() {
    const tabs = document.querySelectorAll(".ch-tab");
    const panels = document.querySelectorAll(".ch-panel");
    if (!tabs.length || !panels.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.tab;
        if (!name) return;
        tabs.forEach((t) => t.classList.remove("is-active"));
        panels.forEach((p) => p.classList.remove("ch-panel--active"));
        tab.classList.add("is-active");
        const target = document.querySelector(`.ch-panel[data-panel="${name}"]`);
        if (target) target.classList.add("ch-panel--active");
      });
    });
  }

  // ====== Normalize + parse ======
  function normalizeChar(raw) {
    const c = raw || {};
    c.level = clampInt(c.level ?? 1, 1, 20);
    c.hp = clampInt(c.hp ?? 10, 1, 999);
    c.ac = clampInt(c.ac ?? 10, 1, 40);
    c.speed = String(c.speed ?? "30 ft");

    c.stats = c.stats && typeof c.stats === "object" ? c.stats : {
      str: Number(c.str ?? 10),
      dex: Number(c.dex ?? 10),
      con: Number(c.con ?? 10),
      int: Number(c.int ?? 10),
      wis: Number(c.wis ?? 10),
      cha: Number(c.cha ?? 10),
    };

    ABILS.forEach((k) => {
      c.stats[k] = clampInt(c.stats[k] ?? 10, 1, 30);
    });

    c.skills = safeArr(c.skills).map((x) => String(x || "").trim()).filter(Boolean);
    c.equipment = safeArr(c.equipment).map((x) => String(x || "").trim()).filter(Boolean);
    c.notes = safeArr(c.notes).map((x) => String(x || "").trim()).filter(Boolean);
    return c;
  }

  function parseSectionsFromNotes(notes) {
    const n = safeArr(notes);

    // Coins
    const coinsLine = n.find((x) => String(x).toLowerCase().startsWith(PFX.coins.toLowerCase())) || "";
    COINS = coinsLine ? parseCoinsLine(coinsLine) : { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

    // Defenses
    const rLine = n.find((x) => String(x).toLowerCase().startsWith(PFX.resist.toLowerCase())) || "";
    const iLine = n.find((x) => String(x).toLowerCase().startsWith(PFX.immune.toLowerCase())) || "";
    const vLine = n.find((x) => String(x).toLowerCase().startsWith(PFX.vuln.toLowerCase())) || "";
    DEF = {
      resistances: rLine ? parseListLine(rLine, PFX.resist) : safeArr(CHAR?.resistances),
      immunities: iLine ? parseListLine(iLine, PFX.immune) : safeArr(CHAR?.immunities),
      vulnerabilities: vLine ? parseListLine(vLine, PFX.vuln) : safeArr(CHAR?.vulnerabilities),
    };

    // Senses + HP mode
    const sensesLine = n.find((x) => String(x).toLowerCase().startsWith(PFX.senses.toLowerCase())) || "";
    const hpModeLine = n.find((x) => String(x).toLowerCase().startsWith(PFX.hpMode.toLowerCase())) || "";

    const defaultSenses = { passivePerception: 0, passiveInsight: 0, passiveInvestigation: 0 };
    const fromServer = CHAR?.senses && typeof CHAR.senses === "object" ? CHAR.senses : defaultSenses;
    const fromNotes = sensesLine ? parseSensesLine(sensesLine) : {};
    CHAR.senses = { ...defaultSenses, ...fromServer, ...fromNotes };

    const hm = hpModeLine ? parseHpMode(hpModeLine) : null;
    HP_MODE = hm || "auto";

    // Spellcasting
    const scLine = n.find((x) => String(x).toLowerCase().startsWith(PFX.spellcast.toLowerCase())) || "";
    const parsedSc = scLine ? parseSpellcastLine(scLine) : null;
    const guessed = guessSpellcastingAbility(CHAR?.class_name);
    SPELLCAST = {
      ability: ABILS.includes(parsedSc?.ability) ? parsedSc.ability : guessed,
      auto: typeof parsedSc?.auto === "boolean" ? parsedSc.auto : true,
      dc: Number.isFinite(parsedSc?.dc) ? parsedSc.dc : 0,
      atk: Number.isFinite(parsedSc?.atk) ? parsedSc.atk : 0,
    };

    // Attacks
    ATTACKS = n
      .filter((x) => String(x).toLowerCase().startsWith(PFX.attack.toLowerCase()))
      .map(parseAttackLine)
      .filter(Boolean);

    // Spells
    SPELLS = n
      .filter((x) => String(x).toLowerCase().startsWith(PFX.spell.toLowerCase()))
      .map(parseSpellLine)
      .filter(Boolean);

    // Features
    const fromFeatureNotes = n
      .filter((x) => String(x).toLowerCase().startsWith(PFX.feature.toLowerCase()))
      .map(parseFeatureLine)
      .filter(Boolean);

    const serverFeatures = safeArr(CHAR?.feature_lines).map((x) => String(x || "").trim()).filter(Boolean);
    FEATURES = fromFeatureNotes.length ? fromFeatureNotes : serverFeatures;

    // Remaining notes
    const isReserved = (line) => {
      const s = String(line || "").toLowerCase();
      return (
        s.startsWith(PFX.coins.toLowerCase()) ||
        s.startsWith(PFX.resist.toLowerCase()) ||
        s.startsWith(PFX.immune.toLowerCase()) ||
        s.startsWith(PFX.vuln.toLowerCase()) ||
        s.startsWith(PFX.senses.toLowerCase()) ||
        s.startsWith(PFX.hpMode.toLowerCase()) ||
        s.startsWith(PFX.spellcast.toLowerCase()) ||
        s.startsWith(PFX.attack.toLowerCase()) ||
        s.startsWith(PFX.spell.toLowerCase()) ||
        s.startsWith(PFX.feature.toLowerCase())
      );
    };
    REM_NOTES = n.filter((x) => !isReserved(x));
  }

  function buildNotesForSave() {
    const out = [];

    out.push(fitStructured(coinsToLine(COINS)));

    out.push(fitStructured(listToLine(PFX.resist, DEF.resistances)));
    out.push(fitStructured(listToLine(PFX.immune, DEF.immunities)));
    out.push(fitStructured(listToLine(PFX.vuln, DEF.vulnerabilities)));

    out.push(fitStructured(sensesToLine(CHAR.senses || {})));
    out.push(fitStructured(hpModeToLine(HP_MODE)));

    out.push(fitStructured(spellcastToLine(SPELLCAST)));

    ATTACKS.forEach((a) => out.push(attackToLine(a)));
    SPELLS.forEach((s) => out.push(spellToLine(s)));

    FEATURES.forEach((f) => {
      const t = String(f || "").trim();
      if (!t) return;
      out.push(featureToLine(t));
    });

    safeArr(REM_NOTES)
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .flatMap((line) => splitToMax(line, NOTE_MAX))
      .forEach((line) => {
        const t = String(line || "").trim();
        if (t) out.push(t);
      });

    return out.map((line) => {
      const s = String(line || "");
      if (s.length <= NOTE_MAX) return s;
      return fitStructured(s);
    });
  }

  // ====== skill/save sets ======
  function getSkillProfSet() {
    const set = new Set();
    safeArr(CHAR?.skills).forEach((s) => {
      const k = normSkillKey(s);
      if (!k) return;
      if (k.startsWith("save:")) return;
      set.add(k);
    });
    return set;
  }

  function getSaveProfSet() {
    const set = new Set();
    safeArr(CHAR?.skills).forEach((s) => {
      const k = normSkillKey(s);
      if (k.startsWith("save:")) set.add(k.slice("save:".length));
    });
    return set;
  }

  function setSkillAndSaveSets(skillSet, saveSet) {
    const skills = [];
    Array.from(skillSet).forEach((k) => {
      if (k && !k.startsWith("save:")) skills.push(k);
    });
    Array.from(saveSet).forEach((k) => {
      if (k && ABILS.includes(k)) skills.push(`save:${k}`);
    });
    CHAR.skills = skills;
  }

  // ====== computed updates ======
  function updateComputed() {
    if (!CHAR) return;

    // PB + Init
    const pbVal = pb(CHAR.level);
    const initVal = mod(CHAR.stats.dex);
    if ($("ch_pb")) $("ch_pb").textContent = fmt(pbVal);
    if ($("q_pb")) $("q_pb").textContent = fmt(pbVal);
    if ($("ch_init")) $("ch_init").textContent = fmt(initVal);
    if ($("combatInit")) $("combatInit").textContent = fmt(initVal);

    // Passive
    const skillSet = getSkillProfSet();
    const lvl = CHAR.level;
    const ppv = calcPassive({ abilityScore: CHAR.stats.wis, level: lvl, isProf: skillSet.has("perception") });
    const piv = calcPassive({ abilityScore: CHAR.stats.wis, level: lvl, isProf: skillSet.has("insight") });
    const pinv = calcPassive({ abilityScore: CHAR.stats.int, level: lvl, isProf: skillSet.has("investigation") });
    CHAR.senses = { passivePerception: ppv, passiveInsight: piv, passiveInvestigation: pinv };

    if ($("inp_pa_perception")) $("inp_pa_perception").value = String(ppv);
    if ($("inp_pa_insight")) $("inp_pa_insight").value = String(piv);
    if ($("inp_pa_investigation")) $("inp_pa_investigation").value = String(pinv);

    // Auto HP
    if (HP_MODE === "auto") {
      CHAR.hp = clampInt(calcHp({ level: CHAR.level, class_name: CHAR.class_name, conScore: CHAR.stats.con }), 1, 999);
      if ($("inp_hp")) $("inp_hp").value = String(CHAR.hp);
      if ($("q_hp")) $("q_hp").textContent = String(CHAR.hp);
    }

    // Spellcasting auto
    if (!SPELLCAST || typeof SPELLCAST !== "object") {
      SPELLCAST = { ability: guessSpellcastingAbility(CHAR.class_name), auto: true, dc: 0, atk: 0 };
    }
    if (!ABILS.includes(SPELLCAST.ability)) SPELLCAST.ability = guessSpellcastingAbility(CHAR.class_name);

    if (SPELLCAST.auto) {
      const abilityMod = mod(CHAR.stats[SPELLCAST.ability] ?? 10);
      SPELLCAST.atk = abilityMod + pbVal;
      SPELLCAST.dc = 8 + abilityMod + pbVal;
    } else {
      SPELLCAST.dc = clampInt(SPELLCAST.dc ?? 0, 0, 99);
      SPELLCAST.atk = clampInt(SPELLCAST.atk ?? 0, -30, 30);
    }

    // If UI exists, refresh it
    const dcEl = $("sc_dc");
    const atkEl = $("sc_atk");
    const abilEl = $("sc_abil");
    const autoEl = $("sc_auto");
    if (abilEl) abilEl.value = SPELLCAST.ability;
    if (autoEl) autoEl.checked = !!SPELLCAST.auto;
    if (dcEl) dcEl.value = String(SPELLCAST.dc ?? 0);
    if (atkEl) atkEl.value = String(SPELLCAST.atk ?? 0);
  }

  // ====== render ======
  function renderHero() {
    if (!CHAR) return;

    if ($("ch_name")) $("ch_name").textContent = CHAR.name || "—";
    if ($("ch_subline"))
      $("ch_subline").textContent = `${CHAR.race || "—"} • ${CHAR.class_name || "—"} • Level ${CHAR.level || 1}`;

    if ($("ch_publicBadge")) $("ch_publicBadge").style.display = CHAR.is_public ? "inline-flex" : "none";

    const avatarImg = $("avatarImg");
    if (avatarImg) {
      const av = String(CHAR.avatar || "").trim();
      if (av && /^(https?:)?\/\//i.test(av)) {
        avatarImg.innerHTML = `<img alt="avatar" src="${av}" style="width:100%;height:100%;object-fit:cover;border-radius:999px;"/>`;
      } else {
        avatarImg.textContent = av || "🧙";
      }
    }

    const tags = $("ch_tags");
    if (tags) {
      tags.innerHTML = "";
      const addTag = (t) => {
        const span = document.createElement("span");
        span.className = "ch-tag";
        span.textContent = t;
        tags.appendChild(span);
      };
      addTag(`PB ${fmt(pb(CHAR.level))}`);
      addTag(`Init ${fmt(mod(CHAR.stats.dex))}`);
      addTag(`HP ${CHAR.hp}`);
      if (SPELLCAST?.ability) addTag(`Spell ${ABIL_LABEL[SPELLCAST.ability]} DC ${SPELLCAST.dc}`);
    }

    if ($("q_ac")) $("q_ac").textContent = String(CHAR.ac ?? 10);
    if ($("q_hp")) $("q_hp").textContent = String(CHAR.hp ?? 10);
    if ($("q_speed")) $("q_speed").textContent = String(CHAR.speed ?? "30 ft");
  }

  function renderOverview() {
    if (!CHAR) return;
    const bindVal = (id, val) => {
      const el = $(id);
      if (!el) return;
      el.value = val;
    };

    bindVal("inp_name", CHAR.name || "");
    bindVal("inp_race", CHAR.race || "");
    bindVal("inp_class", CHAR.class_name || "");
    bindVal("inp_level", String(CHAR.level || 1));
    bindVal("inp_alignment", CHAR.alignment || "");
    bindVal("inp_background", CHAR.background || "");
    bindVal("inp_description", CHAR.description || "");

    bindVal("inp_pa_perception", String(clampInt(CHAR.senses?.passivePerception ?? 0, 0, 99)));
    bindVal("inp_pa_insight", String(clampInt(CHAR.senses?.passiveInsight ?? 0, 0, 99)));
    bindVal("inp_pa_investigation", String(clampInt(CHAR.senses?.passiveInvestigation ?? 0, 0, 99)));
  }

  function renderModsBox() {
    const box = $("modsBox");
    if (!box || !CHAR) return;
    box.innerHTML = ABILS.map((k) => `<div class="ch-mod">${ABIL_LABEL[k]} ${fmt(mod(CHAR.stats[k]))}</div>`).join("");
  }

  function renderAbilities() {
    const grid = $("abilitiesGrid");
    if (!grid || !CHAR) return;

    grid.innerHTML = ABILS.map((k) => {
      const score = CHAR.stats[k];
      return `
        <div class="ch-abil">
          <div class="ch-abil__label">${ABIL_LABEL[k]}</div>
          <input id="stat_${k}" type="number" min="1" max="30" value="${score}" ${EDIT ? "" : "disabled"} />
          <div class="ch-abil__mod" id="mod_${k}">${fmt(mod(score))}</div>
        </div>
      `;
    }).join("");

    ABILS.forEach((k) => {
      const el = $("stat_" + k);
      if (!el) return;
      el.oninput = () => {
        CHAR.stats[k] = clampInt(el.value || 10, 1, 30);
        const mEl = $("mod_" + k);
        if (mEl) mEl.textContent = fmt(mod(CHAR.stats[k]));
        updateComputed();
        renderSavesAndSkills();
        renderModsBox();
        renderAttacks();
        renderSpellcastRow();
      };
    });
  }

  function renderSavesAndSkills() {
    const savingList = $("savingList");
    const skillsList = $("skillsList");
    if (!savingList || !skillsList || !CHAR) return;

    const pbVal = pb(CHAR.level);
    const saveSet = getSaveProfSet();
    const skillSet = getSkillProfSet();

    savingList.innerHTML = ABILS.map((k) => {
      const base = mod(CHAR.stats[k]);
      const total = base + (saveSet.has(k) ? pbVal : 0);
      return `
        <label class="ch-list__item" style="display:flex;align-items:center;gap:10px;">
          <input class="prof-box" type="checkbox" data-save="${k}" ${saveSet.has(k) ? "checked" : ""} ${EDIT ? "" : "disabled"} />
          <span style="flex:1;">${ABIL_LABEL[k]}</span>
          <strong>${fmt(total)}</strong>
        </label>
      `;
    }).join("");

    skillsList.innerHTML = Object.keys(SKILLS).map((key) => {
      const abil = SKILLS[key];
      const base = mod(CHAR.stats[abil]);
      const total = base + (skillSet.has(key) ? pbVal : 0);
      return `
        <label class="ch-list__item" style="display:flex;align-items:center;gap:10px;">
          <input class="prof-box" type="checkbox" data-skill="${key}" ${skillSet.has(key) ? "checked" : ""} ${EDIT ? "" : "disabled"} />
          <span style="flex:1;">${SKILL_LABEL[key] || key}</span>
          <small style="opacity:.7;">${ABIL_LABEL[abil]}</small>
          <strong>${fmt(total)}</strong>
        </label>
      `;
    }).join("");

    savingList.querySelectorAll("[data-save]").forEach((cb) => {
      cb.onchange = () => {
        const k = normSkillKey(cb.dataset.save);
        const nextSave = getSaveProfSet();
        if (cb.checked) nextSave.add(k);
        else nextSave.delete(k);
        setSkillAndSaveSets(getSkillProfSet(), nextSave);
        updateComputed();
        renderSavesAndSkills();
      };
    });

    skillsList.querySelectorAll("[data-skill]").forEach((cb) => {
      cb.onchange = () => {
        const k = normSkillKey(cb.dataset.skill);
        const nextSkill = getSkillProfSet();
        if (cb.checked) nextSkill.add(k);
        else nextSkill.delete(k);
        setSkillAndSaveSets(nextSkill, getSaveProfSet());
        updateComputed();
        renderSavesAndSkills();
        renderSpellcastRow();
      };
    });
  }

  function renderCombat() {
    if (!CHAR) return;

    if ($("inp_ac")) $("inp_ac").value = String(CHAR.ac ?? 10);
    if ($("inp_hp")) $("inp_hp").value = String(CHAR.hp ?? 10);
    if ($("inp_speed")) $("inp_speed").value = String(CHAR.speed ?? "30 ft");

    // HP mode toggle under HP input
    const hpPill = $("inp_hp")?.closest(".ch-pill");
    if (hpPill && !hpPill.querySelector("#hpModeToggle")) {
      const wrap = document.createElement("div");
      wrap.className = "ch-inlineToggle";
      wrap.innerHTML = `
        <label style="display:inline-flex;align-items:center;gap:8px;">
          <input id="hpModeToggle" type="checkbox" />
          <span>Auto HP (tính theo class + CON + level)</span>
        </label>
      `;
      hpPill.appendChild(wrap);
    }

    const hpModeToggle = $("hpModeToggle");
    if (hpModeToggle) {
      hpModeToggle.checked = HP_MODE === "auto";
      hpModeToggle.disabled = !EDIT;
      hpModeToggle.onchange = () => {
        HP_MODE = hpModeToggle.checked ? "auto" : "manual";
        updateComputed();
        renderCombat();
        renderHero();
      };
    }

    if ($("inp_hp")) $("inp_hp").disabled = !EDIT || HP_MODE === "auto";
    if ($("inp_ac")) $("inp_ac").disabled = !EDIT;
    if ($("inp_speed")) $("inp_speed").disabled = !EDIT;

    if ($("inp_ac")) {
      $("inp_ac").oninput = () => {
        CHAR.ac = clampInt($("inp_ac").value || 10, 0, 40);
        if ($("q_ac")) $("q_ac").textContent = String(CHAR.ac);
      };
    }

    if ($("inp_hp")) {
      $("inp_hp").oninput = () => {
        if (HP_MODE !== "manual") return;
        CHAR.hp = clampInt($("inp_hp").value || 10, 1, 999);
        if ($("q_hp")) $("q_hp").textContent = String(CHAR.hp);
        renderHero();
      };
    }

    if ($("inp_speed")) {
      $("inp_speed").oninput = () => {
        CHAR.speed = String($("inp_speed").value || "");
        if ($("q_speed")) $("q_speed").textContent = String(CHAR.speed || "—");
      };
    }
  }

  function renderDefenses() {
    const setChips = (box, arr) => {
      if (!box) return;
      const a = safeArr(arr).map((x) => String(x || "").trim()).filter(Boolean);
      box.innerHTML = a.length ? a.map((t) => `<span class="ch-chip">${t}</span>`).join("") : `<span class="ch-chip">—</span>`;
    };

    const boxRes = $("chips_res");
    const boxImm = $("chips_imm");
    const boxVul = $("chips_vul");

    if (!EDIT) {
      setChips(boxRes, DEF.resistances);
      setChips(boxImm, DEF.immunities);
      setChips(boxVul, DEF.vulnerabilities);
      return;
    }

    const renderInput = (box, key, label) => {
      if (!box) return;
      const val = safeArr(DEF[key]).join(", ");
      box.innerHTML = `<input class="def-edit" type="text" data-def="${key}" placeholder="${label} (comma separated)" value="${val.replaceAll(
        '"',
        "&quot;"
      )}" ${EDIT ? "" : "disabled"} />`;
      const inp = box.querySelector("input");
      if (inp) {
        inp.oninput = () => {
          DEF[key] = String(inp.value || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
        };
      }
    };

    renderInput(boxRes, "resistances", "Resistances");
    renderInput(boxImm, "immunities", "Immunities");
    renderInput(boxVul, "vulnerabilities", "Vulnerabilities");
  }

  // ====== Spellcasting row ======
  function ensureSpellcastRow() {
    const panel = document.querySelector('.ch-panel[data-panel="spells"]');
    if (!panel) return;

    let row = panel.querySelector("#spellcastRow");
    if (row) return;

    row = document.createElement("div");
    row.className = "ch-combatRow";
    row.id = "spellcastRow";

    row.innerHTML = `
      <div class="ch-pill">
        <div class="ch-pill__label">Spellcasting Ability</div>
        <select id="sc_abil"></select>
      </div>
      <div class="ch-pill">
        <div class="ch-pill__label">Spell Save DC</div>
        <input id="sc_dc" type="number" min="0" max="99" />
        <div class="ch-inlineToggle" id="sc_autoWrap" style="margin-top:8px;">
          <label style="display:inline-flex;align-items:center;gap:8px;">
            <input id="sc_auto" type="checkbox" />
            <span>Auto calc (8 + PB + mod / PB + mod)</span>
          </label>
        </div>
      </div>
      <div class="ch-pill">
        <div class="ch-pill__label">Spell Attack Bonus</div>
        <input id="sc_atk" type="number" min="-30" max="30" />
      </div>
    `;

    const tableWrap = panel.querySelector(".ch-tableWrap");
    if (tableWrap) panel.insertBefore(row, tableWrap);
    else panel.appendChild(row);

    // Fill ability select options
    const sel = row.querySelector("#sc_abil");
    if (sel) {
      sel.innerHTML = ABILS.map((k) => `<option value="${k}">${ABIL_LABEL[k]}</option>`).join("");
    }
  }

  function renderSpellcastRow() {
    ensureSpellcastRow();

    const abilEl = $("sc_abil");
    const dcEl = $("sc_dc");
    const atkEl = $("sc_atk");
    const autoEl = $("sc_auto");
    const autoWrap = $("sc_autoWrap");

    if (!abilEl || !dcEl || !atkEl || !autoEl || !autoWrap) return;

    abilEl.value = SPELLCAST.ability;
    autoEl.checked = !!SPELLCAST.auto;

    abilEl.disabled = !EDIT;
    autoEl.disabled = !EDIT;

    if (!EDIT) {
      autoWrap.style.display = "none";
    } else {
      autoWrap.style.display = "";
    }

    // In auto, show computed values and lock dc/atk
    dcEl.value = String(clampInt(SPELLCAST.dc ?? 0, 0, 99));
    atkEl.value = String(clampInt(SPELLCAST.atk ?? 0, -30, 30));

    dcEl.disabled = !EDIT || SPELLCAST.auto;
    atkEl.disabled = !EDIT || SPELLCAST.auto;

    // events
    abilEl.onchange = () => {
      SPELLCAST.ability = abilEl.value;
      updateComputed();
      renderSpellcastRow();
      renderHero();
    };

    autoEl.onchange = () => {
      SPELLCAST.auto = !!autoEl.checked;
      updateComputed();
      renderSpellcastRow();
      renderHero();
    };

    dcEl.oninput = () => {
      if (SPELLCAST.auto) return;
      SPELLCAST.dc = clampInt(dcEl.value || 0, 0, 99);
      renderHero();
    };

    atkEl.oninput = () => {
      if (SPELLCAST.auto) return;
      SPELLCAST.atk = clampInt(atkEl.value || 0, -30, 30);
      renderHero();
    };
  }

  // ====== Attacks ======
  function attackHit(a) {
    const pbVal = pb(CHAR.level);
    const abil = ABILS.includes(a.ability) ? a.ability : "str";
    return mod(CHAR.stats[abil]) + (a.prof ? pbVal : 0);
  }
  function attackDmg(a) {
    const abil = ABILS.includes(a.ability) ? a.ability : "str";
    const extra = a.addMod ? mod(CHAR.stats[abil]) : 0;
    const dice = String(a.dice || "").trim();
    if (!dice) return extra ? fmt(extra) : "";
    return extra ? `${dice} ${fmt(extra)}` : dice;
  }

  function renderAttacks() {
    const tbody = $("attacksTbody");
    if (!tbody || !CHAR) return;
    injectEditorStyles();

    tbody.innerHTML = ATTACKS.map((a, i) => {
      if (!EDIT) {
        return `
          <tr>
            <td class="t-xs">${a.name || ""}</td>
            <td class="t-xs"><strong>${fmt(attackHit(a))}</strong></td>
            <td class="t-sm">${attackDmg(a)}</td>
            <td class="t-sm">${a.notes || ""}</td>
            <td class="t-sm">${a.range || ""}</td>
            <td class="t-sm">${a.comp || ""}</td>
            <td class="t-sm">${a.duration || ""}</td>
            <td></td>
          </tr>
        `;
      }

      const esc = (s) => String(s || "").replaceAll('"', "&quot;");

      return `
        <tr>
          <td><input id="atk_name_${i}" type="text" value="${esc(a.name)}" /></td>
          <td><strong>${fmt(attackHit(a))}</strong></td>
          <td><input id="atk_dice_${i}" type="text" value="${esc(a.dice)}" placeholder="1d8 slashing" /></td>
          <td><input id="atk_notes_${i}" type="text" value="${esc(a.notes)}" /></td>
          <td><input id="atk_range_${i}" type="text" value="${esc(a.range)}" /></td>
          <td><input id="atk_comp_${i}" type="text" value="${esc(a.comp)}" /></td>
          <td><input id="atk_dur_${i}" type="text" value="${esc(a.duration)}" /></td>
          <td>
            <div class="cell-actions">
              <select id="atk_abil_${i}" class="tiny">
                ${ABILS.map((k) => `<option value="${k}" ${a.ability === k ? "selected" : ""}>${ABIL_LABEL[k]}</option>`).join("")}
              </select>
              <label style="display:inline-flex;gap:6px;align-items:center;">
                <input id="atk_prof_${i}" type="checkbox" ${a.prof ? "checked" : ""} />
                <small>Prof</small>
              </label>
              <label style="display:inline-flex;gap:6px;align-items:center;">
                <input id="atk_add_${i}" type="checkbox" ${a.addMod ? "checked" : ""} />
                <small>+Mod</small>
              </label>
              <button type="button" class="ch-btn danger" id="atk_del_${i}" style="padding:6px 10px;">X</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Add attack button
    const combatPanel = document.querySelector('.ch-panel[data-panel="combat"]');
    const cards = combatPanel ? combatPanel.querySelectorAll(".ch-card") : null;
    const attacksCard = cards && cards.length >= 2 ? cards[1] : null;
    if (attacksCard) {
      const head = attacksCard.querySelector(".ch-card__head");
      if (head && EDIT && !head.querySelector("#addAttackBtn")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ch-btn";
        btn.id = "addAttackBtn";
        btn.textContent = "+ Add attack";
        btn.style.marginLeft = "auto";
        btn.onclick = () => {
          ATTACKS.push({
            name: "New Attack",
            ability: "str",
            prof: true,
            dice: "1d6",
            addMod: true,
            notes: "",
            range: "",
            comp: "",
            duration: "",
          });
          renderAttacks();
        };
        head.appendChild(btn);
      }
      if (head && !EDIT) head.querySelector("#addAttackBtn")?.remove();
    }

    if (!EDIT) return;

    ATTACKS.forEach((a, i) => {
      const name = $("atk_name_" + i);
      const dice = $("atk_dice_" + i);
      const notes = $("atk_notes_" + i);
      const range = $("atk_range_" + i);
      const comp = $("atk_comp_" + i);
      const dur = $("atk_dur_" + i);
      const abil = $("atk_abil_" + i);
      const prof = $("atk_prof_" + i);
      const addm = $("atk_add_" + i);
      const del = $("atk_del_" + i);

      const rerender = () => renderAttacks();
      if (name) name.oninput = () => (a.name = name.value);
      if (dice) dice.oninput = () => {
        a.dice = dice.value;
        rerender();
      };
      if (notes) notes.oninput = () => (a.notes = notes.value);
      if (range) range.oninput = () => (a.range = range.value);
      if (comp) comp.oninput = () => (a.comp = comp.value);
      if (dur) dur.oninput = () => (a.duration = dur.value);
      if (abil) abil.onchange = () => {
        a.ability = abil.value;
        rerender();
      };
      if (prof) prof.onchange = () => {
        a.prof = !!prof.checked;
        rerender();
      };
      if (addm) addm.onchange = () => {
        a.addMod = !!addm.checked;
        rerender();
      };
      if (del)
        del.onclick = () => {
          ATTACKS.splice(i, 1);
          renderAttacks();
        };
    });
  }

  // ====== Spells ======
  function renderSpells() {
    const tbody = $("spellsTbody");
    if (!tbody) return;
    injectEditorStyles();

    tbody.innerHTML = SPELLS.map((s, i) => {
      if (!EDIT) {
        return `
          <tr>
            <td class="t-xs">${s.prep ? "✓" : ""}</td>
            <td class="t-xs">${s.level}</td>
            <td>${s.name || ""}</td>
            <td class="t-sm">${s.saveAtk || ""}</td>
            <td class="t-sm">${s.time || ""}</td>
            <td class="t-sm">${s.range || ""}</td>
            <td class="t-sm">${s.comp || ""}</td>
            <td class="t-sm">${s.duration || ""}</td>
            <td>${s.notes || ""}</td>
          </tr>
        `;
      }

      const esc = (x) => String(x || "").replaceAll('"', "&quot;");

      return `
        <tr>
          <td class="t-xs" style="text-align:center;"><input id="sp_p_${i}" type="checkbox" ${s.prep ? "checked" : ""} /></td>
          <td class="t-xs"><input id="sp_lv_${i}" class="xs" type="number" min="0" max="9" value="${s.level}" /></td>
          <td><input id="sp_name_${i}" type="text" value="${esc(s.name)}" /></td>
          <td class="t-sm"><input id="sp_sa_${i}" type="text" value="${esc(s.saveAtk)}" /></td>
          <td class="t-sm"><input id="sp_time_${i}" type="text" value="${esc(s.time)}" /></td>
          <td class="t-sm"><input id="sp_range_${i}" type="text" value="${esc(s.range)}" /></td>
          <td class="t-sm"><input id="sp_comp_${i}" type="text" value="${esc(s.comp)}" /></td>
          <td class="t-sm"><input id="sp_dur_${i}" type="text" value="${esc(s.duration)}" /></td>
          <td>
            <div style="display:flex;gap:10px;align-items:center;">
              <input id="sp_notes_${i}" type="text" value="${esc(s.notes)}" style="flex:1;" />
              <button type="button" class="ch-btn danger" id="sp_del_${i}" style="padding:6px 10px;">X</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Add spell button in spells panel head
    const spellsPanel = document.querySelector('.ch-panel[data-panel="spells"]');
    const head = spellsPanel ? spellsPanel.querySelector(".ch-panel__head") : null;
    if (head && EDIT && !head.querySelector("#addSpellBtn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ch-btn";
      btn.id = "addSpellBtn";
      btn.textContent = "+ Add spell";
      btn.style.marginLeft = "auto";
      btn.onclick = () => {
        SPELLS.push({ prep: false, level: 0, name: "New Spell", saveAtk: "", time: "", range: "", comp: "", duration: "", notes: "" });
        renderSpells();
      };
      head.style.display = "flex";
      head.style.alignItems = "center";
      head.appendChild(btn);
    }
    if (head && !EDIT) head.querySelector("#addSpellBtn")?.remove();

    if (!EDIT) return;

    SPELLS.forEach((s, i) => {
      const get = (id) => $(id + "_" + i);
      const p = get("sp_p");
      const lv = get("sp_lv");
      const name = get("sp_name");
      const sa = get("sp_sa");
      const time = get("sp_time");
      const range = get("sp_range");
      const comp = get("sp_comp");
      const dur = get("sp_dur");
      const notes = get("sp_notes");
      const del = get("sp_del");

      if (p) p.onchange = () => (s.prep = !!p.checked);
      if (lv) lv.oninput = () => (s.level = clampInt(lv.value || 0, 0, 9));
      if (name) name.oninput = () => (s.name = name.value);
      if (sa) sa.oninput = () => (s.saveAtk = sa.value);
      if (time) time.oninput = () => (s.time = time.value);
      if (range) range.oninput = () => (s.range = range.value);
      if (comp) comp.oninput = () => (s.comp = comp.value);
      if (dur) dur.oninput = () => (s.duration = dur.value);
      if (notes) notes.oninput = () => (s.notes = notes.value);
      if (del)
        del.onclick = () => {
          SPELLS.splice(i, 1);
          renderSpells();
        };
    });
  }

  // ====== Coins / Equipment / Features / Notes remainder ======
  function renderCoins() {
    const box = $("coinsBox");
    if (!box) return;

    if (!EDIT) {
      box.innerHTML = `
        <div class="ch-coin"><strong>CP</strong><span>${COINS.cp}</span></div>
        <div class="ch-coin"><strong>SP</strong><span>${COINS.sp}</span></div>
        <div class="ch-coin"><strong>EP</strong><span>${COINS.ep}</span></div>
        <div class="ch-coin"><strong>GP</strong><span>${COINS.gp}</span></div>
        <div class="ch-coin"><strong>PP</strong><span>${COINS.pp}</span></div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="ch-coin"><strong>CP</strong><input id="coin_cp" type="number" min="0" value="${COINS.cp}" /></div>
      <div class="ch-coin"><strong>SP</strong><input id="coin_sp" type="number" min="0" value="${COINS.sp}" /></div>
      <div class="ch-coin"><strong>EP</strong><input id="coin_ep" type="number" min="0" value="${COINS.ep}" /></div>
      <div class="ch-coin"><strong>GP</strong><input id="coin_gp" type="number" min="0" value="${COINS.gp}" /></div>
      <div class="ch-coin"><strong>PP</strong><input id="coin_pp" type="number" min="0" value="${COINS.pp}" /></div>
    `;

    const bind = (id, key) => {
      const el = $(id);
      if (!el) return;
      el.oninput = () => {
        COINS[key] = clampInt(el.value || 0, 0, 999999);
      };
    };
    bind("coin_cp", "cp");
    bind("coin_sp", "sp");
    bind("coin_ep", "ep");
    bind("coin_gp", "gp");
    bind("coin_pp", "pp");
  }

  function renderEquipment() {
    const editBox = $("equipEditBox");
    const listBox = $("equipList");
    const actions = $("equipActions");
    if (!editBox || !listBox || !actions || !CHAR) return;

    actions.style.display = EDIT ? "" : "none";

    if (!EDIT) {
      editBox.innerHTML = "";
      listBox.innerHTML = CHAR.equipment.length ? CHAR.equipment.map((x) => `<div class="ch-note">${x}</div>`).join("") : `<div class="ch-note">—</div>`;
      return;
    }

    listBox.innerHTML = "";
    editBox.innerHTML = CHAR.equipment.map((line, i) => {
      const v = String(line || "").replaceAll('"', "&quot;");
      return `
        <div style="display:flex;gap:10px;margin:8px 0;">
          <input id="equip_${i}" type="text" value="${v}" style="flex:1;" />
          <button type="button" class="ch-btn danger" id="equip_del_${i}" style="padding:6px 10px;">X</button>
        </div>
      `;
    }).join("");

    CHAR.equipment.forEach((_, i) => {
      const inp = $("equip_" + i);
      const del = $("equip_del_" + i);
      if (inp) inp.oninput = () => (CHAR.equipment[i] = inp.value);
      if (del)
        del.onclick = () => {
          CHAR.equipment.splice(i, 1);
          renderEquipment();
        };
    });

    const add = $("addEquipLineBtn");
    if (add)
      add.onclick = () => {
        CHAR.equipment.push("");
        renderEquipment();
      };
  }

  function renderFeatures() {
    const editBox = $("featuresEditBox");
    const listBox = $("featuresList");
    const actions = $("featureActions");
    if (!editBox || !listBox || !actions) return;

    actions.style.display = EDIT ? "" : "none";

    if (!EDIT) {
      editBox.innerHTML = "";
      listBox.innerHTML = FEATURES.length ? FEATURES.map((x) => `<div class="ch-note">${x}</div>`).join("") : `<div class="ch-note">—</div>`;
      return;
    }

    listBox.innerHTML = "";
    editBox.innerHTML = FEATURES.map((line, i) => {
      const v = String(line || "").replaceAll('"', "&quot;");
      return `
        <div style="display:flex;gap:10px;margin:8px 0;">
          <input id="feat_${i}" type="text" value="${v}" style="flex:1;" />
          <button type="button" class="ch-btn danger" id="feat_del_${i}" style="padding:6px 10px;">X</button>
        </div>
      `;
    }).join("");

    FEATURES.forEach((_, i) => {
      const inp = $("feat_" + i);
      const del = $("feat_del_" + i);
      if (inp) inp.oninput = () => (FEATURES[i] = inp.value);
      if (del)
        del.onclick = () => {
          FEATURES.splice(i, 1);
          renderFeatures();
        };
    });

    const add = $("addFeatureBtn");
    if (add)
      add.onclick = () => {
        FEATURES.push("");
        renderFeatures();
      };
  }

  function renderNotesRemainder() {
    const box = $("notesList");
    if (!box) return;

    if (!EDIT) {
      box.innerHTML = REM_NOTES.length ? REM_NOTES.map((x) => `<div class="ch-note">${x}</div>`).join("") : `<div class="ch-note">—</div>`;
      return;
    }

    box.innerHTML =
      REM_NOTES.map((line, i) => {
        const v = String(line || "").replaceAll('"', "&quot;");
        return `
          <div style="display:flex;gap:10px;margin:8px 0;">
            <input id="note_${i}" type="text" value="${v}" style="flex:1;" />
            <button type="button" class="ch-btn danger" id="note_del_${i}" style="padding:6px 10px;">X</button>
          </div>
        `;
      }).join("") +
      `
        <div style="margin-top:10px;">
          <button type="button" class="ch-btn" id="note_add_btn">+ Thêm note</button>
        </div>
      `;

    REM_NOTES.forEach((_, i) => {
      const inp = $("note_" + i);
      const del = $("note_del_" + i);
      if (inp) inp.oninput = () => (REM_NOTES[i] = inp.value);
      if (del)
        del.onclick = () => {
          REM_NOTES.splice(i, 1);
          renderNotesRemainder();
        };
    });

    const add = $("note_add_btn");
    if (add)
      add.onclick = () => {
        REM_NOTES.push("");
        renderNotesRemainder();
      };
  }

  function renderAll() {
    if (!CHAR) return;

    updateComputed();

    renderHero();
    renderOverview();
    renderAbilities();
    renderSavesAndSkills();

    renderCombat();
    renderDefenses();
    renderAttacks();

    renderSpellcastRow();
    renderSpells();

    renderCoins();
    renderEquipment();
    renderFeatures();
    renderNotesRemainder();
    renderModsBox();

    // enable overview inputs
    [
      "inp_name",
      "inp_race",
      "inp_class",
      "inp_level",
      "inp_alignment",
      "inp_background",
      "inp_description",
    ].forEach((id) => {
      if ($(id)) $(id).disabled = !EDIT;
    });

    // computed passive: always disabled
    ["inp_pa_perception", "inp_pa_insight", "inp_pa_investigation"].forEach((id) => {
      if ($(id)) $(id).disabled = true;
    });
  }

  function wireOverview() {
    const bind = (id, key) => {
      const el = $(id);
      if (!el) return;
      el.oninput = () => {
        CHAR[key] = el.value;
        if (key === "name" || key === "race" || key === "class_name") {
          updateComputed();
          renderHero();
          renderSpellcastRow();
        }
      };
    };

    bind("inp_name", "name");
    bind("inp_race", "race");
    bind("inp_class", "class_name");
    bind("inp_alignment", "alignment");
    bind("inp_background", "background");
    bind("inp_description", "description");

    const lv = $("inp_level");
    if (lv) {
      lv.oninput = () => {
        CHAR.level = clampInt(lv.value || 1, 1, 20);
        updateComputed();
        renderHero();
        renderSavesAndSkills();
        renderAttacks();
        renderCombat();
        renderSpellcastRow();
      };
    }
  }

  // ====== Edit mode ======
  function setEdit(on) {
    if (VIEW_PUBLIC && on) {
      toast("Bạn đang xem bản public — không thể chỉnh sửa", true);
      return;
    }
    EDIT = !!on;

    if ($("editBtn")) $("editBtn").style.display = EDIT ? "none" : "inline-flex";
    if ($("saveBtn")) $("saveBtn").style.display = EDIT ? "inline-flex" : "none";
    if ($("cancelBtn")) $("cancelBtn").style.display = EDIT ? "inline-flex" : "none";

    renderAll();
  }

  function snapshot() {
    ORIG_SNAPSHOT = {
      CHAR: JSON.parse(JSON.stringify(CHAR)),
      COINS: JSON.parse(JSON.stringify(COINS)),
      DEF: JSON.parse(JSON.stringify(DEF)),
      HP_MODE,
      SPELLCAST: JSON.parse(JSON.stringify(SPELLCAST)),
      ATTACKS: JSON.parse(JSON.stringify(ATTACKS)),
      SPELLS: JSON.parse(JSON.stringify(SPELLS)),
      FEATURES: JSON.parse(JSON.stringify(FEATURES)),
      REM_NOTES: JSON.parse(JSON.stringify(REM_NOTES)),
    };
  }

  function restoreSnapshot() {
    if (!ORIG_SNAPSHOT) return;
    CHAR = JSON.parse(JSON.stringify(ORIG_SNAPSHOT.CHAR));
    COINS = JSON.parse(JSON.stringify(ORIG_SNAPSHOT.COINS));
    DEF = JSON.parse(JSON.stringify(ORIG_SNAPSHOT.DEF));
    HP_MODE = ORIG_SNAPSHOT.HP_MODE;
    SPELLCAST = JSON.parse(JSON.stringify(ORIG_SNAPSHOT.SPELLCAST));
    ATTACKS = JSON.parse(JSON.stringify(ORIG_SNAPSHOT.ATTACKS));
    SPELLS = JSON.parse(JSON.stringify(ORIG_SNAPSHOT.SPELLS));
    FEATURES = JSON.parse(JSON.stringify(ORIG_SNAPSHOT.FEATURES));
    REM_NOTES = JSON.parse(JSON.stringify(ORIG_SNAPSHOT.REM_NOTES));
  }

  async function save() {
    if (VIEW_PUBLIC) {
      toast("Bản public không thể lưu", true);
      return;
    }

    updateComputed();

    const notes = buildNotesForSave();

    CHAR.equipment = safeArr(CHAR.equipment)
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .map((x) => (x.length > 160 ? x.slice(0, 159) + "…" : x));

    CHAR.skills = safeArr(CHAR.skills)
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .map((x) => (x.length > 80 ? x.slice(0, 79) + "…" : x));

    const payload = {
      name: String(CHAR.name || "").trim() || "Unnamed",
      race: String(CHAR.race || "").trim() || "Unknown",
      class_name: String(CHAR.class_name || "").trim() || "Class",
      level: clampInt(CHAR.level || 1, 1, 20),
      alignment: String(CHAR.alignment || "Neutral").trim() || "Neutral",
      background: String(CHAR.background || "").trim() || "",
      avatar: String(CHAR.avatar || "").trim(),
      description: String(CHAR.description || "").trim(),

      stats: {
        str: clampInt(CHAR.stats.str, 1, 30),
        dex: clampInt(CHAR.stats.dex, 1, 30),
        con: clampInt(CHAR.stats.con, 1, 30),
        int: clampInt(CHAR.stats.int, 1, 30),
        wis: clampInt(CHAR.stats.wis, 1, 30),
        cha: clampInt(CHAR.stats.cha, 1, 30),
      },

      hp: clampInt(CHAR.hp || 10, 1, 999),
      ac: clampInt(CHAR.ac || 10, 0, 40),
      speed: String(CHAR.speed || "30 ft"),

      skills: safeArr(CHAR.skills),
      equipment: safeArr(CHAR.equipment),
      notes,

      is_public: !!CHAR.is_public,
    };

    try {
      const updated = await Core.apiFetch(`/api/characters/${ID}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      CHAR = normalizeChar(updated);
      parseSectionsFromNotes(CHAR.notes);
      snapshot();
      setEdit(false);
      toast("Đã lưu ✅");
    } catch (e) {
      console.error(e);
      toast(e.message || "Lưu thất bại", true);
    }
  }

  function cancel() {
    restoreSnapshot();
    setEdit(false);
    toast("Đã huỷ thay đổi");
  }

  async function loadCharacter(id) {
    try {
      const data = await Core.apiFetch(`/api/characters/${id}`);
      VIEW_PUBLIC = false;
      return data;
    } catch (e) {
      try {
        const data = await Core.apiFetch(`/api/characters/public/${id}`);
        VIEW_PUBLIC = true;
        return data;
      } catch {
        throw e;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    initTabs();
    injectEditorStyles();

    ID = qs().get("id");
    if (!ID) {
      toast("Thiếu id nhân vật", true);
      return;
    }

    if ($("editBtn")) $("editBtn").onclick = () => setEdit(true);
    if ($("saveBtn")) $("saveBtn").onclick = save;
    if ($("cancelBtn")) $("cancelBtn").onclick = cancel;

    try {
      const data = await loadCharacter(ID);
      CHAR = normalizeChar(data);
      parseSectionsFromNotes(CHAR.notes);
      snapshot();
      EDIT = false;

      if (VIEW_PUBLIC) {
        if ($("editBtn")) $("editBtn").style.display = "none";
        if ($("saveBtn")) $("saveBtn").style.display = "none";
        if ($("cancelBtn")) $("cancelBtn").style.display = "none";
        toast("Đang xem bản PUBLIC (read-only)");
      }

      renderAll();
      wireOverview();
    } catch (e) {
      console.error(e);
      toast(e.message || "Load failed", true);
    }
  });
})();
