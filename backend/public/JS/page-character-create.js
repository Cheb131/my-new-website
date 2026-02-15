// public/JS/page-character-create.js
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== helpers =====
  function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function signed(n) {
    const x = num(n, 0);
    return x >= 0 ? `+${x}` : String(x);
  }

  function modFromScore(score) {
    const s = num(score, 10);
    return Math.floor((s - 10) / 2);
  }

  function profBonusFromLevel(level) {
    const lv = Math.max(1, Math.min(20, num(level, 1)));
    if (lv <= 4) return 2;
    if (lv <= 8) return 3;
    if (lv <= 12) return 4;
    if (lv <= 16) return 5;
    return 6;
  }

  function toast(msg, isErr = true) {
    const box = $("publishMsg");
    if (!box) return;
    box.textContent = msg || "";
    box.style.color = isErr ? "#b91c1c" : "#065f46";
  }

  function ensureCore() {
    if (window.Core?.apiFetch) return window.Core;

    // fallback (trường hợp trang bị load thiếu core.js)
    const API_BASE = (location.port === "5500") ? "http://localhost:3000" : "";
    async function apiFetch(path, options = {}) {
      const headers = { ...(options.headers || {}) };
      if (!headers["Content-Type"] && options.body) headers["Content-Type"] = "application/json";
      const token = localStorage.getItem("token") || "";
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `${res.status} ${res.statusText}`);
      return data;
    }
    return { API_BASE, apiFetch, getUser: () => null, getToken: () => localStorage.getItem("token") || "" };
  }

  // ===== constants =====
  const ABILS = [
    ["str", "STR"],
    ["dex", "DEX"],
    ["con", "CON"],
    ["int", "INT"],
    ["wis", "WIS"],
    ["cha", "CHA"],
  ];

  const SKILLS = [
    ["acrobatics", "dex"],
    ["animalHandling", "wis"],
    ["arcana", "int"],
    ["athletics", "str"],
    ["deception", "cha"],
    ["history", "int"],
    ["insight", "wis"],
    ["intimidation", "cha"],
    ["investigation", "int"],
    ["medicine", "wis"],
    ["nature", "int"],
    ["perception", "wis"],
    ["performance", "cha"],
    ["persuasion", "cha"],
    ["religion", "int"],
    ["sleightOfHand", "dex"],
    ["stealth", "dex"],
    ["survival", "wis"],
  ];

  // ===== state =====
  const STATE = {
    train: [],
    proficiency: [],
    action: [],
    feature: [],
    spells: [],
    attacks: [],
    manualInitiative: false,
    manualPB: false,
    manualPassives: { perception: false, insight: false, investigation: false },
  };

  // ===== list editors =====
  function listRow(value = "") {
    const row = document.createElement("div");
    row.className = "cc-listrow";

    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.placeholder = "Nhập nội dung...";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "cc-delbtn";
    del.textContent = "✕";

    row.appendChild(input);
    row.appendChild(del);
    return { row, input, del };
  }

  function bindListEditor(key, listElId, addBtnId, clearBtnId) {
    const listEl = $(listElId);
    const addBtn = $(addBtnId);
    const clearBtn = $(clearBtnId);

    if (!listEl || !addBtn || !clearBtn) return;

    function sync() {
      const values = $$(".cc-listrow input[type='text']", listEl)
        .map((i) => (i.value || "").trim())
        .filter(Boolean);
      STATE[key] = values;

      const hidden = $("featureListJson");
      if (hidden) {
        hidden.value = JSON.stringify({
          train: STATE.train,
          proficiency: STATE.proficiency,
          action: STATE.action,
          feature: STATE.feature,
        });
      }
    }

    function add(value = "") {
      const { row, input, del } = listRow(value);
      input.addEventListener("input", sync);
      del.addEventListener("click", () => {
        row.remove();
        sync();
      });
      listEl.appendChild(row);
      sync();
    }

    addBtn.addEventListener("click", () => add(""));
    clearBtn.addEventListener("click", () => {
      listEl.innerHTML = "";
      sync();
    });

    // default 1 row cho dễ dùng
    if (listEl.children.length === 0) add("");
  }

  // ===== spells editor =====
  function writeSpellsHidden() {
    const hidden = $("spellsJson");
    if (hidden) hidden.value = JSON.stringify(STATE.spells);
  }

  function readSpellsFromDOM() {
    const tbody = $("spellTbody");
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll("tr"));
    STATE.spells = rows
      .map((tr) => {
        const get = (sel) => tr.querySelector(sel);
        return {
          prepared: !!get("input[data-k='prepared']")?.checked,
          level: (get("input[data-k='level']")?.value || "").trim(),
          name: (get("input[data-k='name']")?.value || "").trim(),
          saveAtk: (get("input[data-k='saveAtk']")?.value || "").trim(),
          time: (get("input[data-k='time']")?.value || "").trim(),
          range: (get("input[data-k='range']")?.value || "").trim(),
          comp: (get("input[data-k='comp']")?.value || "").trim(),
          duration: (get("input[data-k='duration']")?.value || "").trim(),
          notes: (get("input[data-k='notes']")?.value || "").trim(),
        };
      })
      .filter((x) => x.name);

    writeSpellsHidden();
  }

  function spellRow(data = {}) {
    const tr = document.createElement("tr");

    const mkTd = (child, cls = "") => {
      const td = document.createElement("td");
      if (cls) td.className = cls;
      td.appendChild(child);
      return td;
    };

    const mkText = (k, val = "", ph = "") => {
      const i = document.createElement("input");
      i.type = "text";
      i.dataset.k = k;
      i.value = val;
      if (ph) i.placeholder = ph;
      i.addEventListener("input", readSpellsFromDOM);
      return i;
    };

    const prep = document.createElement("input");
    prep.type = "checkbox";
    prep.dataset.k = "prepared";
    prep.checked = !!data.prepared;
    prep.addEventListener("change", readSpellsFromDOM);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "cc-delbtn";
    del.textContent = "✕";
    del.addEventListener("click", () => {
      tr.remove();
      readSpellsFromDOM();
    });

    tr.appendChild(mkTd(prep, "cc-center"));
    tr.appendChild(mkTd(mkText("level", data.level ?? "", "0"), "cc-center"));
    tr.appendChild(mkTd(mkText("name", data.name ?? "", "Spell name")));
    tr.appendChild(mkTd(mkText("saveAtk", data.saveAtk ?? "", "DEX save / +5")));
    tr.appendChild(mkTd(mkText("time", data.time ?? "", "1A")));
    tr.appendChild(mkTd(mkText("range", data.range ?? "", "60 ft")));
    tr.appendChild(mkTd(mkText("comp", data.comp ?? "", "V,S,M")));
    tr.appendChild(mkTd(mkText("duration", data.duration ?? "", "Instant")));
    tr.appendChild(mkTd(mkText("notes", data.notes ?? "", "...")));
    tr.appendChild(mkTd(del, "cc-center"));

    return tr;
  }

  function bindSpells() {
    const tbody = $("spellTbody");
    const addSpell = $("addSpellRowBtn");
    const addCantrip = $("addCantripRowBtn");
    const clear = $("clearSpellsBtn");

    if (!tbody || !addSpell || !addCantrip || !clear) return;

    function addRow(level = "1") {
      tbody.appendChild(spellRow({ level }));
      readSpellsFromDOM();
    }

    addSpell.addEventListener("click", () => addRow("1"));
    addCantrip.addEventListener("click", () => addRow("0"));
    clear.addEventListener("click", () => {
      tbody.innerHTML = "";
      readSpellsFromDOM();
    });

    // default 1 row
    if (tbody.children.length === 0) addRow("0");
  }

  // ===== attacks editor =====
  function writeAttacksHidden() {
    const hidden = $("attacksJson");
    if (hidden) hidden.value = JSON.stringify(STATE.attacks);
  }

  function readAttacksFromDOM() {
    const box = $("attackRows");
    if (!box) return;

    const rows = Array.from(box.querySelectorAll(".cc-attack-row"));
    STATE.attacks = rows
      .map((row) => {
        const get = (k) => row.querySelector(`input[data-k='${k}']`)?.value || "";
        return {
          name: get("name").trim(),
          hit: get("hit").trim(),
          damage: get("damage").trim(),
          notes: get("notes").trim(),
        };
      })
      .filter((x) => x.name);

    writeAttacksHidden();
  }

  function attackRow(data = {}) {
    const row = document.createElement("div");
    row.className = "cc-attack-row";

    const mk = (k, val = "", ph = "") => {
      const i = document.createElement("input");
      i.type = "text";
      i.dataset.k = k;
      i.value = val;
      if (ph) i.placeholder = ph;
      i.addEventListener("input", readAttacksFromDOM);
      return i;
    };

    const del = document.createElement("button");
    del.type = "button";
    del.className = "cc-attack-del";
    del.textContent = "✕";
    del.addEventListener("click", () => {
      row.remove();
      readAttacksFromDOM();
    });

    row.appendChild(mk("name", data.name ?? "", "Longsword"));
    row.appendChild(mk("hit", data.hit ?? "", "+5"));
    row.appendChild(mk("damage", data.damage ?? "", "1d8+3 slashing"));
    row.appendChild(mk("notes", data.notes ?? "", "Versatile..."));
    row.appendChild(del);

    return row;
  }

  function bindAttacks() {
    const box = $("attackRows");
    const add = $("addAttackRowBtn");
    const clear = $("clearAttacksBtn");

    if (!box || !add || !clear) return;

    const addRow = () => {
      box.appendChild(attackRow({}));
      readAttacksFromDOM();
    };

    add.addEventListener("click", addRow);
    clear.addEventListener("click", () => {
      box.innerHTML = "";
      readAttacksFromDOM();
    });

    // default
    if (box.children.length === 0) addRow();
  }

  // ===== equipment editor =====
  function toEquipObj(container) {
    const rows = Array.from(container.querySelectorAll(".cc-equip-row"));
    return rows
      .map((row) => {
        const name = (row.querySelector("input[data-k='name']")?.value || "").trim();
        const qty = num(row.querySelector("input[data-k='qty']")?.value, 0);
        const weight = num(row.querySelector("input[data-k='weight']")?.value, 0);
        return { name, qty: Math.max(0, qty), weight: Math.max(0, weight) };
      })
      .filter((x) => x.name);
  }

  function calcWeightCarried() {
    const colA = $("equipColA");
    const att = $("equipAttuned");
    if (!colA || !att) return 0;

    const a = toEquipObj(colA);
    const b = toEquipObj(att);
    const total = [...a, ...b].reduce((sum, it) => sum + (num(it.qty, 0) || 0) * (num(it.weight, 0) || 0), 0);
    return Math.round(total * 10) / 10;
  }

  function renderCarryMetrics() {
    const str = num($("str")?.value, 10);
    const enc = 5 * str;
    const pdl = 30 * str;
    const w = calcWeightCarried();

    const set = (id, v) => {
      const el = $(id);
      if (el) el.textContent = String(v);
    };

    set("weightCarried", w);
    set("encumberedAt", enc);
    set("pushDragLift", pdl);
  }

  function equipRow(data = {}) {
    const row = document.createElement("div");
    row.className = "cc-equip-row";

    const name = document.createElement("input");
    name.type = "text";
    name.dataset.k = "name";
    name.placeholder = "Item";
    name.value = data.name ?? "";

    const qty = document.createElement("input");
    qty.type = "number";
    qty.min = "0";
    qty.step = "1";
    qty.dataset.k = "qty";
    qty.value = String(num(data.qty, 1));

    const weight = document.createElement("input");
    weight.type = "number";
    weight.min = "0";
    weight.step = "0.1";
    weight.dataset.k = "weight";
    weight.value = String(num(data.weight, 0));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "cc-delbtn";
    del.textContent = "✕";

    const onChange = () => renderCarryMetrics();
    name.addEventListener("input", onChange);
    qty.addEventListener("input", onChange);
    weight.addEventListener("input", onChange);

    del.addEventListener("click", () => {
      row.remove();
      renderCarryMetrics();
    });

    row.appendChild(name);
    row.appendChild(qty);
    row.appendChild(weight);
    row.appendChild(del);
    return row;
  }

  function bindEquipment() {
    const colA = $("equipColA");
    const att = $("equipAttuned");
    const addA = $("addEquipA");
    const addAtt = $("addEquipAttuned");
    const clearAll = $("clearEquipAll");

    if (!colA || !att || !addA || !addAtt || !clearAll) return;

    const addRow = (container) => {
      container.appendChild(equipRow({ qty: 1, weight: 0 }));
      renderCarryMetrics();
    };

    addA.addEventListener("click", () => addRow(colA));
    addAtt.addEventListener("click", () => addRow(att));
    clearAll.addEventListener("click", () => {
      colA.innerHTML = "";
      att.innerHTML = "";
      addRow(colA);
      renderCarryMetrics();
    });

    // default rows
    if (colA.children.length === 0) addRow(colA);
    if (att.children.length === 0) addRow(att);

    renderCarryMetrics();
  }

  // ===== defenses checkboxes =====
  function bindDefensesClear() {
    const btn = $("defAllClear");
    if (!btn) return;
    btn.addEventListener("click", () => {
      ["resistancesBox", "immunitiesBox", "vulnerabilitiesBox"].forEach((id) => {
        const box = $(id);
        if (!box) return;
        $$("input[type='checkbox']", box).forEach((c) => (c.checked = false));
      });
    });
  }

  // ===== derived calcs =====
  function calcAll() {
    // Ability mods
    const mods = {};
    for (const [k] of ABILS) {
      mods[k] = modFromScore($(k)?.value);
      const out = $(`mod_${k}`);
      if (out) out.textContent = signed(mods[k]);
    }

    // Proficiency bonus
    const level = num($("level")?.value, 1);
    const pbAuto = profBonusFromLevel(level);
    const pbEl = $("proficiencyBonus");
    if (pbEl && !STATE.manualPB) pbEl.value = String(pbAuto);
    const pb = num(pbEl?.value, pbAuto);

    // Saving throws
    for (const [k] of ABILS) {
      const prof = !!$("saveProf_" + k)?.checked;
      const v = mods[k] + (prof ? pb : 0);
      const out = $("save_" + k);
      if (out) out.value = String(v);
    }

    // Skills
    for (const [skillKey, abilKey] of SKILLS) {
      const prof = !!$("p_" + skillKey)?.checked;
      const v = mods[abilKey] + (prof ? pb : 0);
      const out = $(skillKey);
      if (out) out.value = String(v);
    }

    // Initiative (default = DEX mod)
    const initEl = $("initiative");
    if (initEl && !STATE.manualInitiative) initEl.value = String(mods.dex);

    // Passives (10 + skill)
    const pPerEl = $("pa_perception");
    const pInsEl = $("pa_insight");
    const pInvEl = $("pa_investigation");

    const skillVal = (id) => num($(id)?.value, 0);
    if (pPerEl && !STATE.manualPassives.perception) pPerEl.value = String(10 + skillVal("perception"));
    if (pInsEl && !STATE.manualPassives.insight) pInsEl.value = String(10 + skillVal("insight"));
    if (pInvEl && !STATE.manualPassives.investigation) pInvEl.value = String(10 + skillVal("investigation"));

    // Carry metrics
    renderCarryMetrics();
  }

  function bindManualFlags() {
    $("initiative")?.addEventListener("input", () => (STATE.manualInitiative = true));
    $("proficiencyBonus")?.addEventListener("input", () => (STATE.manualPB = true));

    $("pa_perception")?.addEventListener("input", () => (STATE.manualPassives.perception = true));
    $("pa_insight")?.addEventListener("input", () => (STATE.manualPassives.insight = true));
    $("pa_investigation")?.addEventListener("input", () => (STATE.manualPassives.investigation = true));
  }

  function bindRecalc() {
    [...ABILS.map(([k]) => k), "level"].forEach((id) => {
      $(id)?.addEventListener("input", calcAll);
      $(id)?.addEventListener("change", calcAll);
    });

    ABILS.forEach(([k]) => {
      $("saveProf_" + k)?.addEventListener("change", calcAll);
    });

    SKILLS.forEach(([skillKey]) => {
      $("p_" + skillKey)?.addEventListener("change", calcAll);
    });
  }

  // ===== gather payload =====
  function selectedValues(boxId) {
    const box = $(boxId);
    if (!box) return [];
    return $$("input[type='checkbox']", box)
      .filter((c) => c.checked)
      .map((c) => String(c.value || "").trim())
      .filter(Boolean);
  }

  function buildEquipmentPayload() {
    const coins = {
      cp: num($("coin_cp")?.value, 0),
      sp: num($("coin_sp")?.value, 0),
      ep: num($("coin_ep")?.value, 0),
      gp: num($("coin_gp")?.value, 0),
      pp: num($("coin_pp")?.value, 0),
    };

    const equipLines = [];
    equipLines.push(`Coins: CP=${coins.cp} SP=${coins.sp} EP=${coins.ep} GP=${coins.gp} PP=${coins.pp}`);

    const colA = $("equipColA");
    const att = $("equipAttuned");

    const a = colA ? toEquipObj(colA) : [];
    const b = att ? toEquipObj(att) : [];

    a.forEach((it) => {
      equipLines.push(`Equip: ${it.name} | Qty=${it.qty} | W=${it.weight}`);
    });
    b.forEach((it) => {
      equipLines.push(`Attuned: ${it.name} | Qty=${it.qty} | W=${it.weight}`);
    });

    return equipLines;
  }

  function buildNotesPayload() {
    const notes = [];

    const init = num($("initiative")?.value, 0);
    const pb = num($("proficiencyBonus")?.value, profBonusFromLevel(num($("level")?.value, 1)));

    notes.push(`Meta: Initiative=${init}`);
    notes.push(`Meta: ProficiencyBonus=${pb}`);

    const saveProf = ABILS.filter(([k]) => $("saveProf_" + k)?.checked).map(([k]) => k);
    notes.push(`Meta: SaveProficiencies=${saveProf.join(",")}`);

    const skillProf = SKILLS.filter(([k]) => $("p_" + k)?.checked).map(([k]) => k);
    notes.push(`Meta: SkillProficiencies=${skillProf.join(",")}`);

    const hitDice = ($("hitDice")?.value || "").trim();
    const abilitySaveDc = ($("abilitySaveDc")?.value || "").trim();
    if (hitDice) notes.push(`Meta: HitDice=${hitDice}`);
    if (abilitySaveDc) notes.push(`Meta: AbilitySaveDC=${abilitySaveDc}`);

    const curHp = ($("currentHp")?.value || "").trim();
    if (curHp) notes.push(`Meta: CurrentHP=${curHp}`);

    const dsS = ["ds_s1", "ds_s2", "ds_s3"].filter((id) => $(id)?.checked).length;
    const dsF = ["ds_f1", "ds_f2", "ds_f3"].filter((id) => $(id)?.checked).length;
    if (dsS || dsF) notes.push(`Meta: DeathSaves=${dsS}/${dsF}`);
    if ($("heroicInspiration")?.checked) notes.push(`Meta: HeroicInspiration=true`);

    STATE.train.filter(Boolean).forEach((t) => notes.push(`Train: ${t}`));
    STATE.proficiency.filter(Boolean).forEach((t) => notes.push(`Proficiency: ${t}`));
    STATE.action.filter(Boolean).forEach((t) => notes.push(`Action: ${t}`));
    STATE.feature.filter(Boolean).forEach((t) => notes.push(`Feature: ${t}`));

    readSpellsFromDOM();
    STATE.spells.forEach((s) => {
      const pfx = s.prepared ? "[P] " : "";
      const level = s.level || "";
      const parts = [
        `${pfx}${s.name}`,
        `Level:${level}`,
        `Save/Atk:${s.saveAtk || ""}`,
        `Time:${s.time || ""}`,
        `Range:${s.range || ""}`,
        `Comp:${s.comp || ""}`,
        `Dur:${s.duration || ""}`,
        `Notes:${s.notes || ""}`,
      ];
      notes.push(`Spell: ${parts.join(" | ")}`);
    });

    readAttacksFromDOM();
    STATE.attacks.forEach((a) => {
      const parts = [
        a.name,
        `Hit:${a.hit || ""}`,
        `Dmg:${a.damage || ""}`,
        `Notes:${a.notes || ""}`,
      ];
      notes.push(`Attack: ${parts.join(" | ")}`);
    });

    return notes;
  }

  async function publish() {
    toast("");

    const Core = ensureCore();
    const token = Core.getToken?.() || localStorage.getItem("token") || "";

    if (!token) {
      toast("Bạn cần đăng nhập để tạo nhân vật.");
      window.openLoginModal?.();
      return;
    }

    readSpellsFromDOM();
    readAttacksFromDOM();

    const payload = {
      name: ($("name")?.value || "").trim(),
      race: ($("race")?.value || "").trim() || "Human",
      class_name: ($("class")?.value || "").trim() || "Fighter",
      level: num($("level")?.value, 1),
      alignment: ($("alignment")?.value || "").trim() || "Neutral",
      background: ($("background")?.value || "").trim() || "Adventurer",
      avatar: "",
      description: "",
      stats: {
        str: num($("str")?.value, 10),
        dex: num($("dex")?.value, 10),
        con: num($("con")?.value, 10),
        int: num($("int")?.value, 10),
        wis: num($("wis")?.value, 10),
        cha: num($("cha")?.value, 10),
      },
      hp: num($("hp")?.value, 10),
      ac: num($("ac")?.value, 10),
      speed: ($("speed")?.value || "30 ft").trim() || "30 ft",
      skills: SKILLS.filter(([k]) => $("p_" + k)?.checked).map(([k]) => k),
      equipment: buildEquipmentPayload(),
      notes: buildNotesPayload(),
      is_public: true,
      resistances: selectedValues("resistancesBox"),
      immunities: selectedValues("immunitiesBox"),
      vulnerabilities: selectedValues("vulnerabilitiesBox"),
      senses: {
        passivePerception: num($("pa_perception")?.value, 0),
        passiveInsight: num($("pa_insight")?.value, 0),
        passiveInvestigation: num($("pa_investigation")?.value, 0),
      },
      feature_lines: STATE.feature || [],
    };

    if (!payload.name) {
      toast("Thiếu Tên nhân vật (Name).", true);
      $("name")?.focus();
      return;
    }

    try {
      const created = await Core.apiFetch("/api/characters", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast(`✅ Đã tạo nhân vật #${created?.id}.`, false);
      setTimeout(() => {
        window.location.href = `character.html?id=${created.id}`;
      }, 350);
    } catch (err) {
      toast(err?.message || "Tạo nhân vật thất bại", true);
    }
  }

  // ===== init =====
  document.addEventListener("DOMContentLoaded", () => {
    bindListEditor("train", "trainList", "addTrainBtn", "clearTrainBtn");
    bindListEditor("proficiency", "proficiencyList", "addProficiencyBtn", "clearProficiencyBtn");
    bindListEditor("action", "actionList", "addActionBtn", "clearActionBtn");
    bindListEditor("feature", "featureList", "addFeatureBtn", "clearFeatureBtn");

    bindSpells();
    bindAttacks();
    bindEquipment();
    bindDefensesClear();

    bindManualFlags();
    bindRecalc();

    $("publishCharacterBtn")?.addEventListener("click", publish);

    calcAll();
  });
})();
