(() => {
  "use strict";

  // =========================
  // Helpers
  // =========================
  const $ = (id) => document.getElementById(id);
  const num = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  const clampMin = (v, min) => (v < min ? min : v);

  function modFromScore(score) {
    const s = num(score);
    return Math.floor((s - 10) / 2);
  }
  function fmtMod(m) {
    return m >= 0 ? `+${m}` : `${m}`;
  }

  // =========================
  // Ability MOD labels
  // =========================
  function wireAbilityScore(id) {
    const inp = $(id);
    const out = $(`mod_${id}`);
    if (!inp || !out) return;

    const update = () => (out.textContent = fmtMod(modFromScore(inp.value)));
    inp.addEventListener("input", update);
    update();
  }

  // =========================================================
  // 1) Spells Table
  // required:
  // - #spellTbody, #spellsJson
  // - #addSpellRowBtn, #addCantripRowBtn, #clearSpellsBtn
  // =========================================================
  const SPELL_KEYS = ["name", "source", "saveAtk", "time", "range", "comp", "duration", "pageRef", "notes"];

  function spellRowTemplate(data = {}) {
    const d = {
      prepared: !!data.prepared,
      level: String(data.level ?? "1"), // "0" = cantrip
      name: data.name || "",
      source: data.source || "",
      saveAtk: data.saveAtk || "",
      time: data.time || "",
      range: data.range || "",
      comp: data.comp || "",
      duration: data.duration || "",
      pageRef: data.pageRef || "",
      notes: data.notes || "",
    };

    const tr = document.createElement("tr");
    tr.dataset.level = d.level;

    const tdPrep = document.createElement("td");
    tdPrep.className = "cc-center";
    const prep = document.createElement("input");
    prep.type = "checkbox";
    prep.checked = d.prepared;
    tdPrep.appendChild(prep);
    tr.appendChild(tdPrep);

    function tdInput(key, placeholder) {
      const td = document.createElement("td");
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = d[key] || "";
      inp.placeholder = placeholder || "";
      inp.dataset.key = key;
      td.appendChild(inp);
      return td;
    }

    tr.appendChild(tdInput("name", "Tên spell"));
    tr.appendChild(tdInput("source", "PHB / Class"));
    tr.appendChild(tdInput("saveAtk", "WIS 13 / +5"));
    tr.appendChild(tdInput("time", "1A / 1BA"));
    tr.appendChild(tdInput("range", "60 ft"));
    tr.appendChild(tdInput("comp", "V,S,M"));
    tr.appendChild(tdInput("duration", "Instant"));
    tr.appendChild(tdInput("pageRef", "PHB 221"));
    tr.appendChild(tdInput("notes", ""));

    const tdDel = document.createElement("td");
    tdDel.className = "cc-center";
    const del = document.createElement("button");
    del.type = "button";
    del.className = "cc-delbtn";
    del.textContent = "✕";
    del.addEventListener("click", () => {
      tr.remove();
      syncSpellsJson();
    });
    tdDel.appendChild(del);
    tr.appendChild(tdDel);

    const sync = () => syncSpellsJson();
    prep.addEventListener("change", sync);
    tr.addEventListener("input", sync);

    return tr;
  }

  function readSpellsTable() {
    const rows = Array.from(document.querySelectorAll("#spellTbody tr"));
    return rows
      .map((tr) => {
        const prepared = !!tr.querySelector('td input[type="checkbox"]')?.checked;
        const inputs = Array.from(tr.querySelectorAll('td input[type="text"]'));
        const obj = { prepared, level: tr.dataset.level || "1" };

        inputs.forEach((inp) => {
          const k = inp.dataset.key;
          if (SPELL_KEYS.includes(k)) obj[k] = (inp.value || "").trim();
        });

        return obj;
      })
      .filter((s) => (s.name || "").trim().length > 0);
  }

  function syncSpellsJson() {
    const hidden = $("spellsJson");
    if (!hidden) return;
    hidden.value = JSON.stringify(readSpellsTable());
  }

  // Expose for publish handler
  window.appendSpellsToNotes = function appendSpellsToNotes(notesArr) {
    let spells = [];
    try {
      spells = JSON.parse($("spellsJson")?.value || "[]");
    } catch (_) {}
    if (!Array.isArray(spells) || spells.length === 0) return;

    spells.forEach((s) => {
      notesArr.push(
        `Spell: ${s.prepared ? "[P] " : ""}${s.name}` +
          ` | Src:${s.source || "-"}` +
          ` | Save/Atk:${s.saveAtk || "-"}` +
          ` | Time:${s.time || "-"}` +
          ` | Range:${s.range || "-"}` +
          ` | Comp:${s.comp || "-"}` +
          ` | Dur:${s.duration || "-"}` +
          ` | Page:${s.pageRef || "-"}` +
          ` | Notes:${s.notes || ""}`
      );
    });
  };

  // =========================================================
  // 2) Equipment (Coins + columns + attuned)
  // =========================================================
  function buildEquipRow({ name = "", qty = 1, weight = 0 } = {}) {
    const row = document.createElement("div");
    row.className = "cc-equip-row";

    const nameInp = document.createElement("input");
    nameInp.type = "text";
    nameInp.placeholder = "Item name";
    nameInp.value = name;

    const qtyInp = document.createElement("input");
    qtyInp.type = "number";
    qtyInp.min = "0";
    qtyInp.value = String(qty);

    const wInp = document.createElement("input");
    wInp.type = "number";
    wInp.min = "0";
    wInp.step = "0.1";
    wInp.placeholder = "lb.";
    wInp.value = String(weight);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "cc-delbtn";
    del.textContent = "✕";
    del.addEventListener("click", () => {
      row.remove();
      syncEquipmentJson();
    });

    const sync = () => syncEquipmentJson();
    nameInp.addEventListener("input", sync);
    qtyInp.addEventListener("input", sync);
    wInp.addEventListener("input", sync);

    row.appendChild(nameInp);
    row.appendChild(qtyInp);
    row.appendChild(wInp);
    row.appendChild(del);

    return row;
  }

  function readRows(containerId, kind) {
    const box = $(containerId);
    if (!box) return [];
    const rows = Array.from(box.querySelectorAll(".cc-equip-row"));

    return rows
      .map((r) => {
        const inputs = r.querySelectorAll("input");
        const name = (inputs[0].value || "").trim();
        const qty = num(inputs[1].value);
        const weight = num(inputs[2].value);
        return { kind, name, qty, weight };
      })
      .filter((i) => i.name);
  }

  function readCoins() {
    return {
      cp: num($("coin_cp")?.value),
      sp: num($("coin_sp")?.value),
      ep: num($("coin_ep")?.value),
      gp: num($("coin_gp")?.value),
      pp: num($("coin_pp")?.value),
    };
  }

  function totalWeight(items) {
    return items.reduce((sum, i) => sum + num(i.qty) * num(i.weight), 0);
  }

  function getSTR() {
    return clampMin(num($("str")?.value || 10), 1);
  }

  function syncEquipmentJson() {
    const items = [
      ...readRows("equipColA", "equipment"),
      ...readRows("equipColB", "equipment"),
      ...readRows("equipAttuned", "attuned"),
    ];

    const coins = readCoins();

    const w = totalWeight(items);
    const str = getSTR();

    $("weightCarried") && ($("weightCarried").textContent = String(Math.round(w * 10) / 10));
    $("encumberedAt") && ($("encumberedAt").textContent = String(5 * str));
    $("pushDragLift") && ($("pushDragLift").textContent = String(30 * str));

    const eqHidden = $("equipmentJson");
    if (eqHidden) eqHidden.value = JSON.stringify(items);

    const coinHidden = $("coinsJson");
    if (coinHidden) coinHidden.value = JSON.stringify(coins);
  }

  // =========================================================
  // 3) Feature list (Train/Proficiency/Action)
  // =========================================================
  function initFeatureLists() {
    const hidden = $("featureListJson");
    const trainList = $("trainList");
    const proficiencyList = $("proficiencyList");
    const actionList = $("actionList");
    const featureList = $("featureList");

    if (!hidden) return;

    function readList(listEl) {
      if (!listEl) return [];
      const inputs = Array.from(listEl.querySelectorAll(".cc-listrow input[type='text']"));
      return inputs.map((i) => (i.value || "").trim()).filter(Boolean);
    }

    function sync() {
      hidden.value = JSON.stringify({
        train: readList(trainList),
        proficiency: readList(proficiencyList),
        action: readList(actionList),
        feature: readList(featureList),
      });
    }

    function addRow(listEl, placeholder, value = "") {
      if (!listEl) return null;

      const row = document.createElement("div");
      row.className = "cc-listrow";

      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = placeholder;
      inp.value = value;

      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const next = addRow(listEl, placeholder, "");
          next && next.focus();
        }
        if (e.key === "Tab") {
          e.preventDefault();
          const start = inp.selectionStart ?? inp.value.length;
          const end = inp.selectionEnd ?? inp.value.length;
          inp.value = inp.value.slice(0, start) + "  " + inp.value.slice(end);
          inp.selectionStart = inp.selectionEnd = start + 2;
          sync();
        }
      });

      inp.addEventListener("input", sync);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "cc-delbtn";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        row.remove();
        sync();
      });

      row.appendChild(inp);
      row.appendChild(del);
      listEl.appendChild(row);
      sync();
      return inp;
    }

    // TRAIN
    $("addTrainBtn")?.addEventListener("click", () => {
      const inp = addRow(trainList, "Ví dụ: Fighting Style: Archery");
      inp && inp.focus();
    });
    $("clearTrainBtn")?.addEventListener("click", () => {
      if (trainList) trainList.innerHTML = "";
      sync();
    });

    // PROFICIENCY
    $("addProficiencyBtn")?.addEventListener("click", () => {
      const inp = addRow(proficiencyList, "Ví dụ: Armor: Light, Medium");
      inp && inp.focus();
    });
    $("clearProficiencyBtn")?.addEventListener("click", () => {
      if (proficiencyList) proficiencyList.innerHTML = "";
      sync();
    });

    // ACTION
    $("addActionBtn")?.addEventListener("click", () => {
      const inp = addRow(actionList, "Ví dụ: Sneak Attack 2d6");
      inp && inp.focus();
    });
    $("clearActionBtn")?.addEventListener("click", () => {
      if (actionList) actionList.innerHTML = "";
      sync();
    });

    // FEATURE
    $("addFeatureBtn")?.addEventListener("click", () => {
      const inp = addRow(featureList, "Ví dụ: Darkvision 60 ft / Rage / Second Wind...");
      inp && inp.focus();
    });
    $("clearFeatureBtn")?.addEventListener("click", () => {
      if (featureList) featureList.innerHTML = "";
      sync();
    });

    sync();
  }


  // =========================================================
  // 4) Attacks table -> attacksJson
  // =========================================================
  function initAttacks() {
    const rowsEl = $("attackRows");
    const addBtn = $("addAttackRowBtn");
    const clearBtn = $("clearAttacksBtn");
    const hidden = $("attacksJson");
    if (!rowsEl || !addBtn || !clearBtn || !hidden) return;

    function readAll() {
      const rows = Array.from(rowsEl.querySelectorAll(".cc-attack-row"));
      return rows
        .map((r) => {
          const inputs = r.querySelectorAll("input");
          const name = (inputs[0]?.value || "").trim();
          const hit = (inputs[1]?.value || "").trim();
          const damage = (inputs[2]?.value || "").trim();
          const notes = (inputs[3]?.value || "").trim();
          return { name, hit, damage, notes };
        })
        .filter((x) => x.name || x.hit || x.damage || x.notes);
    }

    function sync() {
      hidden.value = JSON.stringify(readAll());
    }

    function addRow(data = {}) {
      const row = document.createElement("div");
      row.className = "cc-attack-row";

      const inpName = document.createElement("input");
      inpName.placeholder = "Shortbow";
      inpName.value = data.name || "";

      const inpHit = document.createElement("input");
      inpHit.placeholder = "+6";
      inpHit.value = data.hit || "";

      const inpDmg = document.createElement("input");
      inpDmg.placeholder = "1d6+3 Piercing";
      inpDmg.value = data.damage || "";

      const inpNotes = document.createElement("input");
      inpNotes.placeholder = "Simple, Ammunition, Range (80/320)...";
      inpNotes.value = data.notes || "";

      const del = document.createElement("button");
      del.type = "button";
      del.className = "cc-attack-del";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        row.remove();
        sync();
      });

      [inpName, inpHit, inpDmg, inpNotes].forEach((inp) => {
        inp.addEventListener("input", sync);
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addRow({}).focus();
          }
        });
      });

      row.appendChild(inpName);
      row.appendChild(inpHit);
      row.appendChild(inpDmg);
      row.appendChild(inpNotes);
      row.appendChild(del);

      rowsEl.appendChild(row);
      sync();
      return inpName;
    }

    addBtn.addEventListener("click", () => addRow({}).focus());
    clearBtn.addEventListener("click", () => {
      rowsEl.innerHTML = "";
      sync();
    });

    // restore if any
    try {
      const existing = JSON.parse(hidden.value || "[]");
      if (Array.isArray(existing) && existing.length) {
        existing.forEach((item) => addRow(item));
        return;
      }
    } catch (_) {}

    sync();
  }

