// public/JS/character.js
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ===== utils =====
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  function qs() {
    return new URLSearchParams(location.search);
  }

  function getId() {
    const id = qs().get("id");
    return (id || "").trim();
  }

  function token() {
    return localStorage.getItem("token") || "";
  }

  function fmtSigned(n) {
    const x = Number(n) || 0;
    return x >= 0 ? `+${x}` : String(x);
  }

  function modFromScore(score) {
    const s = Number(score);
    if (!Number.isFinite(s)) return 0;
    return Math.floor((s - 10) / 2);
  }

  function profBonusFromLevel(level) {
    const lv = Math.max(1, Math.min(20, Number(level) || 1));
    if (lv <= 4) return 2;
    if (lv <= 8) return 3;
    if (lv <= 12) return 4;
    if (lv <= 16) return 5;
    return 6;
  }

  function showMsg(text, kind = "") {
    const box = $("msgBox");
    if (!box) return;
    if (!text) {
      box.style.display = "none";
      box.className = "ch-msg";
      box.textContent = "";
      return;
    }
    box.style.display = "block";
    box.className = `ch-msg ${kind}`.trim();
    box.textContent = text;
  }

  function setText(id, value) {
    const el = $(id);
    if (!el) return;
    el.textContent = String(value ?? "");
  }

  function setVal(id, value) {
    const el = $(id);
    if (!el) return;
    el.value = value ?? "";
  }

  function setDisabled(ids, disabled) {
    ids.forEach((id) => {
      const el = $(id);
      if (el) el.disabled = !!disabled;
    });
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

  const SAVE_NAMES = [
    ["str", "Strength"],
    ["dex", "Dexterity"],
    ["con", "Constitution"],
    ["int", "Intelligence"],
    ["wis", "Wisdom"],
    ["cha", "Charisma"],
  ];

  const SKILLS = [
    ["acrobatics", "Acrobatics", "dex"],
    ["animalHandling", "Animal Handling", "wis"],
    ["arcana", "Arcana", "int"],
    ["athletics", "Athletics", "str"],
    ["deception", "Deception", "cha"],
    ["history", "History", "int"],
    ["insight", "Insight", "wis"],
    ["intimidation", "Intimidation", "cha"],
    ["investigation", "Investigation", "int"],
    ["medicine", "Medicine", "wis"],
    ["nature", "Nature", "int"],
    ["perception", "Perception", "wis"],
    ["performance", "Performance", "cha"],
    ["persuasion", "Persuasion", "cha"],
    ["religion", "Religion", "int"],
    ["sleightOfHand", "Sleight of Hand", "dex"],
    ["stealth", "Stealth", "dex"],
    ["survival", "Survival", "wis"],
  ];

  // ===== state =====
  let CHAR = null;           // fetched char object
  let EDIT = false;          // edit mode
  let PROF_SAVES = new Set();// save prof keys
  let PROF_SKILLS = new Set();// skill keys
  let EQUIP_LINES = [];      // editable list (strings)
  let FEATURE_LINES = [];    // editable features (strings)
  let NOTES_RAW = [];        // notes (strings)

  // ===== parsing notes helpers =====
  function parseMeta(notes) {
    // from page-character-create.js:
    // Meta: Initiative=...
    // Meta: ProficiencyBonus=...
    // Meta: SaveProficiencies=str,dex,...
    // and spells/attacks lines.
    const meta = {};
    for (const line of notes) {
      const m = /^Meta:\s*([^=]+)=(.*)$/.exec(line);
      if (!m) continue;
      meta[m[1].trim()] = m[2].trim();
    }
    return meta;
  }

  function parseCoinsFromEquipment(equipment) {
    // equipment line might be: "Coins: CP=0 SP=0 ..."
    // or "CP=0 SP=0 ..."
    const out = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    const coinLine = (equipment || []).find((x) => /CP\s*=\s*\d+/i.test(String(x)));
    if (!coinLine) return out;

    const s = String(coinLine);
    const get = (k) => {
      const m = new RegExp(`${k}\\s*=\\s*(\\d+)`, "i").exec(s);
      return m ? Number(m[1]) : 0;
    };
    out.cp = get("CP");
    out.sp = get("SP");
    out.ep = get("EP");
    out.gp = get("GP");
    out.pp = get("PP");
    return out;
  }

  function stripPrefixEquip(line) {
    // removes "EquipA:" / "EquipB:" / "Equip:" / etc
    return String(line || "").replace(/^\s*Equip[A-Za-z]*\s*:\s*/i, "").trim();
  }

  function splitEquipment(equipment) {
    const lines = (equipment || [])
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    // remove coins line(s) from equip list display/edit
    const equipOnly = lines.filter((x) => !/CP\s*=\s*\d+/i.test(x));
    return equipOnly.map(stripPrefixEquip);
  }

  function parseSpellsFromNotes(notes) {
    // Spell: [P] Name | Level:1 | Save/Atk:.. | Time:.. | Range:.. | Comp:.. | Dur:.. | Page:- | Notes:..
    const spells = [];
    for (const line of notes) {
      if (!/^Spell:\s*/.test(line)) continue;
      const raw = line.replace(/^Spell:\s*/i, "").trim();
      const parts = raw.split("|").map((x) => x.trim()).filter(Boolean);

      // first part contains name, maybe with [P]
      let first = parts[0] || "";
      let prepared = false;
      if (first.startsWith("[P]")) {
        prepared = true;
        first = first.replace(/^\[P\]\s*/i, "");
      }
      const name = first;

      const obj = { prepared, level: "", saveAtk: "", time: "", range: "", comp: "", dur: "", notes: "" };

      for (const p of parts.slice(1)) {
        const mm = /^([^:]+)\s*:\s*(.*)$/.exec(p);
        if (!mm) continue;
        const k = mm[1].trim().toLowerCase();
        const v = mm[2].trim();
        if (k === "level") obj.level = v;
        if (k === "save/atk" || k === "saveatk") obj.saveAtk = v;
        if (k === "time") obj.time = v;
        if (k === "range") obj.range = v;
        if (k === "comp") obj.comp = v;
        if (k === "dur" || k === "duration") obj.dur = v;
        if (k === "notes") obj.notes = v;
      }

      obj.name = name;
      spells.push(obj);
    }
    return spells;
  }

  function parseAttacksFromNotes(notes) {
    // Attack: NAME | HIT | DAMAGE/TYPE | NOTES
    const out = [];
    for (const line of notes) {
      if (!/^Attack:\s*/.test(line)) continue;
      out.push(line.replace(/^Attack:\s*/i, "").trim());
    }
    return out;
  }

  function filterNotesRemainder(notes) {
    // remove Meta:, Spell:, Attack: and show rest
    return (notes || []).filter((x) => {
      const s = String(x || "");
      if (/^Meta:\s*/i.test(s)) return false;
      if (/^Spell:\s*/i.test(s)) return false;
      if (/^Attack:\s*/i.test(s)) return false;
      return s.trim().length > 0;
    });
  }

  // ===== render chips =====
  function renderChips(id, arr) {
    const box = $(id);
    if (!box) return;
    box.innerHTML = "";
    const a = (arr || []).map((x) => String(x || "").trim()).filter(Boolean);
    if (!a.length) {
      box.innerHTML = `<span class="ch-chip" style="opacity:.7;">—</span>`;
      return;
    }
    for (const x of a) {
      const el = document.createElement("span");
      el.className = "ch-chip";
      el.textContent = x;
      box.appendChild(el);
    }
  }

  // ===== abilities UI =====
  function buildAbilitiesGrid() {
    const grid = $("abilitiesGrid");
    if (!grid) return;
    grid.innerHTML = "";

    for (const [k, label] of ABILS) {
      const card = document.createElement("div");
      card.className = "ab";
      card.innerHTML = `
        <div class="ab__k">${label}</div>
        <div class="ab__score" id="ab_score_${k}">10</div>
        <div class="ab__mod" id="ab_mod_${k}">+0</div>
        <input id="ab_inp_${k}" type="number" min="1" max="30" disabled />
      `;
      grid.appendChild(card);
    }
  }

  function buildSaveList() {
    const box = $("savingList");
    if (!box) return;
    box.innerHTML = "";

    for (const [k, label] of SAVE_NAMES) {
      const row = document.createElement("div");
      row.className = "li";
      row.innerHTML = `
        <div class="li__left">
          <label class="li__chk">
            <input type="checkbox" id="save_prof_${k}" />
            Prof
          </label>
          <div class="li__k">${esc(label)}</div>
        </div>
        <div class="li__v" id="save_val_${k}">+0</div>
      `;
      box.appendChild(row);
    }
  }

  function buildSkillsList() {
    const box = $("skillsList");
    if (!box) return;
    box.innerHTML = "";

    for (const [key, label] of SKILLS) {
      const row = document.createElement("div");
      row.className = "li";
      row.innerHTML = `
        <div class="li__left">
          <label class="li__chk">
            <input type="checkbox" id="skill_prof_${key}" />
            Prof
          </label>
          <div class="li__k">${esc(label)}</div>
        </div>
        <div class="li__v" id="skill_val_${key}">+0</div>
      `;
      box.appendChild(row);
    }
  }

  function setProfCheckboxesDisabled(disabled) {
    // disables/enables prof checkboxes in lists
    for (const [k] of SAVE_NAMES) {
      const cb = $(`save_prof_${k}`);
      if (cb) cb.disabled = !!disabled;
    }
    for (const [key] of SKILLS) {
      const cb = $(`skill_prof_${key}`);
      if (cb) cb.disabled = !!disabled;
    }
  }

  // ===== compute derived numbers =====
  function getLevel() {
    const lv = Number($("inp_level")?.value ?? CHAR?.level ?? 1);
    return Number.isFinite(lv) ? Math.max(1, Math.min(20, lv)) : 1;
  }

  function getStats() {
    const s = {};
    for (const [k] of ABILS) {
      const v = Number($(`ab_inp_${k}`)?.value ?? CHAR?.stats?.[k] ?? 10);
      s[k] = Number.isFinite(v) ? v : 10;
    }
    return s;
  }

  function recalcAll() {
    if (!CHAR) return;

    const lv = getLevel();
    const pb = profBonusFromLevel(lv);
    setText("ch_pb", fmtSigned(pb));
    setText("q_pb", fmtSigned(pb));

    const stats = getStats();

    // abilities cards + quick mods
    const modsBox = $("modsBox");
    if (modsBox) modsBox.innerHTML = "";

    for (const [k, label] of ABILS) {
      const score = stats[k] ?? 10;
      const mod = modFromScore(score);

      setText(`ab_score_${k}`, score);
      setText(`ab_mod_${k}`, `MOD ${fmtSigned(mod)}`);

      // quick mods
      if (modsBox) {
        const m = document.createElement("div");
        m.className = "ch-mod";
        m.innerHTML = `<div class="ch-mod__k">${label}</div><div class="ch-mod__v">${fmtSigned(mod)}</div>`;
        modsBox.appendChild(m);
      }
    }

    // initiative = DEX mod (simple)
    const init = modFromScore(stats.dex);
    setText("ch_init", fmtSigned(init));
    setText("combatInit", fmtSigned(init));

    // passive perception from input or derive (10 + wis mod + prof if proficient in perception)
    const paPer = Number($("inp_pa_perception")?.value ?? 0);
    const computedPP = Number.isFinite(paPer) && paPer > 0
      ? paPer
      : (10 + modFromScore(stats.wis) + (PROF_SKILLS.has("perception") ? pb : 0));
    setText("ch_pp", String(computedPP));

    // saving throws
    for (const [k] of SAVE_NAMES) {
      const base = modFromScore(stats[k]);
      const total = base + (PROF_SAVES.has(k) ? pb : 0);
      const el = $(`save_val_${k}`);
      if (el) el.textContent = fmtSigned(total);
    }

    // skills
    for (const [key, _label, abilKey] of SKILLS) {
      const base = modFromScore(stats[abilKey]);
      const total = base + (PROF_SKILLS.has(key) ? pb : 0);
      const el = $(`skill_val_${key}`);
      if (el) el.textContent = fmtSigned(total);
    }

    // quick from combat inputs
    const ac = Number($("inp_ac")?.value ?? CHAR.ac ?? 10);
    const hp = Number($("inp_hp")?.value ?? CHAR.hp ?? 10);
    const speed = String($("inp_speed")?.value ?? CHAR.speed ?? "30 ft");
    setText("q_ac", Number.isFinite(ac) ? String(ac) : "—");
    setText("q_hp", Number.isFinite(hp) ? String(hp) : "—");
    setText("q_speed", speed || "—");
  }

  // ===== render tables/notes =====
  function renderSpells() {
    const tbody = $("spellsTbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const spells = parseSpellsFromNotes(NOTES_RAW);
    if (!spells.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="9" style="opacity:.7; padding:14px;">—</td>`;
      tbody.appendChild(tr);
      return;
    }

    for (const sp of spells) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="t-xs">${sp.prepared ? "✓" : ""}</td>
        <td class="t-xs">${esc(sp.level || "")}</td>
        <td>${esc(sp.name || "")}</td>
        <td class="t-sm">${esc(sp.saveAtk || "")}</td>
        <td class="t-sm">${esc(sp.time || "")}</td>
        <td class="t-sm">${esc(sp.range || "")}</td>
        <td class="t-sm">${esc(sp.comp || "")}</td>
        <td class="t-sm">${esc(sp.dur || "")}</td>
        <td>${esc(sp.notes || "")}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function renderAttacks() {
    const box = $("attacksBox");
    if (!box) return;
    box.innerHTML = "";

    const attacks = parseAttacksFromNotes(NOTES_RAW);
    if (!attacks.length) {
      box.innerHTML = `<div class="note" style="opacity:.7;">—</div>`;
      return;
    }

    for (const a of attacks) {
      const div = document.createElement("div");
      div.className = "note";
      div.textContent = a;
      box.appendChild(div);
    }
  }

  function renderCoinsAndEquip() {
    const coins = parseCoinsFromEquipment(CHAR.equipment || []);
    const coinsBox = $("coinsBox");
    if (coinsBox) {
      coinsBox.innerHTML = `
        <span class="coin">CP ${coins.cp}</span>
        <span class="coin">SP ${coins.sp}</span>
        <span class="coin">EP ${coins.ep}</span>
        <span class="coin">GP ${coins.gp}</span>
        <span class="coin">PP ${coins.pp}</span>
      `;
    }

    EQUIP_LINES = splitEquipment(CHAR.equipment || []);
    renderEquipList();
  }

  function renderEquipList() {
    const list = $("equipList");
    if (!list) return;
    list.innerHTML = "";

    if (!EQUIP_LINES.length) {
      list.innerHTML = `<div class="eqline" style="opacity:.7;">—</div>`;
      return;
    }

    for (const line of EQUIP_LINES) {
      const div = document.createElement("div");
      div.className = "eqline";
      div.textContent = line;
      list.appendChild(div);
    }
  }

  function renderEquipEditor() {
    const box = $("equipEditBox");
    if (!box) return;
    box.innerHTML = "";

    for (let i = 0; i < EQUIP_LINES.length; i++) {
      const row = document.createElement("div");
      row.className = "eqedit-row";
      row.innerHTML = `
        <input type="text" data-idx="${i}" value="${esc(EQUIP_LINES[i])}" />
        <button type="button" class="eqedit-del" data-idx="${i}">Xoá</button>
      `;
      box.appendChild(row);
    }

    // events
    box.querySelectorAll("input[data-idx]").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const t = e.target;
        const idx = Number(t.dataset.idx);
        EQUIP_LINES[idx] = String(t.value || "");
      });
    });

    box.querySelectorAll("button.eqedit-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        EQUIP_LINES.splice(idx, 1);
        renderEquipEditor();
        renderEquipList();
      });
    });
  }

  function renderFeatures() {
    FEATURE_LINES = Array.isArray(CHAR.feature_lines) ? CHAR.feature_lines.slice() : [];
    const list = $("featuresList");
    if (list) {
      list.innerHTML = "";
      if (!FEATURE_LINES.length) {
        list.innerHTML = `<div class="note" style="opacity:.7;">—</div>`;
      } else {
        for (const f of FEATURE_LINES) {
          const div = document.createElement("div");
          div.className = "note";
          div.textContent = f;
          list.appendChild(div);
        }
      }
    }

    renderFeaturesEditor();
  }

  function renderFeaturesEditor() {
    const box = $("featuresEditBox");
    if (!box) return;
    box.innerHTML = "";

    if (!EDIT) return;

    for (let i = 0; i < FEATURE_LINES.length; i++) {
      const row = document.createElement("div");
      row.className = "eqedit-row";
      row.innerHTML = `
        <input type="text" data-idx="${i}" value="${esc(FEATURE_LINES[i])}" />
        <button type="button" class="eqedit-del" data-idx="${i}">Xoá</button>
      `;
      box.appendChild(row);
    }

    box.querySelectorAll("input[data-idx]").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const t = e.target;
        const idx = Number(t.dataset.idx);
        FEATURE_LINES[idx] = String(t.value || "");
      });
    });

    box.querySelectorAll("button.eqedit-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        FEATURE_LINES.splice(idx, 1);
        renderFeaturesEditor();
        renderFeatures();
      });
    });
  }

  function renderNotesRemainder() {
    const list = $("notesList");
    if (!list) return;
    list.innerHTML = "";

    const rest = filterNotesRemainder(NOTES_RAW);
    if (!rest.length) {
      list.innerHTML = `<div class="note" style="opacity:.7;">—</div>`;
      return;
    }
    for (const x of rest) {
      const div = document.createElement("div");
      div.className = "note";
      div.textContent = x;
      list.appendChild(div);
    }
  }

  // ===== top meta render =====
  function renderHero() {
    const name = CHAR?.name || "Unknown";
    const race = CHAR?.race || "—";
    const cls = CHAR?.class_name || "—";
    const lv = CHAR?.level ?? 1;

    setText("ch_name", name);
    setText("ch_subline", `${race} • ${cls} • Level ${lv}`);

    // badge
    const pub = !!CHAR?.is_public;
    const badge = $("ch_publicBadge");
    if (badge) {
      badge.textContent = pub ? "PUBLIC" : "PRIVATE";
      badge.style.opacity = pub ? "1" : ".75";
    }

    // tags
    const tags = $("ch_tags");
    if (tags) {
      tags.innerHTML = "";
      const items = [
        CHAR?.alignment ? `Alignment: ${CHAR.alignment}` : "",
        CHAR?.background ? `Background: ${CHAR.background}` : "",
      ].filter(Boolean);

      if (!items.length) {
        const t = document.createElement("span");
        t.className = "ch-tag";
        t.style.opacity = ".75";
        t.textContent = "—";
        tags.appendChild(t);
      } else {
        for (const x of items) {
          const t = document.createElement("span");
          t.className = "ch-tag";
          t.textContent = x;
          tags.appendChild(t);
        }
      }
    }
  }

  // ===== set inputs from char =====
  function fillInputs() {
    setVal("inp_name", CHAR?.name || "");
    setVal("inp_race", CHAR?.race || "");
    setVal("inp_class", CHAR?.class_name || "");
    setVal("inp_level", CHAR?.level ?? 1);
    setVal("inp_alignment", CHAR?.alignment || "");
    setVal("inp_background", CHAR?.background || "");
    setVal("inp_description", CHAR?.description || "");

    // senses
    setVal("inp_pa_perception", CHAR?.senses?.passivePerception ?? 0);
    setVal("inp_pa_insight", CHAR?.senses?.passiveInsight ?? 0);
    setVal("inp_pa_investigation", CHAR?.senses?.passiveInvestigation ?? 0);

    // combat
    setVal("inp_ac", CHAR?.ac ?? 10);
    setVal("inp_hp", CHAR?.hp ?? 10);
    setVal("inp_speed", CHAR?.speed ?? "30 ft");

    // abilities inputs
    for (const [k] of ABILS) {
      setVal(`ab_inp_${k}`, CHAR?.stats?.[k] ?? 10);
    }
  }

  // ===== prof from db =====
  function initProficiencies() {
    // From DB you saved:
    // - CHAR.skills[] => names ("Perception", "Acrobatics", ...)
    // - Meta: SaveProficiencies=str,dex,...
    // We map them to keys in our UI
    PROF_SKILLS = new Set();
    const skillNames = Array.isArray(CHAR?.skills) ? CHAR.skills : [];
    const nameToKey = new Map(SKILLS.map(([key, label]) => [label.toLowerCase(), key]));
    for (const s of skillNames) {
      const k = nameToKey.get(String(s).toLowerCase().trim());
      if (k) PROF_SKILLS.add(k);
    }

    PROF_SAVES = new Set();
    const meta = parseMeta(NOTES_RAW);
    if (meta.SaveProficiencies) {
      meta.SaveProficiencies.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).forEach((k) => PROF_SAVES.add(k));
    }

    // set checkboxes states
    for (const [k] of SAVE_NAMES) {
      const cb = $(`save_prof_${k}`);
      if (cb) cb.checked = PROF_SAVES.has(k);
    }
    for (const [key] of SKILLS) {
      const cb = $(`skill_prof_${key}`);
      if (cb) cb.checked = PROF_SKILLS.has(key);
    }
  }

  // ===== edit mode =====
  function enterEdit() {
    EDIT = true;

    $("editBtn").style.display = "none";
    $("saveBtn").style.display = "inline-flex";
    $("cancelBtn").style.display = "inline-flex";

    // enable editable inputs
    setDisabled([
      "inp_name","inp_race","inp_class","inp_level","inp_alignment","inp_background","inp_description",
      "inp_pa_perception","inp_pa_insight","inp_pa_investigation",
      "inp_ac","inp_hp","inp_speed",
      "ab_inp_str","ab_inp_dex","ab_inp_con","ab_inp_int","ab_inp_wis","ab_inp_cha",
    ], false);

    setProfCheckboxesDisabled(false);

    // show equip editor
    $("equipEditBox").classList.add("is-on");
    $("equipActions").style.display = "flex";
    renderEquipEditor();

    // show feature editor
    $("featureActions").style.display = "flex";
    renderFeaturesEditor();

    showMsg("Đang ở chế độ chỉnh sửa. Tick prof, sửa thông tin rồi bấm Lưu.", "");
  }

  function exitEdit(reset = false) {
    EDIT = false;

    $("editBtn").style.display = "inline-flex";
    $("saveBtn").style.display = "none";
    $("cancelBtn").style.display = "none";

    setDisabled([
      "inp_name","inp_race","inp_class","inp_level","inp_alignment","inp_background","inp_description",
      "inp_pa_perception","inp_pa_insight","inp_pa_investigation",
      "inp_ac","inp_hp","inp_speed",
      "ab_inp_str","ab_inp_dex","ab_inp_con","ab_inp_int","ab_inp_wis","ab_inp_cha",
    ], true);

    setProfCheckboxesDisabled(true);

    $("equipEditBox").classList.remove("is-on");
    $("equipActions").style.display = "none";

    $("featureActions").style.display = "none";
    const fedit = $("featuresEditBox");
    if (fedit) fedit.innerHTML = "";

    if (reset) {
      // reset UI back to CHAR
      fillInputs();
      initProficiencies();
      renderCoinsAndEquip();
      renderFeatures();
      recalcAll();
    }

    showMsg("", "");
  }

  // ===== payload build =====
  function collectProfFromUI() {
    const saves = new Set();
    for (const [k] of SAVE_NAMES) {
      const cb = $(`save_prof_${k}`);
      if (cb && cb.checked) saves.add(k);
    }

    const skills = [];
    // keep DB's skills as labels (capitalized)
    for (const [key, label] of SKILLS) {
      const cb = $(`skill_prof_${key}`);
      if (cb && cb.checked) skills.push(label);
    }

    return { saves, skills };
  }

  function buildUpdatedNotes() {
    // keep old notes, but update Meta: SaveProficiencies and allow other lines stay
    const { saves } = collectProfFromUI();
    const keep = (NOTES_RAW || []).filter((x) => !/^Meta:\s*SaveProficiencies=/i.test(String(x || "")));

    keep.push(`Meta: SaveProficiencies=${Array.from(saves).join(",")}`);
    return keep;
  }

  function buildUpdatedEquipment() {
    // keep coins line from CHAR.equipment and replace equipment lines with EQUIP_LINES
    const original = Array.isArray(CHAR.equipment) ? CHAR.equipment.map((x) => String(x || "").trim()).filter(Boolean) : [];
    const coinLine = original.find((x) => /CP\s*=\s*\d+/i.test(x));
    const out = [];
    if (coinLine) out.push(coinLine);
    EQUIP_LINES.map((x) => String(x || "").trim()).filter(Boolean).forEach((x) => out.push(x));
    return out;
  }

  function buildPayload() {
    const level = Number($("inp_level")?.value ?? CHAR.level ?? 1);
    const stats = {};
    for (const [k] of ABILS) {
      const v = Number($(`ab_inp_${k}`)?.value ?? CHAR.stats?.[k] ?? 10);
      stats[k] = Number.isFinite(v) ? v : (CHAR.stats?.[k] ?? 10);
    }

    const { skills } = collectProfFromUI();

    return {
      name: String($("inp_name")?.value ?? CHAR.name ?? "").trim(),
      race: String($("inp_race")?.value ?? CHAR.race ?? "").trim(),
      class_name: String($("inp_class")?.value ?? CHAR.class_name ?? "").trim(),
      level: Number.isFinite(level) ? Math.max(1, Math.min(20, level)) : (CHAR.level ?? 1),
      alignment: String($("inp_alignment")?.value ?? CHAR.alignment ?? "").trim(),
      background: String($("inp_background")?.value ?? CHAR.background ?? "").trim(),
      description: String($("inp_description")?.value ?? CHAR.description ?? "").trim(),

      stats,
      ac: Number($("inp_ac")?.value ?? CHAR.ac ?? 10) || 0,
      hp: Number($("inp_hp")?.value ?? CHAR.hp ?? 10) || 0,
      speed: String($("inp_speed")?.value ?? CHAR.speed ?? "30 ft").trim(),

      senses: {
        passivePerception: Number($("inp_pa_perception")?.value ?? CHAR.senses?.passivePerception ?? 0) || 0,
        passiveInsight: Number($("inp_pa_insight")?.value ?? CHAR.senses?.passiveInsight ?? 0) || 0,
        passiveInvestigation: Number($("inp_pa_investigation")?.value ?? CHAR.senses?.passiveInvestigation ?? 0) || 0,
      },

      skills,
      equipment: buildUpdatedEquipment(),
      feature_lines: FEATURE_LINES.map((x) => String(x || "").trim()).filter(Boolean),
      notes: buildUpdatedNotes(),

      // keep defenses as-is (you can add UI later)
      resistances: Array.isArray(CHAR.resistances) ? CHAR.resistances : [],
      immunities: Array.isArray(CHAR.immunities) ? CHAR.immunities : [],
      vulnerabilities: Array.isArray(CHAR.vulnerabilities) ? CHAR.vulnerabilities : [],
      is_public: !!CHAR.is_public,
    };
  }

  // ===== API =====
  async function fetchPublic(id) {
    const res = await fetch(`/api/characters/public/${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data;
  }

  async function fetchPrivate(id) {
    const t = token();
    if (!t) throw new Error("Bạn cần đăng nhập để xem bản private.");
    const res = await fetch(`/api/characters/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data;
  }

  async function updateCharacter(id, payload) {
    const t = token();
    if (!t) throw new Error("Bạn cần đăng nhập để chỉnh sửa.");
    const res = await fetch(`/api/characters/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data;
  }

  // ===== UI wiring =====
  function wireTabs() {
    const tabs = document.querySelectorAll(".ch-tab");
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        const tab = btn.dataset.tab;
        document.querySelectorAll(".ch-panel").forEach((p) => p.classList.remove("ch-panel--active"));
        document.querySelector(`.ch-panel[data-panel="${tab}"]`)?.classList.add("ch-panel--active");
      });
    });
  }

  function wireRecalc() {
    // when editing stats/level/senses changes, recalc
    ["inp_level","inp_pa_perception","inp_pa_insight","inp_pa_investigation"].forEach((id) => {
      $(id)?.addEventListener("input", recalcAll);
    });
    ["ab_inp_str","ab_inp_dex","ab_inp_con","ab_inp_int","ab_inp_wis","ab_inp_cha"].forEach((id) => {
      $(id)?.addEventListener("input", recalcAll);
    });

    // save/skill prof checkboxes
    for (const [k] of SAVE_NAMES) {
      $(`save_prof_${k}`)?.addEventListener("change", () => {
        const cb = $(`save_prof_${k}`);
        if (cb?.checked) PROF_SAVES.add(k);
        else PROF_SAVES.delete(k);
        recalcAll();
      });
    }
    for (const [key] of SKILLS) {
      $(`skill_prof_${key}`)?.addEventListener("change", () => {
        const cb = $(`skill_prof_${key}`);
        if (cb?.checked) PROF_SKILLS.add(key);
        else PROF_SKILLS.delete(key);
        recalcAll();
      });
    }
  }

  function wireEditButtons() {
    $("editBtn")?.addEventListener("click", () => enterEdit());
    $("cancelBtn")?.addEventListener("click", () => exitEdit(true));

    $("saveBtn")?.addEventListener("click", async () => {
      try {
        showMsg("Đang lưu…", "");
        const id = getId();
        const payload = buildPayload();
        const updated = await updateCharacter(id, payload);

        // refresh with returned data if server returns full object,
        // otherwise merge payload into CHAR
        CHAR = updated && updated.id ? updated : { ...CHAR, ...payload };
        NOTES_RAW = Array.isArray(CHAR.notes) ? CHAR.notes.slice() : payload.notes.slice();

        renderAll();
        exitEdit(false);
        showMsg("Đã lưu thay đổi.", "ok");
      } catch (e) {
        showMsg(String(e?.message || e || "Lưu thất bại"), "err");
      }
    });

    // inventory add line
    $("addEquipLineBtn")?.addEventListener("click", () => {
      EQUIP_LINES.push("");
      renderEquipEditor();
      renderEquipList();
    });

    // feature add
    $("addFeatureBtn")?.addEventListener("click", () => {
      FEATURE_LINES.push("");
      renderFeaturesEditor();
      renderFeatures();
    });
  }

  // ===== render all =====
  function renderAll() {
    renderHero();
    fillInputs();

    // defenses chips
    renderChips("chips_res", CHAR.resistances);
    renderChips("chips_imm", CHAR.immunities);
    renderChips("chips_vul", CHAR.vulnerabilities);

    // coins / equip / features / notes / spells / attacks
    renderCoinsAndEquip();
    renderFeatures();
    renderNotesRemainder();
    renderSpells();
    renderAttacks();

    // init profs based on db/meta
    initProficiencies();

    // derived numbers
    recalcAll();
  }

  // ===== boot =====
  async function boot() {
    const id = getId();
    if (!id) {
      showMsg("Thiếu id nhân vật. Mở theo dạng: character.html?id=123", "err");
      return;
    }

    buildAbilitiesGrid();
    buildSaveList();
    buildSkillsList();
    wireTabs();
    wireEditButtons();
    wireRecalc();

    // start locked
    setDisabled([
      "inp_name","inp_race","inp_class","inp_level","inp_alignment","inp_background","inp_description",
      "inp_pa_perception","inp_pa_insight","inp_pa_investigation",
      "inp_ac","inp_hp","inp_speed",
      "ab_inp_str","ab_inp_dex","ab_inp_con","ab_inp_int","ab_inp_wis","ab_inp_cha",
    ], true);
    setProfCheckboxesDisabled(true);

    try {
      // try public first (works for everyone)
      CHAR = await fetchPublic(id);
    } catch (e1) {
      // fallback to private (owner/admin)
      try {
        CHAR = await fetchPrivate(id);
      } catch (e2) {
        showMsg(String(e2?.message || e2 || "Không thể tải nhân vật"), "err");
        return;
      }
    }

    // normalize notes
    NOTES_RAW = Array.isArray(CHAR.notes) ? CHAR.notes.slice() : [];

    renderAll();
    showMsg("", "");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
