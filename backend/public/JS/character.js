// public/JS/character.js
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

  function norm(s) {
    return String(s ?? "").trim().toLowerCase();
  }

  function getIdFromUrl() {
    return new URLSearchParams(location.search).get("id");
  }

  function getAuth() {
    const token = localStorage.getItem("token") || "";
    let user = null;
    try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch {}
    return { token, user };
  }

  function readLines(raw) {
    const s = String(raw ?? "").trim();
    if (!s) return [];
    return s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  }

  function normalizeArrayLike(v) {
    if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);

    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return [];
      if (s.startsWith("[") && s.endsWith("]")) {
        try {
          const j = JSON.parse(s);
          if (Array.isArray(j)) return j.map((x) => String(x).trim()).filter(Boolean);
        } catch {}
      }
      return s.split(/\r?\n|,|;/).map((x) => x.trim()).filter(Boolean);
    }

    return [];
  }

  function fmtSigned(n) {
    const x = Number(n) || 0;
    return x >= 0 ? `+${x}` : String(x);
  }

  function modFromScore(score) {
    const s = Number(score) || 10;
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

  // =========================
  // Notes parsing
  // =========================
  function splitNotes(notes) {
    const arr = normalizeArrayLike(notes);

    const groups = {
      train: [],
      prof: [],
      action: [],
      attacks: [],
      spells: [],
      meta: [],
      other: [],
    };

    for (const line of arr) {
      const s = String(line || "").trim();
      const low = s.toLowerCase();
      if (low.startsWith("train:")) groups.train.push(s.slice(6).trim());
      else if (low.startsWith("proficiency:")) groups.prof.push(s.slice(12).trim());
      else if (low.startsWith("action:")) groups.action.push(s.slice(7).trim());
      else if (low.startsWith("attack:")) groups.attacks.push(s.slice(7).trim());
      else if (low.startsWith("spell:")) groups.spells.push(s.slice(6).trim());
      else if (low.startsWith("meta:")) groups.meta.push(s.slice(5).trim());
      else groups.other.push(s);
    }

    return groups;
  }

  function parseMetaMap(metaLines) {
    const m = {};
    for (const line of metaLines || []) {
      const s = String(line || "").trim();
      const idx = s.indexOf("=");
      if (idx === -1) continue;
      const k = s.slice(0, idx).trim();
      const v = s.slice(idx + 1).trim();
      if (k) m[k] = v;
    }
    return m;
  }

  function parseAttackLine(line) {
    const parts = String(line ?? "").split("|").map((x) => x.trim());
    return { name: parts[0] || "", hit: parts[1] || "", dmg: parts[2] || "", notes: parts[3] || "" };
  }

  function attackToLine(a) {
    const name = String(a.name || "").trim();
    const hit = String(a.hit || "").trim();
    const dmg = String(a.dmg || "").trim();
    const notes = String(a.notes || "").trim();
    return [name, hit, dmg, notes].join(" | ").trim();
  }

  function parseSpellLine(line) {
    const raw = String(line ?? "").trim();
    const prepared = /^\[p\]/i.test(raw);
    const cleaned = raw.replace(/^\[p\]\s*/i, "");
    const parts = cleaned.split("|").map((x) => x.trim()).filter(Boolean);

    const out = {
      prepared,
      level: "-",
      name: parts[0] || "",
      saveAtk: "-",
      time: "-",
      range: "-",
      comp: "-",
      duration: "-",
      page: "-",
      notes: "-",
    };

    for (const p of parts.slice(1)) {
      const low = p.toLowerCase();
      const val = p.split(":").slice(1).join(":").trim();
      if (!val) continue;

      if (low.startsWith("level:")) out.level = val;
      else if (low.startsWith("save/atk:")) out.saveAtk = val;
      else if (low.startsWith("time:")) out.time = val;
      else if (low.startsWith("range:")) out.range = val;
      else if (low.startsWith("comp:")) out.comp = val;
      else if (low.startsWith("dur:") || low.startsWith("duration:")) out.duration = val;
      else if (low.startsWith("page:")) out.page = val;
      else if (low.startsWith("notes:")) out.notes = val;
    }

    return out;
  }

  // =========================
  // Render blocks
  // =========================
  const SKILLS = [
    { key: "Acrobatics", short: "DEX", stat: "dex", vi: "Nhào lộn" },
    { key: "Animal Handling", short: "WIS", stat: "wis", vi: "Thuần hóa" },
    { key: "Arcana", short: "INT", stat: "int", vi: "Huyền học" },
    { key: "Athletics", short: "STR", stat: "str", vi: "Vận động" },
    { key: "Deception", short: "CHA", stat: "cha", vi: "Lừa dối" },
    { key: "History", short: "INT", stat: "int", vi: "Lịch sử" },
    { key: "Insight", short: "WIS", stat: "wis", vi: "Thấu hiểu" },
    { key: "Intimidation", short: "CHA", stat: "cha", vi: "Đe doạ" },
    { key: "Investigation", short: "INT", stat: "int", vi: "Điều tra" },
    { key: "Medicine", short: "WIS", stat: "wis", vi: "Y học" },
    { key: "Nature", short: "INT", stat: "int", vi: "Thiên nhiên" },
    { key: "Perception", short: "WIS", stat: "wis", vi: "Nhận thức" },
    { key: "Performance", short: "CHA", stat: "cha", vi: "Biểu diễn" },
    { key: "Persuasion", short: "CHA", stat: "cha", vi: "Thuyết phục" },
    { key: "Religion", short: "INT", stat: "int", vi: "Tôn giáo" },
    { key: "Sleight of Hand", short: "DEX", stat: "dex", vi: "Khéo tay" },
    { key: "Stealth", short: "DEX", stat: "dex", vi: "Ẩn nấp" },
    { key: "Survival", short: "WIS", stat: "wis", vi: "Sinh tồn" },
  ];

  function renderSkills(c) {
    const wrap = $("skillsGrid");
    if (!wrap) return;

    const st = c.stats || {};
    const profBonus = profBonusFromLevel(c.level || 1);

    // skills can be ARRAY of proficient skill names OR object
    const skillArr = Array.isArray(c.skills) ? c.skills.map(String) : null;
    const skillsObj = (!Array.isArray(c.skills) && c.skills && typeof c.skills === "object") ? c.skills : null;

    wrap.innerHTML = SKILLS.map((s) => {
      const base = modFromScore(st[s.stat] ?? 10);

      let bonus = 0;
      if (skillArr) {
        bonus = skillArr.some((x) => norm(x) === norm(s.key)) ? profBonus : 0;
      } else if (skillsObj) {
        const v = skillsObj[s.key];
        if (typeof v === "number") bonus = v;
        else if (v && typeof v === "object") {
          if (typeof v.mod === "number") bonus = v.mod;
          else if (typeof v.bonus === "number") bonus = v.bonus;
          else if (v.proficient) bonus = profBonus;
        }
      }

      const total = base + bonus;

      return `
        <div class="skill-row">
          <div class="skill-left">
            <div class="skill-name">${esc(s.vi)} <span class="skill-en">(${esc(s.key)})</span></div>
            <div class="skill-abil">(${esc(s.short)})</div>
          </div>
          <div class="skill-mod">${esc(fmtSigned(total))}</div>
        </div>
      `;
    }).join("");
  }

  function renderSavingThrows(c) {
    const wrap = $("saveGrid");
    if (!wrap) return;

    const st = c.stats || {};
    const profBonus = profBonusFromLevel(c.level || 1);

    // save profs come from meta "SaveProficiencies=str,dex,..."
    const groups = splitNotes(c.notes || []);
    const meta = parseMetaMap(groups.meta);
    const saveProfs = String(meta.SaveProficiencies || "")
      .split(",")
      .map((x) => norm(x))
      .filter(Boolean);

    const list = [
      { key: "str", label: "Sức mạnh", short: "STR" },
      { key: "dex", label: "Nhanh nhẹn", short: "DEX" },
      { key: "con", label: "Thể chất", short: "CON" },
      { key: "int", label: "Trí tuệ", short: "INT" },
      { key: "wis", label: "Trí khôn", short: "WIS" },
      { key: "cha", label: "Sức hút", short: "CHA" },
    ];

    wrap.innerHTML = list.map((x) => {
      const base = modFromScore(st[x.key] ?? 10);
      const bonus = saveProfs.includes(norm(x.key)) ? profBonus : 0;
      const total = base + bonus;

      return `
        <div class="skill-row">
          <div class="skill-left">
            <div class="skill-name">${esc(x.label)}</div>
            <div class="skill-abil">(${esc(x.short)})</div>
          </div>
          <div class="skill-mod">${esc(fmtSigned(total))}</div>
        </div>
      `;
    }).join("");
  }

  function renderChipGroup(wrapId, arr) {
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
    const ul = $("senseList");
    if (!ul) return;

    // senses is object in DB: { passivePerception, passiveInsight, passiveInvestigation }
    if (c.senses && typeof c.senses === "object" && !Array.isArray(c.senses)) {
      const s = c.senses;
      const lines = [
        `Passive Perception: ${Number(s.passivePerception || 0)}`,
        `Passive Insight: ${Number(s.passiveInsight || 0)}`,
        `Passive Investigation: ${Number(s.passiveInvestigation || 0)}`,
      ];
      ul.innerHTML = lines.map((x) => `<li>${esc(x)}</li>`).join("");
      return;
    }

    const lines = normalizeArrayLike(c.senses ?? c.sense);
    ul.innerHTML = lines.length
      ? lines.map((x) => `<li>${esc(x)}</li>`).join("")
      : `<li class="empty">—</li>`;
  }

  function renderFeatures(c) {
    const ul = $("featureUl");
    if (!ul) return;

    const lines = normalizeArrayLike(c.feature_lines ?? []);
    ul.innerHTML = lines.length
      ? lines.map((x) => `<li>${esc(x)}</li>`).join("")
      : `<li class="empty">—</li>`;
  }

  function renderAttacks(c) {
    const atkBox = $("atkBox");
    const atkEmpty = $("atkEmpty");
    if (!atkBox || !atkEmpty) return;

    const groups = splitNotes(c.notes || []);
    const rows = groups.attacks.map(parseAttackLine);

    if (!rows.length) {
      atkBox.innerHTML = "";
      atkEmpty.style.display = "block";
      return;
    }

    atkEmpty.style.display = "none";
    atkBox.innerHTML = rows.map((a) => `
      <div class="atk-row">
        <div class="atk-box">${esc(a.name || "-")}</div>
        <div class="atk-box">${esc(a.hit || "-")}</div>
        <div class="atk-box">${esc(a.dmg || "-")}</div>
        <div class="atk-box">${esc(a.notes || "-")}</div>
        <button class="atk-del" type="button" disabled title="Chỉ xem">✕</button>
      </div>
    `).join("");
  }

  function renderSpells(c) {
    const body = $("spellTbodyView");
    const empty = $("spellEmpty");
    if (!body || !empty) return;

    const groups = splitNotes(c.notes || []);
    const spells = groups.spells.map(parseSpellLine);

    if (!spells.length) {
      body.innerHTML = "";
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";
    body.innerHTML = spells.map((sp) => `
      <tr>
        <td><div class="tbl-pill">${sp.prepared ? "✓" : ""}</div></td>
        <td><div class="tbl-pill">${esc(sp.level)}</div></td>
        <td><div class="tbl-pill">${esc(sp.name)}</div></td>
        <td><div class="tbl-pill">${esc(sp.saveAtk)}</div></td>
        <td><div class="tbl-pill">${esc(sp.time)}</div></td>
        <td><div class="tbl-pill">${esc(sp.range)}</div></td>
        <td><div class="tbl-pill">${esc(sp.comp)}</div></td>
        <td><div class="tbl-pill">${esc(sp.duration)}</div></td>
        <td><div class="tbl-pill">${esc(sp.page)}</div></td>
        <td><div class="tbl-pill">${esc(sp.notes)}</div></td>
      </tr>
    `).join("");
  }

  // =========================
  // Edit permissions
  // =========================
  let current = null;
  let editMode = false;

  function canEditCharacter(c) {
    const { user, token } = getAuth();
    if (!token || !user) return false;

    if (norm(user.role) === "admin") return true;

    const uName = norm(user.username);
    const createdBy = norm(c?.created_by ?? "");
    if (uName && createdBy && uName === createdBy) return true;

    return false;
  }

  function showActionsBar() {
    const bar = $("charActions");
    if (!bar) return;
    bar.style.display = (current && canEditCharacter(current)) ? "flex" : "none";
  }

  // =========================
  // Edit UI
  // =========================
  function setEditMode(on) {
    editMode = !!on;

    const editBtn = $("editBtn");
    const saveBtn = $("saveBtn");
    const cancelBtn = $("cancelBtn");

    if (editBtn) editBtn.style.display = on ? "none" : "inline-flex";
    if (saveBtn) saveBtn.style.display = on ? "inline-flex" : "none";
    if (cancelBtn) cancelBtn.style.display = on ? "inline-flex" : "none";

    if (!current) return;

    // Description
    const descEl = $("charDesc");
    if (descEl) {
      if (on) {
        descEl.innerHTML = `<textarea id="descTa" style="width:100%;min-height:90px;">${esc(current.description || "")}</textarea>`;
      } else {
        descEl.textContent = current.description || "—";
      }
    }

    // Equipment (edit raw lines)
    const equipList = $("equipList");
    if (equipList) {
      if (on) {
        const eqLines = normalizeArrayLike(current.equipment);
        equipList.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
          <textarea id="equipTa" style="width:100%;min-height:140px;" placeholder="Mỗi dòng 1 item">${esc(eqLines.join("\n"))}</textarea>
          <div class="empty" style="margin-top:8px;">Mỗi dòng 1 item</div>
        </li>`;
      } else {
        const eq = normalizeArrayLike(current.equipment);
        equipList.innerHTML = eq.length ? eq.map((i) => `<li>${esc(i)}</li>`).join("") : `<li class="empty">—</li>`;
      }
    }

    // Train/Prof/Action from notes
    const groups = splitNotes(current.notes || []);

    const trainUl = $("trainUl");
    if (trainUl) {
      if (on) {
        trainUl.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
          <textarea id="trainTa" style="width:100%;min-height:120px;">${esc(groups.train.join("\n"))}</textarea>
        </li>`;
      } else {
        trainUl.innerHTML = groups.train.length ? groups.train.map((x) => `<li>${esc(x)}</li>`).join("") : `<li class="empty">—</li>`;
      }
    }

    const profUl = $("profUl");
    if (profUl) {
      if (on) {
        profUl.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
          <textarea id="profTa" style="width:100%;min-height:120px;">${esc(groups.prof.join("\n"))}</textarea>
        </li>`;
      } else {
        profUl.innerHTML = groups.prof.length ? groups.prof.map((x) => `<li>${esc(x)}</li>`).join("") : `<li class="empty">—</li>`;
      }
    }

    const actionUl = $("actionUl");
    if (actionUl) {
      if (on) {
        actionUl.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
          <textarea id="actionTa" style="width:100%;min-height:120px;">${esc(groups.action.join("\n"))}</textarea>
        </li>`;
      } else {
        actionUl.innerHTML = groups.action.length ? groups.action.map((x) => `<li>${esc(x)}</li>`).join("") : `<li class="empty">—</li>`;
      }
    }

    // Resist/Immune/Vuln edit as textarea
    const setChipTa = (wrapId, taId, rawValue) => {
      const wrap = $(wrapId);
      if (!wrap) return;
      const lines = normalizeArrayLike(rawValue);
      wrap.className = "chip-group";
      wrap.innerHTML = `
        <textarea id="${taId}" style="width:100%;min-height:100px;">${esc(lines.join("\n"))}</textarea>
        <div class="empty" style="margin-top:8px;">Mỗi dòng 1 mục</div>
      `;
    };

    if (on) {
      setChipTa("resistChips", "resistTa", current.resistances);
      setChipTa("immuneChips", "immuneTa", current.immunities);
      setChipTa("vulnChips", "vulnTa", current.vulnerabilities);
    } else {
      renderChipGroup("resistChips", current.resistances);
      renderChipGroup("immuneChips", current.immunities);
      renderChipGroup("vulnChips", current.vulnerabilities);
    }

    // Senses edit (3 số)
    const senseUl = $("senseList");
    if (senseUl) {
      if (on) {
        const s = current.senses || {};
        senseUl.innerHTML = `
          <li style="list-style:none;padding:0;margin:0;">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
              <div><label style="font-size:12px;opacity:.75;">Passive Perception</label><input id="ppTa" type="number" value="${esc(s.passivePerception ?? 0)}" style="width:100%"></div>
              <div><label style="font-size:12px;opacity:.75;">Passive Insight</label><input id="piTa" type="number" value="${esc(s.passiveInsight ?? 0)}" style="width:100%"></div>
              <div><label style="font-size:12px;opacity:.75;">Passive Investigation</label><input id="pivTa" type="number" value="${esc(s.passiveInvestigation ?? 0)}" style="width:100%"></div>
            </div>
          </li>
        `;
      } else {
        renderSenses(current);
      }
    }

    // Features edit
    const featureUl = $("featureUl");
    if (featureUl) {
      if (on) {
        const lines = normalizeArrayLike(current.feature_lines ?? []);
        featureUl.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
          <textarea id="featuresTa" style="width:100%;min-height:140px;">${esc(lines.join("\n"))}</textarea>
        </li>`;
      } else {
        renderFeatures(current);
      }
    }

    // Spells edit (textarea raw lines w/o "Spell:")
    const spellBody = $("spellTbodyView");
    const spellEmpty = $("spellEmpty");
    if (spellBody && spellEmpty) {
      if (on) {
        spellBody.innerHTML = `
          <tr>
            <td colspan="10" style="padding:0 10px;">
              <textarea id="spellsTa" style="width:100%;min-height:180px;"
                placeholder="[P] Cure Wounds | Level:1 | Save/Atk:WIS | Time:1 action | Range:Touch | Comp:V,S | Dur:Instant | Page:230 | Notes:..."
              >${esc(splitNotes(current.notes || []).spells.join("\n"))}</textarea>
              <div class="empty" style="margin-top:8px;">Mỗi dòng 1 spell (không cần viết 'Spell:' — hệ thống tự thêm)</div>
            </td>
          </tr>
        `;
        spellEmpty.style.display = "none";
      } else {
        renderSpells(current);
      }
    }

    // Attacks edit (table-like inputs)
    const atkBox = $("atkBox");
    const atkEmpty = $("atkEmpty");
    if (atkBox && atkEmpty) {
      if (!on) {
        renderAttacks(current);
        return;
      }

      atkEmpty.style.display = "none";

      atkBox.innerHTML = `
        <div style="display:flex; gap:10px; margin:8px 0 10px;">
          <button type="button" id="atkAdd" class="btn btn--ghost">+ Add row</button>
          <button type="button" id="atkClear" class="btn btn--ghost">Clear all</button>
        </div>
        <div id="atkEditBody"></div>
      `;

      const body = $("atkEditBody");

      function makeRow(a = {}) {
        const div = document.createElement("div");
        div.className = "atk-row";
        div.innerHTML = `
          <div class="atk-box"><input class="atk-name"  value="${esc(a.name || "")}"  placeholder="Name" style="width:100%;border:0;background:transparent"></div>
          <div class="atk-box"><input class="atk-hit"   value="${esc(a.hit || "")}"   placeholder="+5" style="width:100%;border:0;background:transparent"></div>
          <div class="atk-box"><input class="atk-dmg"   value="${esc(a.dmg || "")}"   placeholder="1d8+3" style="width:100%;border:0;background:transparent"></div>
          <div class="atk-box"><input class="atk-notes" value="${esc(a.notes || "")}" placeholder="Notes" style="width:100%;border:0;background:transparent"></div>
          <button class="atk-del" type="button" title="Xóa">✕</button>
        `;
        div.querySelector(".atk-del").addEventListener("click", () => div.remove());
        return div;
      }

      const existing = splitNotes(current.notes || []).attacks.map(parseAttackLine);
      if (!existing.length) body.appendChild(makeRow({}));
      else existing.forEach((a) => body.appendChild(makeRow(a)));

      $("atkAdd")?.addEventListener("click", () => body.appendChild(makeRow({})));
      $("atkClear")?.addEventListener("click", () => (body.innerHTML = "", body.appendChild(makeRow({}))));
    }
  }

  // =========================
  // Load character (auth-first, fallback public)
  // =========================
  async function fetchCharacter(id) {
    const { token } = getAuth();

    if (token) {
      const r1 = await fetch(`/api/characters/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d1 = await r1.json().catch(() => ({}));
      if (r1.ok) return d1;
    }

    const r2 = await fetch(`/api/characters/public/${encodeURIComponent(id)}`);
    const d2 = await r2.json().catch(() => ({}));
    if (r2.ok) return d2;

    throw new Error("not_found");
  }

  async function loadCharacter() {
    const id = getIdFromUrl();
    if (!id) return;

    const container = document.querySelector(".character-page .container");

    try {
      const c = await fetchCharacter(id);
      current = c;

      const lv = Number(c.level || 1);
      if ($("charTitle")) $("charTitle").textContent = `${c.name} — ${c.race} ${c.class_name} (Cấp ${lv})`;
      if ($("charDesc")) $("charDesc").textContent = c.description || "—";

      const avatar = $("charAvatar");
      if (avatar) avatar.src = c.avatar && String(c.avatar).trim() ? c.avatar : "/Assets/images/sample.png";

      if ($("charRace")) $("charRace").textContent = c.race || "—";
      if ($("charClass")) $("charClass").textContent = c.class_name || "—";
      if ($("charAlign")) $("charAlign").textContent = c.alignment || "—";
      if ($("charBg")) $("charBg").textContent = c.background || "—";

      const st = c.stats || {};
      if ($("statStr")) $("statStr").textContent = st.str ?? 10;
      if ($("statDex")) $("statDex").textContent = st.dex ?? 10;
      if ($("statCon")) $("statCon").textContent = st.con ?? 10;
      if ($("statInt")) $("statInt").textContent = st.int ?? 10;
      if ($("statWis")) $("statWis").textContent = st.wis ?? 10;
      if ($("statCha")) $("statCha").textContent = st.cha ?? 10;

      if ($("combatHp")) $("combatHp").textContent = c.hp ?? 10;
      if ($("combatAc")) $("combatAc").textContent = c.ac ?? 10;
      if ($("combatSpeed")) $("combatSpeed").textContent = c.speed || "30 ft";

      const groups = splitNotes(c.notes || []);
      const meta = parseMetaMap(groups.meta);
      const initMeta = Number(meta.Initiative);
      if ($("combatInit")) {
        $("combatInit").textContent = Number.isFinite(initMeta)
          ? fmtSigned(initMeta)
          : fmtSigned(modFromScore(st.dex ?? 10));
      }

      renderSkills(c);
      renderSavingThrows(c);

      const eq = normalizeArrayLike(c.equipment);
      const equipList = $("equipList");
      if (equipList) {
        equipList.innerHTML = eq.length ? eq.map((i) => `<li>${esc(i)}</li>`).join("") : `<li class="empty">—</li>`;
      }

      const fillUl = (id2, arr) => {
        const ul = $(id2);
        if (!ul) return;
        ul.innerHTML = arr.length ? arr.map((x) => `<li>${esc(x)}</li>`).join("") : `<li class="empty">—</li>`;
      };
      fillUl("trainUl", groups.train);
      fillUl("profUl", groups.prof);
      fillUl("actionUl", groups.action);

      renderChipGroup("resistChips", c.resistances);
      renderChipGroup("immuneChips", c.immunities);
      renderChipGroup("vulnChips", c.vulnerabilities);
      renderSenses(c);

      renderFeatures(c);
      renderAttacks(c);
      renderSpells(c);

      showActionsBar();
      setEditMode(false);
    } catch (e) {
      if (container) {
        container.innerHTML = `<div class="card"><h3>Nhân vật không tồn tại hoặc chưa public.</h3></div>`;
      }
    }
  }

  // =========================
  // Save changes
  // =========================
  async function saveChanges() {
    if (!current) return;

    const { token } = getAuth();
    if (!token) {
      alert("Bạn cần đăng nhập để lưu.");
      return;
    }

    const id = getIdFromUrl();
    if (!id) return;

    const description = $("descTa") ? $("descTa").value : (current.description || "");
    const equipment = $("equipTa") ? readLines($("equipTa").value) : normalizeArrayLike(current.equipment);

    const resistances = $("resistTa") ? readLines($("resistTa").value) : normalizeArrayLike(current.resistances);
    const immunities = $("immuneTa") ? readLines($("immuneTa").value) : normalizeArrayLike(current.immunities);
    const vulnerabilities = $("vulnTa") ? readLines($("vulnTa").value) : normalizeArrayLike(current.vulnerabilities);

    const senses = {
      passivePerception: Number($("ppTa")?.value ?? current.senses?.passivePerception ?? 0) || 0,
      passiveInsight: Number($("piTa")?.value ?? current.senses?.passiveInsight ?? 0) || 0,
      passiveInvestigation: Number($("pivTa")?.value ?? current.senses?.passiveInvestigation ?? 0) || 0,
    };

    const feature_lines = $("featuresTa")
      ? readLines($("featuresTa").value)
      : normalizeArrayLike(current.feature_lines ?? []);

    const oldGroups = splitNotes(current.notes || []);
    const meta = parseMetaMap(oldGroups.meta);

    const train = $("trainTa") ? readLines($("trainTa").value) : oldGroups.train;
    const prof = $("profTa") ? readLines($("profTa").value) : oldGroups.prof;
    const action = $("actionTa") ? readLines($("actionTa").value) : oldGroups.action;

    const spellsRaw = $("spellsTa") ? readLines($("spellsTa").value) : oldGroups.spells;

    let attacksLines = oldGroups.attacks.slice();
    const atkEditBody = $("atkEditBody");
    if (atkEditBody) {
      const rows = Array.from(atkEditBody.querySelectorAll(".atk-row"));
      const collected = rows
        .map((row) => {
          const name = row.querySelector(".atk-name")?.value || "";
          const hit = row.querySelector(".atk-hit")?.value || "";
          const dmg = row.querySelector(".atk-dmg")?.value || "";
          const notes = row.querySelector(".atk-notes")?.value || "";
          return attackToLine({ name, hit, dmg, notes }).trim();
        })
        .filter((x) => x.replace(/\|/g, "").trim() !== "");
      attacksLines = collected;
    }

    const notes = [
      ...Object.entries(meta).map(([k, v]) => `Meta: ${k}=${v}`),
      ...train.map((x) => `Train: ${x}`),
      ...prof.map((x) => `Proficiency: ${x}`),
      ...action.map((x) => `Action: ${x}`),
      ...attacksLines.map((x) => `Attack: ${x}`),
      ...spellsRaw.map((x) => `Spell: ${x}`),
      ...oldGroups.other,
    ];

    const payload = {
      description,
      equipment,
      notes,
      feature_lines,
      resistances,
      immunities,
      vulnerabilities,
      senses,

      // keep required fields so schema.partial() vẫn ok
      name: current.name,
      race: current.race,
      class_name: current.class_name,
      level: current.level,
      alignment: current.alignment,
      background: current.background,
      avatar: current.avatar || "",
      stats: current.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      hp: current.hp,
      ac: current.ac,
      speed: current.speed,
      skills: current.skills || [],
      is_public: current.is_public,
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
        alert(data?.message || "Lưu thất bại.");
        return;
      }

      current = data; // lấy bản mới từ server
      setEditMode(false);
      await loadCharacter();
      alert("Đã lưu!");
    } catch (e) {
      alert("Lỗi mạng khi lưu.");
    }
  }

  function bindButtons() {
    $("editBtn")?.addEventListener("click", () => {
      if (!current) return;
      if (!canEditCharacter(current)) return;
      setEditMode(true);
    });

    $("saveBtn")?.addEventListener("click", () => {
      if (!current) return;
      if (!canEditCharacter(current)) return;
      saveChanges();
    });

    $("cancelBtn")?.addEventListener("click", () => {
      setEditMode(false);
      loadCharacter();
    });
  }

  bindButtons();
  loadCharacter();
})();