function wireAutoCalc() {
  const ABIL = ["str", "dex", "con", "int", "wis", "cha"];

  // skill input id -> ability
  const SKILL_MAP = [
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

  const n = (v, fallback = 0) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : fallback;
  };

  const mod = (score) => Math.floor((n(score, 10) - 10) / 2);

  // D&D 5e: PB = 2 + floor((level-1)/4)
  function profFromLevel() {
    const lv = Math.max(1, Math.min(20, n($("level")?.value, 1)));
    return 2 + Math.floor((lv - 1) / 4);
  }

  function getProfBonus() {
    const pbEl = $("proficiencyBonus");
    if (!pbEl) return profFromLevel();

    const raw = n(pbEl.value, 0);
    if (raw && raw !== 0) return raw;     // người dùng nhập
    return profFromLevel();               // auto nếu trống/0
  }

  function setIfExists(id, value) {
    const el = $(id);
    if (!el) return;
    el.value = String(value);
  }

  function calcSaving(abilKey) {
    const total = mod($(abilKey)?.value) + ($(`saveProf_${abilKey}`)?.checked ? getProfBonus() : 0);
    setIfExists(`save_${abilKey}`, total);
    return total;
  }

  function calcSkill(skillId, abilKey) {
    const total = mod($(abilKey)?.value) + ($(`p_${skillId}`)?.checked ? getProfBonus() : 0);
    setIfExists(skillId, total);
    return total;
  }

  function calcPassives() {
    // Passive = 10 + skill total
    const per = n($("perception")?.value, 0);
    const ins = n($("insight")?.value, 0);
    const inv = n($("investigation")?.value, 0);

    setIfExists("pa_perception", 10 + per);
    setIfExists("pa_insight", 10 + ins);
    setIfExists("pa_investigation", 10 + inv);
  }

  function calcAll() {
    // Saving throws
    ABIL.forEach(calcSaving);

    // Skills
    SKILL_MAP.forEach(([skillId, abilKey]) => calcSkill(skillId, abilKey));

    // Passives
    calcPassives();
  }

  // ====== Bind events ======
  // abilities + level + prof bonus
  ABIL.forEach((a) => $(a)?.addEventListener("input", calcAll));
  $("level")?.addEventListener("input", () => {
    // nếu user đang để PB trống/0, sẽ auto đổi theo level
    calcAll();
  });
  $("proficiencyBonus")?.addEventListener("input", calcAll);

  // save prof toggles
  ABIL.forEach((a) => $(`saveProf_${a}`)?.addEventListener("change", calcAll));

  // skill prof toggles
  SKILL_MAP.forEach(([skillId]) => $(`p_${skillId}`)?.addEventListener("change", calcAll));

  // run once
  calcAll();
}


  // =========================================================
  // 6) Publish (ai cũng đăng) -> POST /api/characters
  // =========================================================
  function initPublish() {
    const publishBtn = $("publishCharacterBtn");
    const msg = $("publishMsg");
    if (!publishBtn) return;

    const show = (m, err = true) => {
      if (!msg) return;
      msg.style.color = err ? "#b91c1c" : "#166534";
      msg.textContent = m;
    };

    function safeJson(id, fallback) {
      const el = $(id);
      if (!el) return fallback;
      try {
        return JSON.parse(el.value || "");
      } catch {
        return fallback;
      }
    }

    function featureJsonToNotes() {
      const obj = safeJson("featureListJson", null);
      if (!obj || typeof obj !== "object") return [];
      const out = [];
      const add = (label, arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((x) => {
          const s = String(x || "").trim();
          if (s) out.push(`${label}: ${s}`);
        });
      };
      add("Train", obj.train);
      add("Proficiency", obj.proficiency);
      add("Action", obj.action);
      add("Feature", obj.feature);

      return out;
    }

    function attacksJsonToNotes() {
      const rows = safeJson("attacksJson", []);
      if (!Array.isArray(rows)) return [];
      return rows
        .map((r) => {
          const name = String(r?.name || "").trim();
          const hit = String(r?.hit || "").trim();
          const dmg = String(r?.damage || "").trim();
          const notes = String(r?.notes || "").trim();
          if (!name && !hit && !dmg && !notes) return "";
          return `Attack: ${name || "-"} | Hit:${hit || "-"} | Dmg:${dmg || "-"} | Notes:${notes || "-"}`;
        })
        .filter(Boolean);
    }

    function equipmentToTextList() {
      const arr = safeJson("equipmentJson", []);
      if (!Array.isArray(arr)) return [];
      return arr
        .map((i) => {
          const n = String(i?.name || "").trim();
          if (!n) return "";
          const qty = i?.qty ?? 1;
          const w = i?.weight ?? 0;
          return `${n} x${qty} (${w} lb)`;
        })
        .filter(Boolean);
    }

    function buildPayload() {
      const notes = [...featureJsonToNotes(), ...attacksJsonToNotes()];

      // append spells
      try {
        window.appendSpellsToNotes && window.appendSpellsToNotes(notes);
      } catch (_) {}

      return {
        name: ($("name")?.value || "").trim(),
        race: ($("race")?.value || "Human").trim(),
        class_name: ($("class")?.value || "Fighter").trim(),
        level: num($("level")?.value || 1) || 1,
        alignment: ($("alignment")?.value || "Neutral").trim(),
        background: ($("background")?.value || "Adventurer").trim(),
        avatar: ($("avatar")?.value || "").trim(),
        description: ($("description")?.value || "").trim(),

        stats: {
          str: clampMin(num($("str")?.value || 10), 1),
          dex: clampMin(num($("dex")?.value || 10), 1),
          con: clampMin(num($("con")?.value || 10), 1),
          int: clampMin(num($("int")?.value || 10), 1),
          wis: clampMin(num($("wis")?.value || 10), 1),
          cha: clampMin(num($("cha")?.value || 10), 1),
        },

        hp: clampMin(num($("hp")?.value || 10), 1),
        ac: clampMin(num($("ac")?.value || 10), 1),
        speed: ($("speed")?.value || "30 ft").trim(),

        skills: [], // nếu sau này bạn muốn gửi skills/save dạng JSON mình làm tiếp
        equipment: equipmentToTextList(),
        notes,

        is_public: true,
      };
    }

    publishBtn.addEventListener("click", async () => {
      const payload = buildPayload();
      if (!payload.name) return show("Vui lòng nhập Tên nhân vật trước khi đăng.");

      publishBtn.disabled = true;
      show("Đang đăng nhân vật...", false);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          show("Missing token. Hãy đăng nhập lại.", true);
          publishBtn.disabled = false;
          return;
        }

        const res = await fetch("/api/characters", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          show(data?.message || "Đăng nhân vật thất bại");
          publishBtn.disabled = false;
          return;
        }

        if (!data?.id) {
          show("Đăng thành công nhưng không nhận được ID nhân vật.", true);
          publishBtn.disabled = false;
          return;
        }

        show("✅ Đăng thành công! Đang chuyển sang trang xem...", false);
        setTimeout(() => {
          window.location.href = `character.html?id=${data.id}`;
        }, 250);
      } catch (e) {
        show(e?.message || "Không kết nối được server");
        publishBtn.disabled = false;
      }
    });
  }

  // =========================================================
  // INIT
  // =========================================================
  document.addEventListener("DOMContentLoaded", () => {
    ["str", "dex", "con", "int", "wis", "cha"].forEach(wireAbilityScore);

    // Spells wiring
    const tbody = $("spellTbody");
    const addSpellBtn = $("addSpellRowBtn");
    const addCanBtn = $("addCantripRowBtn");
    const clearSpellsBtn = $("clearSpellsBtn");

    if (tbody && addSpellBtn && addCanBtn && clearSpellsBtn) {
      addSpellBtn.addEventListener("click", () => {
        tbody.appendChild(spellRowTemplate({ level: "1" }));
        syncSpellsJson();
      });

      addCanBtn.addEventListener("click", () => {
        tbody.appendChild(spellRowTemplate({ level: "0" }));
        syncSpellsJson();
      });

      clearSpellsBtn.addEventListener("click", () => {
        tbody.innerHTML = "";
        syncSpellsJson();
      });

      syncSpellsJson();
    }

    // Equipment wiring
    const colA = $("equipColA");
    const colB = $("equipColB");
    const att = $("equipAttuned");

    $("addEquipA")?.addEventListener("click", () => {
      colA?.appendChild(buildEquipRow());
      syncEquipmentJson();
    });

    $("addEquipB")?.addEventListener("click", () => {
      colB?.appendChild(buildEquipRow());
      syncEquipmentJson();
    });

    $("addEquipAttuned")?.addEventListener("click", () => {
      att?.appendChild(buildEquipRow());
      syncEquipmentJson();
    });

    $("clearEquipAll")?.addEventListener("click", () => {
      if (colA) colA.innerHTML = "";
      if (colB) colB.innerHTML = "";
      if (att) att.innerHTML = "";
      syncEquipmentJson();
    });

    ["coin_cp", "coin_sp", "coin_ep", "coin_gp", "coin_pp", "str"].forEach((id) => {
      $(id)?.addEventListener("input", syncEquipmentJson);
    });

    syncEquipmentJson();

    initFeatureLists();
    initAttacks();

    // ✅ auto calc save/skill
    wireAutoCalc();

    initPublish();
  });
})();
