// /JS/character.js
(() => {
  // =========================
  // Helpers
  // =========================
  const $ = (id) => document.getElementById(id);

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const modFromScore = (score) => {
    const s = Number(score ?? 10);
    return Math.floor((s - 10) / 2);
  };
  const fmt = (n) => (Number(n) >= 0 ? `+${Number(n)}` : `${Number(n)}`);

  const pbFromLevel = (level) => 2 + Math.floor((clamp(Number(level || 1), 1, 20) - 1) / 4);

  const readLines = (text) =>
    String(text ?? "")
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

  const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

  function decodeJwtPayload(token) {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    const b64 =
      part.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((part.length + 3) % 4);
    return JSON.parse(atob(b64));
  }

  function getAuth() {
    const token = localStorage.getItem("token");
    if (!token) return { token: null, user: null };
    try {
      const user = decodeJwtPayload(token);
      return { token, user };
    } catch {
      return { token: null, user: null };
    }
  }

  function getIdFromUrl() {
    const id = new URLSearchParams(location.search).get("id");
    return id ? String(id) : null;
  }

  // =========================
  // Notes parser (Train/Prof/Action/Attack/Spell)
  // =========================
  function splitNotes(notesArr) {
    const out = {
      train: [],
      prof: [],
      action: [],
      attacks: [],
      spells: [],
      other: [],
    };
    (Array.isArray(notesArr) ? notesArr : []).forEach((line) => {
      const s = String(line || "").trim();
      if (!s) return;

      if (s.startsWith("Train:")) out.train.push(s.replace(/^Train:\s*/, ""));
      else if (s.startsWith("Proficiency:")) out.prof.push(s.replace(/^Proficiency:\s*/, ""));
      else if (s.startsWith("Action:")) out.action.push(s.replace(/^Action:\s*/, ""));
      else if (s.startsWith("Attack:")) out.attacks.push(s.replace(/^Attack:\s*/, ""));
      else if (s.startsWith("Spell:")) out.spells.push(s.replace(/^Spell:\s*/, ""));
      else out.other.push(s);
    });
    return out;
  }

  function parseAttackLine(s) {
    // "Shortbow | Hit:+3 | Dmg:1d6+3 Piercing | Notes:..."
    const parts = String(s || "").split("|").map((x) => x.trim());
    const name = parts[0] || "";
    const get = (prefix) => {
      const p = parts.find((x) => x.toLowerCase().startsWith(prefix));
      return p ? p.split(":").slice(1).join(":").trim() : "";
    };
    return {
      name,
      hit: get("hit"),
      dmg: get("dmg"),
      notes: get("notes"),
    };
  }

  function parseSpellLine(s) {
    // "[P] Name | Src:... | Save/Atk:... | Time:... | Range:... | Comp:... | Dur:... | Page:... | Notes:..."
    const parts = String(s || "").split("|").map((x) => x.trim());
    const first = parts[0] || "";
    const prepared = first.startsWith("[P]");
    const name = prepared ? first.replace(/^\[P\]\s*/, "") : first;

    const get = (prefix) => {
      const p = parts.find((x) => x.toLowerCase().startsWith(prefix));
      return p ? p.split(":").slice(1).join(":").trim() : "";
    };

    return {
      prepared,
      name,
      source: get("src"),
      saveAtk: get("save/atk"),
      time: get("time"),
      range: get("range"),
      comp: get("comp"),
      duration: get("dur"),
      page: get("page"),
      notes: get("notes"),
    };
  }

  function fillUl(id, arr) {
    const ul = $(id);
    if (!ul) return;
    if (!arr || arr.length === 0) {
      ul.innerHTML = `<li class="empty">—</li>`;
      return;
    }
    ul.innerHTML = arr.map((x) => `<li>${esc(x)}</li>`).join("");
  }

  // =========================
  // Skills & Saving Throws
  // =========================
  const SKILLS = [
    { key: "Acrobatics", abil: "dex" },
    { key: "Animal Handling", abil: "wis" },
    { key: "Arcana", abil: "int" },
    { key: "Athletics", abil: "str" },
    { key: "Deception", abil: "cha" },
    { key: "History", abil: "int" },
    { key: "Insight", abil: "wis" },
    { key: "Intimidation", abil: "cha" },
    { key: "Investigation", abil: "int" },
    { key: "Medicine", abil: "wis" },
    { key: "Nature", abil: "int" },
    { key: "Perception", abil: "wis" },
    { key: "Performance", abil: "cha" },
    { key: "Persuasion", abil: "cha" },
    { key: "Religion", abil: "int" },
    { key: "Sleight of Hand", abil: "dex" },
    { key: "Stealth", abil: "dex" },
    { key: "Survival", abil: "wis" },
  ];

  const SAVES = [
    { key: "Strength", abil: "str" },
    { key: "Dexterity", abil: "dex" },
    { key: "Constitution", abil: "con" },
    { key: "Intelligence", abil: "int" },
    { key: "Wisdom", abil: "wis" },
    { key: "Charisma", abil: "cha" },
  ];

  function normalizeSkillName(s) {
    const raw = String(s || "").trim().toLowerCase();
    if (!raw) return "";
    return raw.replace(/\s+/g, " ");
  }

  function normalizeSkillAlt(s) {
    // allow "animal_handling"
    return normalizeSkillName(s).replace(/\s+/g, "_");
  }

  function renderSkills(c) {
    const skillsGrid = $("skillsGrid");
    if (!skillsGrid) return;

    const level = Number(c.level || 1);
    const PB = pbFromLevel(level);

    // c.skills can be ["Perception","Stealth"] or ["animal_handling"]
    const profSet = new Set((Array.isArray(c.skills) ? c.skills : [])
      .map((x) => String(x).trim())
      .filter(Boolean)
      .map((x) => x.toLowerCase()));

    const st = c.stats || {};

    skillsGrid.className = "skills-grid";
    skillsGrid.innerHTML = SKILLS.map((s) => {
      const abilScore = st[s.abil] ?? 10;
      const base = modFromScore(abilScore);

      const n1 = s.key.toLowerCase();
      const n2 = n1.replace(/\s+/g, "_");

      const isProf = profSet.has(n1) || profSet.has(n2);
      const total = base + (isProf ? PB : 0);

      return `
        <div class="skill-item ${isProf ? "skill-prof" : ""}">
          <div class="skill-left">
            <div class="skill-name">${esc(s.key)}</div>
            <div class="skill-abil">(${s.abil.toUpperCase()})</div>
          </div>
          <div class="skill-mod">${fmt(total)}</div>
        </div>
      `;
    }).join("");
  }

  function renderSavingThrows(c) {
    // Optional: if your HTML has a container id="savingGrid"
    const savingGrid = $("savingGrid");
    if (!savingGrid) return;

    const level = Number(c.level || 1);
    const PB = pbFromLevel(level);
    const st = c.stats || {};

    // c.saving_throws can be ["wis","cha"] or ["Wisdom","Charisma"]
    const saveSet = new Set((Array.isArray(c.saving_throws) ? c.saving_throws : [])
      .map((x) => String(x).trim().toLowerCase()));

    savingGrid.className = "skills-grid";
    savingGrid.innerHTML = SAVES.map((s) => {
      const base = modFromScore(st[s.abil] ?? 10);
      const isProf =
        saveSet.has(s.abil) ||
        saveSet.has(s.key.toLowerCase()) ||
        saveSet.has(s.key.toLowerCase().slice(0, 3));

      const total = base + (isProf ? PB : 0);

      return `
        <div class="skill-item ${isProf ? "skill-prof" : ""}">
          <div class="skill-left">
            <div class="skill-name">${esc(s.key)}</div>
            <div class="skill-abil">(${s.abil.toUpperCase()})</div>
          </div>
          <div class="skill-mod">${fmt(total)}</div>
        </div>
      `;
    }).join("");
  }

  // =========================
  // Resist / Immune / Vuln / Senses
  // =========================
  function normalizeArrayLike(v) {
    // Accept array, newline string, comma string, json string
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (v == null) return [];
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return [];
      // json array?
      if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith('"') && s.endsWith('"'))) {
        try {
          const j = JSON.parse(s);
          if (Array.isArray(j)) return j.map((x) => String(x).trim()).filter(Boolean);
        } catch { /* ignore */ }
      }
      return s.split(/\r?\n|,|;/).map((x) => x.trim()).filter(Boolean);
    }
    // object -> entries
    if (typeof v === "object") {
      return Object.entries(v).map(([k, val]) => `${k}: ${val}`).filter(Boolean);
    }
    return [];
  }

  function renderChipGroup(wrapId, label, arr) {
    const wrap = $(wrapId);
    if (!wrap) return;
    const items = normalizeArrayLike(arr);
    if (!items.length) {
      wrap.innerHTML = `<span class="empty">—</span>`;
      return;
    }
    wrap.className = "chip-group";
    wrap.innerHTML = items.map((x) => `<span>${esc(x)}</span>`).join("");
  }

  function renderSenses(c) {
    const senseUl = $("senseList");
    if (!senseUl) return;
    const lines = normalizeArrayLike(c.senses ?? c.sense);
    senseUl.innerHTML = lines.length
      ? lines.map((x) => `<li>${esc(x)}</li>`).join("")
      : `<li class="empty">—</li>`;
  }

  // =========================
  // Edit mode UI
  // =========================
  let current = null;
  let editMode = false;

  function canEditCharacter(c) {
    const { user } = getAuth();
    if (!user) return false;
    if (String(user.role || "").toLowerCase() === "admin") return true;

    // support multiple schemas:
    // - c.created_by (username)
    // - c.owner_username
    // - c.user_id (numeric)
    const uName = String(user.username || "").toLowerCase();
    const createdBy = String(c?.created_by ?? c?.owner_username ?? "").toLowerCase();
    const userId = Number(user.id);
    const ownerId = Number(c?.user_id ?? c?.owner_id);

    if (createdBy && uName && createdBy === uName) return true;
    if (Number.isFinite(userId) && Number.isFinite(ownerId) && userId === ownerId) return true;

    return false;
  }

  function setEditMode(on) {
    editMode = !!on;

    const editBtn = $("editBtn");
    const saveBtn = $("saveBtn");
    const cancelBtn = $("cancelBtn");

    if (editBtn) editBtn.style.display = on ? "none" : "inline-flex";
    if (saveBtn) saveBtn.style.display = on ? "inline-flex" : "none";
    if (cancelBtn) cancelBtn.style.display = on ? "inline-flex" : "none";

    if (!current) return;

    // Description editable
    const descEl = $("charDesc");
    if (descEl) {
      if (on) {
        const val = String(current.description || "");
        descEl.innerHTML = `
          <textarea id="descTa" style="width:100%;min-height:90px;">${esc(val)}</textarea>
        `;
      } else {
        descEl.textContent = current.description || "—";
      }
    }

    // Equipment editable
    const equipList = $("equipList");
    if (equipList) {
      if (on) {
        const eqLines = normalizeArrayLike(current.equipment);
        equipList.innerHTML = `
          <li style="list-style:none;padding:0;margin:0;">
            <textarea id="equipTa" style="width:100%;min-height:120px;" placeholder="Mỗi dòng 1 item">${esc(eqLines.join("\n"))}</textarea>
          </li>
        `;
      } else {
        const eq = Array.isArray(current.equipment) ? current.equipment : [];
        equipList.innerHTML = eq.length
          ? eq.map((i) => `<li>${esc(i)}</li>`).join("")
          : `<li class="empty">—</li>`;
      }
    }

    // Train / Proficiency / Action
    const groups = splitNotes(current.notes || []);

    const trainUl = $("trainUl");
    const profUl = $("profUl");
    const actionUl = $("actionUl");

    if (trainUl) {
      trainUl.innerHTML = on
        ? `<li style="list-style:none;padding:0;margin:0;">
            <textarea id="trainTa" style="width:100%;min-height:120px;" placeholder="Mỗi dòng 1 mục Train">${esc(groups.train.join("\n"))}</textarea>
          </li>`
        : (groups.train.length ? groups.train.map((x) => `<li>${esc(x)}</li>`).join("") : `<li class="empty">—</li>`);
    }

    if (profUl) {
      profUl.innerHTML = on
        ? `<li style="list-style:none;padding:0;margin:0;">
            <textarea id="profTa" style="width:100%;min-height:120px;" placeholder="Mỗi dòng 1 mục Proficiency">${esc(groups.prof.join("\n"))}</textarea>
          </li>`
        : (groups.prof.length ? groups.prof.map((x) => `<li>${esc(x)}</li>`).join("") : `<li class="empty">—</li>`);
    }

    if (actionUl) {
      actionUl.innerHTML = on
        ? `<li style="list-style:none;padding:0;margin:0;">
            <textarea id="actionTa" style="width:100%;min-height:120px;" placeholder="Mỗi dòng 1 Action">${esc(groups.action.join("\n"))}</textarea>
          </li>`
        : (groups.action.length ? groups.action.map((x) => `<li>${esc(x)}</li>`).join("") : `<li class="empty">—</li>`);
    }

    // Resist/Imm/Vuln -> textarea inside chip containers
    const setChipTa = (wrapId, taId, rawValue, placeholder) => {
      const wrap = $(wrapId);
      if (!wrap) return;
      const lines = normalizeArrayLike(rawValue);
      wrap.className = "chip-group";
      wrap.innerHTML = `
        <textarea id="${taId}" style="width:100%;min-height:90px;" placeholder="${esc(placeholder)}">${esc(lines.join("\n"))}</textarea>
        <div class="empty" style="margin-top:8px;">Mỗi dòng 1 mục</div>
      `;
    };

    if (on) {
      setChipTa(
        "resistChips",
        "resistTa",
        current.resistances ?? current.resistance ?? current.damage_resistances ?? current.dr,
        "Ví dụ:\nFire\nCold\nPoison"
      );
      setChipTa(
        "immuneChips",
        "immuneTa",
        current.immunities ?? current.immunity ?? current.damage_immunities ?? current.di,
        "Ví dụ:\nPoison\nNecrotic"
      );
      setChipTa(
        "vulnChips",
        "vulnTa",
        current.vulnerabilities ?? current.vulnerability ?? current.damage_vulnerabilities ?? current.dv,
        "Ví dụ:\nRadiant"
      );

      // Senses
      const senseUl2 = $("senseList");
      if (senseUl2) {
        const lines = normalizeArrayLike(current.senses ?? current.sense);
        senseUl2.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
          <textarea id="sensesTa" style="width:100%;min-height:90px;" placeholder="Ví dụ:\nDarkvision 60 ft\nPassive Perception 13">${esc(lines.join("\n"))}</textarea>
          <div class="empty" style="margin-top:8px;">Mỗi dòng 1 mục</div>
        </li>`;
      }

      // Spells -> textarea replace tbody
      const spellBody = $("spellTbodyView");
      const spellEmpty = $("spellEmpty");
      if (spellBody && spellEmpty) {
        spellBody.innerHTML = `
          <tr>
            <td colspan="11" style="padding:0 10px;">
              <textarea id="spellsTa" style="width:100%;min-height:180px;"
                placeholder="[P] Cure Wounds | Src:PHB | Save/Atk:WIS | Time:1 action | Range:Touch | Comp:V,S | Dur:Instant | Page:230 | Notes:..."
              >${esc(groups.spells.join("\n"))}</textarea>
              <div class="empty" style="margin-top:8px;">Mỗi dòng 1 spell (phần sau 'Spell:')</div>
            </td>
          </tr>
        `;
        spellEmpty.style.display = "none";
      }
    } else {
      // Back to view render for resist/immune/vuln/senses/spells
      renderChipGroup("resistChips", "Resistances", current.resistances);
      renderChipGroup("immuneChips", "Immunities", current.immunities);
      renderChipGroup("vulnChips", "Vulnerabilities", current.vulnerabilities);
      renderSenses(current);

      // Spells view
      renderSpells(current);
    }
  }

  // =========================
  // Render Attacks & Spells (view)
  // =========================
  function renderAttacks(c) {
    const groups = splitNotes(c.notes || []);
    const atkBox = $("atkBox");
    const atkEmpty = $("atkEmpty");
    if (!atkBox || !atkEmpty) return;

    const atkRows = groups.attacks.map(parseAttackLine);

    if (!atkRows.length) {
      atkBox.innerHTML = "";
      atkEmpty.style.display = "block";
    } else {
      atkEmpty.style.display = "none";
      atkBox.innerHTML = atkRows
        .map(
          (a) => `
        <div class="atk-row">
          <div class="atk-box">${esc(a.name)}</div>
          <div class="atk-box">${esc(a.hit || "-")}</div>
          <div class="atk-box">${esc(a.dmg || "-")}</div>
          <div class="atk-box">${esc(a.notes || "-")}</div>
          <button class="atk-del" type="button" disabled title="Chỉ xem">✕</button>
        </div>
      `
        )
        .join("");
    }
  }

  function renderSpells(c) {
    const groups = splitNotes(c.notes || []);
    const spellBody = $("spellTbodyView");
    const spellEmpty = $("spellEmpty");
    if (!spellBody || !spellEmpty) return;

    const spells = groups.spells.map(parseSpellLine);
    if (!spells.length) {
      spellBody.innerHTML = "";
      spellEmpty.style.display = "block";
    } else {
      spellEmpty.style.display = "none";
      spellBody.innerHTML = spells
        .map(
          (sp) => `
        <tr>
          <td><div class="tbl-pill">${sp.prepared ? "✓" : ""}</div></td>
          <td><div class="tbl-pill">—</div></td>
          <td><div class="tbl-pill">${esc(sp.name)}</div></td>
          <td><div class="tbl-pill">${esc(sp.source || "-")}</div></td>
          <td><div class="tbl-pill">${esc(sp.saveAtk || "-")}</div></td>
          <td><div class="tbl-pill">${esc(sp.time || "-")}</div></td>
          <td><div class="tbl-pill">${esc(sp.range || "-")}</div></td>
          <td><div class="tbl-pill">${esc(sp.comp || "-")}</div></td>
          <td><div class="tbl-pill">${esc(sp.duration || "-")}</div></td>
          <td><div class="tbl-pill">${esc(sp.page || "-")}</div></td>
          <td><div class="tbl-pill">${esc(sp.notes || "-")}</div></td>
        </tr>
      `
        )
        .join("");
    }
  }

  // =========================
  // Load + Save
  // =========================
  async function loadCharacter() {
    const id = getIdFromUrl();
    if (!id) return;

    const container = document.querySelector(".character-page .container");
    try {
      const res = await fetch(`/api/characters/public/${encodeURIComponent(id)}`);
      const c = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (container) {
          container.innerHTML = `<div class="card"><h3>Nhân vật không tồn tại hoặc chưa public.</h3></div>`;
        }
        return;
      }

      current = c;

      // Title
      const lv = Number(c.level || 1);
      if ($("charTitle")) {
        $("charTitle").textContent = `${c.name} — ${c.race} ${c.class_name} (Cấp ${lv})`;
      }
      // Desc
      if ($("charDesc")) $("charDesc").textContent = c.description || "—";

      // Avatar
      const avatar = $("charAvatar");
      if (avatar) {
        avatar.src = c.avatar && String(c.avatar).trim() ? c.avatar : "/Assets/images/sample.png";
      }

      // Basic fields
      if ($("charRace")) $("charRace").textContent = c.race || "—";
      if ($("charClass")) $("charClass").textContent = c.class_name || "—";
      if ($("charAlign")) $("charAlign").textContent = c.alignment || "—";
      if ($("charBg")) $("charBg").textContent = c.background || "—";

      // Stats
      const st = c.stats || {};
      if ($("statStr")) $("statStr").textContent = st.str ?? 10;
      if ($("statDex")) $("statDex").textContent = st.dex ?? 10;
      if ($("statCon")) $("statCon").textContent = st.con ?? 10;
      if ($("statInt")) $("statInt").textContent = st.int ?? 10;
      if ($("statWis")) $("statWis").textContent = st.wis ?? 10;
      if ($("statCha")) $("statCha").textContent = st.cha ?? 10;

      // Combat
      if ($("combatHp")) $("combatHp").textContent = c.hp ?? 10;
      if ($("combatAc")) $("combatAc").textContent = c.ac ?? 10;
      if ($("combatSpeed")) $("combatSpeed").textContent = c.speed || "30 ft";
      if ($("combatInit")) $("combatInit").textContent = fmt(modFromScore(st.dex ?? 10));

      // Skills + Saving throws
      renderSkills(c);
      renderSavingThrows(c);

      // Equipment
      const eq = Array.isArray(c.equipment) ? c.equipment : [];
      if ($("equipList")) {
        $("equipList").innerHTML = eq.length
          ? eq.map((i) => `<li>${esc(i)}</li>`).join("")
          : `<li class="empty">—</li>`;
      }

      // Train/Prof/Action
      const groups = splitNotes(c.notes || []);
      fillUl("trainUl", groups.train);
      fillUl("profUl", groups.prof);
      fillUl("actionUl", groups.action);

      // Attacks + Spells
      renderAttacks(c);
      renderSpells(c);

      // Resist/Imm/Vuln + Senses
      renderChipGroup("resistChips", "Resistances", c.resistances);
      renderChipGroup("immuneChips", "Immunities", c.immunities);
      renderChipGroup("vulnChips", "Vulnerabilities", c.vulnerabilities);
      renderSenses(c);

      // Actions bar show/hide
      const bar = $("charActions");
      if (bar) {
        bar.style.display = canEditCharacter(c) ? "flex" : "none";
      }

      // Ensure default mode
      setEditMode(false);
    } catch (e) {
      console.error(e);
      if (container) {
        container.innerHTML = `<div class="card"><h3>Lỗi tải nhân vật.</h3></div>`;
      }
    }
  }

  async function saveChanges() {
    if (!current) return;

    const { token } = getAuth();
    if (!token) {
      alert("Bạn cần đăng nhập để lưu thay đổi.");
      return;
    }

    const id = getIdFromUrl();
    if (!id) return;

    // Read editable values
    const description = $("descTa") ? $("descTa").value : (current.description || "");
    const equipment = $("equipTa") ? readLines($("equipTa").value) : (Array.isArray(current.equipment) ? current.equipment : []);

    const resistances = readLines($("resistTa")?.value);
    const immunities = readLines($("immuneTa")?.value);
    const vulnerabilities = readLines($("vulnTa")?.value);
    const senses = readLines($("sensesTa")?.value);

    // Notes rebuild (keep attacks + other)
    const oldGroups = splitNotes(current.notes || []);

    const train = readLines($("trainTa")?.value).map((x) => `Train: ${x}`);
    const prof = readLines($("profTa")?.value).map((x) => `Proficiency: ${x}`);
    const action = readLines($("actionTa")?.value).map((x) => `Action: ${x}`);

    const spellsLines = readLines($("spellsTa")?.value).map((x) => `Spell: ${x}`);

    const notes = [
      ...train,
      ...prof,
      ...action,
      ...oldGroups.attacks.map((x) => `Attack: ${x}`),
      ...spellsLines,
      ...oldGroups.other,
    ];

    const payload = {
      description,
      equipment,
      notes,
      resistances,
      immunities,
      vulnerabilities,
      senses,
    };

    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("SAVE FAILED", data);
        alert(data?.message || "Lưu thất bại.");
        return;
      }

      // Update local state then rerender
      current = { ...current, ...payload };
      setEditMode(false);
      await loadCharacter();
      alert("Đã lưu!");
    } catch (e) {
      console.error(e);
      alert("Lỗi mạng khi lưu.");
    }
  }

  function bindButtons() {
    const editBtn = $("editBtn");
    const saveBtn = $("saveBtn");
    const cancelBtn = $("cancelBtn");

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        if (!current) return;
        if (!canEditCharacter(current)) return;
        setEditMode(true);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        if (!current) return;
        if (!canEditCharacter(current)) return;
        saveChanges();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        setEditMode(false);
        loadCharacter();
      });
    }
  }

  // =========================
  // Boot
  // =========================
  bindButtons();
  loadCharacter();
})();
