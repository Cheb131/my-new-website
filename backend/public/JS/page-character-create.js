// public/JS/page-character-create.js
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  function num(id, fallback = 0) {
    const v = Number($(id)?.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function str(id, fallback = "") {
    return String($(id)?.value ?? fallback).trim();
  }

  function token() {
    return localStorage.getItem("token") || "";
  }

  function showMsg(msg, ok = false) {
    const box = $("publishMsg");
    if (!box) return;
    box.style.color = ok ? "#166534" : "#b91c1c";
    box.textContent = msg || "";
  }

  // =========================
  // Proficiency bonus by level (5e)
  // =========================
  function profBonusFromLevel(level) {
    const lv = Math.max(1, Math.min(20, Number(level) || 1));
    if (lv <= 4) return 2;
    if (lv <= 8) return 3;
    if (lv <= 12) return 4;
    if (lv <= 16) return 5;
    return 6;
  }

  // =========================
  // Dynamic simple list (Train/Prof/Action/Feature)
  // =========================
  function addSimpleRow(listEl, placeholder = "Nhập...") {
    const row = document.createElement("div");
    row.className = "cc-list-row";
    row.style.display = "flex";
    row.style.gap = "10px";
    row.style.margin = "6px 0";

    row.innerHTML = `
      <input class="cc-list-input" style="flex:1; min-width:0;" placeholder="${esc(placeholder)}" />
      <button type="button" class="cc-btn danger" style="padding:6px 10px;">✕</button>
    `;

    row.querySelector("button")?.addEventListener("click", () => row.remove());
    listEl.appendChild(row);
  }

  function readSimpleList(listEl) {
    return Array.from(listEl.querySelectorAll("input.cc-list-input"))
      .map((i) => String(i.value || "").trim())
      .filter(Boolean);
  }

  // =========================
  // Spells table rows
  // =========================
  function addSpellRow({ isCantrip = false } = {}) {
    const body = $("spellTbody");
    if (!body) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="sp-prep" type="checkbox"></td>
      <td><input class="sp-name" type="text" placeholder="Tên spell"></td>
      <td><input class="sp-save" type="text" placeholder="Save/Atk"></td>
      <td><input class="sp-time" type="text" placeholder="1 Action"></td>
      <td><input class="sp-range" type="text" placeholder="60 ft"></td>
      <td><input class="sp-comp" type="text" placeholder="V,S,M"></td>
      <td><input class="sp-dur" type="text" placeholder="Instant"></td>
      <td><input class="sp-notes" type="text" placeholder="Notes"></td>
      <td class="col-x"><button type="button" class="cc-btn danger" style="padding:6px 10px;">✕</button></td>
    `;

    // cantrip: gợi ý level C bằng notes token, vì bảng create không có cột level
    if (isCantrip) {
      tr.dataset.cantrip = "1";
      tr.querySelector(".sp-notes").placeholder = "Cantrip (ghi thêm notes nếu muốn)";
    }

    tr.querySelector("button")?.addEventListener("click", () => tr.remove());
    body.appendChild(tr);
  }

  function readSpellsToNotes() {
    const body = $("spellTbody");
    if (!body) return [];

    const rows = Array.from(body.querySelectorAll("tr"));
    const out = [];

    for (const tr of rows) {
      const prepared = !!tr.querySelector(".sp-prep")?.checked;
      const name = String(tr.querySelector(".sp-name")?.value || "").trim();
      const saveAtk = String(tr.querySelector(".sp-save")?.value || "").trim();
      const time = String(tr.querySelector(".sp-time")?.value || "").trim();
      const range = String(tr.querySelector(".sp-range")?.value || "").trim();
      const comp = String(tr.querySelector(".sp-comp")?.value || "").trim();
      const dur = String(tr.querySelector(".sp-dur")?.value || "").trim();
      const notes = String(tr.querySelector(".sp-notes")?.value || "").trim();
      const isCantrip = tr.dataset.cantrip === "1";

      if (!name) continue;

      // format mà character.js parseSpellLine hiểu
      const parts = [];
      parts.push(`${prepared ? "[P] " : ""}${name}`);
      parts.push(`Level:${isCantrip ? "C" : "-"}`);
      if (saveAtk) parts.push(`Save/Atk:${saveAtk}`);
      if (time) parts.push(`Time:${time}`);
      if (range) parts.push(`Range:${range}`);
      if (comp) parts.push(`Comp:${comp}`);
      if (dur) parts.push(`Dur:${dur}`);
      parts.push(`Page:-`);
      if (notes) parts.push(`Notes:${notes}`);

      out.push(`Spell: ${parts.join(" | ")}`);
    }

    return out;
  }

  // =========================
  // Attacks rows (div-based)
  // =========================
  function addAttackRow() {
    const box = $("attackRows");
    if (!box) return;

    const row = document.createElement("div");
    row.className = "cc-attack-row";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "2fr 1fr 1.5fr 2fr auto";
    row.style.gap = "10px";
    row.style.alignItems = "center";
    row.style.margin = "8px 0";

    row.innerHTML = `
      <input class="atk-name" placeholder="NAME">
      <input class="atk-hit" placeholder="HIT">
      <input class="atk-dmg" placeholder="DAMAGE/TYPE">
      <input class="atk-notes" placeholder="NOTES">
      <button type="button" class="cc-btn danger" style="padding:6px 10px;">✕</button>
    `;

    row.querySelector("button")?.addEventListener("click", () => row.remove());
    box.appendChild(row);
  }

  function readAttacksToNotes() {
    const box = $("attackRows");
    if (!box) return [];
    const rows = Array.from(box.querySelectorAll(".cc-attack-row"));

    const out = [];
    for (const r of rows) {
      const name = String(r.querySelector(".atk-name")?.value || "").trim();
      const hit = String(r.querySelector(".atk-hit")?.value || "").trim();
      const dmg = String(r.querySelector(".atk-dmg")?.value || "").trim();
      const notes = String(r.querySelector(".atk-notes")?.value || "").trim();
      if (!name) continue;
      out.push(`Attack: ${[name, hit, dmg, notes].join(" | ").trim()}`);
    }
    return out;
  }

  // =========================
  // Equipment rows (3 blocks)
  // =========================
  function equipRowTpl() {
    const row = document.createElement("div");
    row.className = "cc-eq-row";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "2fr 1fr 1fr auto";
    row.style.gap = "10px";
    row.style.alignItems = "center";
    row.style.margin = "8px 0";
    row.innerHTML = `
      <input class="eq-name" placeholder="NAME">
      <input class="eq-qty" type="number" min="0" value="1" placeholder="QTY">
      <input class="eq-wt" type="number" min="0" step="0.1" value="0" placeholder="WEIGHT">
      <button type="button" class="cc-btn danger" style="padding:6px 10px;">✕</button>
    `;
    row.querySelector("button")?.addEventListener("click", () => row.remove());
    return row;
  }

  function addEquipRow(targetId) {
    const box = $(targetId);
    if (!box) return;
    box.appendChild(equipRowTpl());
  }

  function readEquipBox(targetId, label) {
    const box = $(targetId);
    if (!box) return [];
    const rows = Array.from(box.querySelectorAll(".cc-eq-row"));
    const out = [];
    for (const r of rows) {
      const name = String(r.querySelector(".eq-name")?.value || "").trim();
      const qty = Number(r.querySelector(".eq-qty")?.value ?? 0);
      const wt = Number(r.querySelector(".eq-wt")?.value ?? 0);
      if (!name) continue;
      const q = Number.isFinite(qty) ? qty : 0;
      const w = Number.isFinite(wt) ? wt : 0;
      out.push(`${label}: ${name} x${q} (wt ${w})`);
    }
    return out;
  }

  // =========================
  // Skills + Saving throws (checkbox ids)
  // =========================
  const SKILL_MAP = [
    ["p_acrobatics", "Acrobatics"],
    ["p_animalHandling", "Animal Handling"],
    ["p_arcana", "Arcana"],
    ["p_athletics", "Athletics"],
    ["p_deception", "Deception"],
    ["p_history", "History"],
    ["p_insight", "Insight"],
    ["p_intimidation", "Intimidation"],
    ["p_investigation", "Investigation"],
    ["p_medicine", "Medicine"],
    ["p_nature", "Nature"],
    ["p_perception", "Perception"],
    ["p_performance", "Performance"],
    ["p_persuasion", "Persuasion"],
    ["p_religion", "Religion"],
    ["p_sleightOfHand", "Sleight of Hand"],
    ["p_stealth", "Stealth"],
    ["p_survival", "Survival"],
  ];

  const SAVE_MAP = [
    ["saveProf_str", "str"],
    ["saveProf_dex", "dex"],
    ["saveProf_con", "con"],
    ["saveProf_int", "int"],
    ["saveProf_wis", "wis"],
    ["saveProf_cha", "cha"],
  ];

  // =========================
  // Defenses checkboxes
  // =========================
  function readCheckedInBox(boxId) {
    return Array.from(document.querySelectorAll(`#${boxId} input[type="checkbox"]:checked`))
      .map((i) => String(i.value || "").trim())
      .filter(Boolean);
  }

  // =========================
  // Build payload (match backend schema)
  // =========================
  function buildPayload() {
    const level = num("level", 1);
    const profBonus = num("proficiencyBonus", profBonusFromLevel(level));

    const skills = SKILL_MAP
      .filter(([id]) => !!$(id)?.checked)
      .map(([, name]) => name);

    const saveProfs = SAVE_MAP
      .filter(([id]) => !!$(id)?.checked)
      .map(([, key]) => key);

    const train = readSimpleList($("trainList") || document.createElement("div"));
    const prof = readSimpleList($("proficiencyList") || document.createElement("div"));
    const action = readSimpleList($("actionList") || document.createElement("div"));
    const features = readSimpleList($("featureList") || document.createElement("div"));

    const notes = [];

    // meta/combat stuff
    notes.push(`Meta: Initiative=${num("initiative", 0)}`);
    notes.push(`Meta: ProficiencyBonus=${profBonus}`);
    notes.push(`Meta: HitDice=${str("hitDice", "")}`);
    notes.push(`Meta: AbilitySaveDC=${num("abilitySaveDc", 0)}`);
    notes.push(`Meta: CurrentHP=${num("currentHp", 0)}`);
    notes.push(`Meta: DeathSaveSuccess=${["ds_s1","ds_s2","ds_s3"].filter((x)=>$(x)?.checked).length}`);
    notes.push(`Meta: DeathSaveFail=${["ds_f1","ds_f2","ds_f3"].filter((x)=>$(x)?.checked).length}`);
    notes.push(`Meta: HeroicInspiration=${$( "heroicInspiration")?.checked ? "true" : "false"}`);

    // saving throw profs as meta too (để view tính đúng)
    notes.push(`Meta: SaveProficiencies=${saveProfs.join(",")}`);

    // Train/Prof/Action -> notes prefixes (character.js đang render theo prefixes)
    train.forEach((x) => notes.push(`Train: ${x}`));
    prof.forEach((x) => notes.push(`Proficiency: ${x}`));
    action.forEach((x) => notes.push(`Action: ${x}`));

    // Attacks / Spells -> notes prefixes
    readAttacksToNotes().forEach((x) => notes.push(x));
    readSpellsToNotes().forEach((x) => notes.push(x));

    // Equipment array: gom coins + rows
    const equipment = [];
    equipment.push(`Coins: CP=${num("coin_cp",0)} SP=${num("coin_sp",0)} EP=${num("coin_ep",0)} GP=${num("coin_gp",0)} PP=${num("coin_pp",0)}`);
    readEquipBox("equipColA", "EquipA").forEach((x) => equipment.push(x));
    readEquipBox("equipColB", "EquipB").forEach((x) => equipment.push(x));
    readEquipBox("equipAttuned", "Attuned").forEach((x) => equipment.push(x));

    // Defenses arrays
    const resistances = readCheckedInBox("resistancesBox");
    const immunities = readCheckedInBox("immunitiesBox");
    const vulnerabilities = readCheckedInBox("vulnerabilitiesBox");

    // Senses object (khớp backend schema)
    const senses = {
      passivePerception: num("pa_perception", 0),
      passiveInsight: num("pa_insight", 0),
      passiveInvestigation: num("pa_investigation", 0),
    };

    const payload = {
      name: str("name"),
      race: str("race"),
      class_name: str("class"),
      level,
      alignment: str("alignment"),
      background: str("background"),
      avatar: "",        // nếu bạn thêm input avatar sau thì đổi tại đây
      description: "",   // nếu bạn thêm textarea description sau thì đổi tại đây

      stats: {
        str: num("str", 10),
        dex: num("dex", 10),
        con: num("con", 10),
        int: num("int", 10),
        wis: num("wis", 10),
        cha: num("cha", 10),
      },

      hp: num("hp", 10),
      ac: num("ac", 10),
      speed: str("speed", "30 ft"),

      skills,           // array
      equipment,        // array
      notes,            // array
      feature_lines: features,

      resistances,
      immunities,
      vulnerabilities,
      senses,

      is_public: true,
    };

    return payload;
  }

  // =========================
  // Submit create
  // =========================
  async function submitCharacter() {
    showMsg("");

    const t = token();
    if (!t) {
      showMsg("Bạn cần đăng nhập trước.");
      return;
    }

    const payload = buildPayload();

    if (!payload.name || !payload.race || !payload.class_name) {
      showMsg("Thiếu thông tin bắt buộc: Tên / Chủng tộc / Lớp.");
      return;
    }

    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg(data?.message || `Tạo nhân vật thất bại (${res.status})`);
        return;
      }

      showMsg("Tạo nhân vật thành công! Đang chuyển trang…", true);
      const newId = data?.id;
      if (newId) {
        location.href = `character.html?id=${encodeURIComponent(newId)}`;
      }
    } catch (e) {
      showMsg("Lỗi mạng hoặc server không phản hồi.");
    }
  }

  // =========================
  // Boot & bind UI buttons
  // =========================
  function boot() {
    // Simple lists
    const trainList = $("trainList");
    const profList = $("proficiencyList");
    const actionList = $("actionList");
    const featureList = $("featureList");

    $("addTrainBtn")?.addEventListener("click", () => trainList && addSimpleRow(trainList, "Train..."));
    $("clearTrainBtn")?.addEventListener("click", () => { if (trainList) trainList.innerHTML = ""; });

    $("addProficiencyBtn")?.addEventListener("click", () => profList && addSimpleRow(profList, "Proficiency..."));
    $("clearProficiencyBtn")?.addEventListener("click", () => { if (profList) profList.innerHTML = ""; });

    $("addActionBtn")?.addEventListener("click", () => actionList && addSimpleRow(actionList, "Action..."));
    $("clearActionBtn")?.addEventListener("click", () => { if (actionList) actionList.innerHTML = ""; });

    $("addFeatureBtn")?.addEventListener("click", () => featureList && addSimpleRow(featureList, "Feature..."));
    $("clearFeatureBtn")?.addEventListener("click", () => { if (featureList) featureList.innerHTML = ""; });

    // Spells
    $("addSpellRowBtn")?.addEventListener("click", () => addSpellRow({ isCantrip: false }));
    $("addCantripRowBtn")?.addEventListener("click", () => addSpellRow({ isCantrip: true }));
    $("clearSpellsBtn")?.addEventListener("click", () => { const b = $("spellTbody"); if (b) b.innerHTML = ""; });

    // Attacks
    $("addAttackRowBtn")?.addEventListener("click", addAttackRow);
    $("clearAttacksBtn")?.addEventListener("click", () => { const b = $("attackRows"); if (b) b.innerHTML = ""; addAttackRow(); });

    // Equipment
    $("addEquipA")?.addEventListener("click", () => addEquipRow("equipColA"));
    $("addEquipB")?.addEventListener("click", () => addEquipRow("equipColB"));
    $("addEquipAttuned")?.addEventListener("click", () => addEquipRow("equipAttuned"));
    $("clearEquipAll")?.addEventListener("click", () => {
      ["equipColA","equipColB","equipAttuned"].forEach((id) => { const box = $(id); if (box) box.innerHTML = ""; });
    });

    // Def all clear
    $("defAllClear")?.addEventListener("click", () => {
      ["resistancesBox", "immunitiesBox", "vulnerabilitiesBox"].forEach((bid) => {
        document.querySelectorAll(`#${bid} input[type="checkbox"]`).forEach((cb) => (cb.checked = false));
      });
    });

    // Submit
    $("publishCharacterBtn")?.addEventListener("click", submitCharacter);

    // seed a few rows
    addSimpleRow(trainList, "Train...");
    addSimpleRow(profList, "Proficiency...");
    addSimpleRow(actionList, "Action...");
    addSimpleRow(featureList, "Feature...");

    addSpellRow({ isCantrip: false });
    addAttackRow();
    addEquipRow("equipColA");
    addEquipRow("equipColB");
    addEquipRow("equipAttuned");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
