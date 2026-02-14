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

  const fmtSigned = (n) => (Number(n) >= 0 ? `+${Number(n)}` : `${Number(n)}`);

  const pbFromLevel = (level) =>
    2 + Math.floor((clamp(Number(level || 1), 1, 20) - 1) / 4);

  const readLines = (text) =>
    String(text ?? "")
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

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
  // Notes parser (IMPORTANT)
  // =========================
  // Lưu Resist/Immune/Vuln/Sense + Train/Prof/Action/Feature/Attack/Spell trong notes.
  // Khi save chỉ thay nhóm bạn sửa, giữ nguyên phần khác để KHÔNG reset.
  const NOTE_PREFIX = {
    train: "Train:",
    prof: "Proficiency:",
    action: "Action:",
    feature: "Feature:",
    attack: "Attack:",
    spell: "Spell:",

    resist: "Resist:",
    immune: "Immune:",
    vuln: "Vulnerable:",
    sense: "Sense:",

    // giữ nguyên các dòng liên quan saving throw nếu có
    save: "Save:",
    savethrow: "SavingThrow:",
    saveprof: "SaveProf:",
  };

  function splitNotes(notesArr) {
    const out = {
      train: [],
      prof: [],
      action: [],
      feature: [],
      attacks: [],
      spells: [],
      resist: [],
      immune: [],
      vuln: [],
      sense: [],
      saveLines: [],
      other: [],
    };

    (Array.isArray(notesArr) ? notesArr : []).forEach((line) => {
      const s = String(line || "").trim();
      if (!s) return;

      if (s.startsWith(NOTE_PREFIX.train))
        out.train.push(s.replace(/^Train:\s*/, ""));
      else if (s.startsWith(NOTE_PREFIX.prof))
        out.prof.push(s.replace(/^Proficiency:\s*/, ""));
      else if (s.startsWith(NOTE_PREFIX.action))
        out.action.push(s.replace(/^Action:\s*/, ""));
      else if (s.startsWith(NOTE_PREFIX.feature))
        out.feature.push(s.replace(/^Feature:\s*/, ""));

      else if (s.startsWith(NOTE_PREFIX.attack))
        out.attacks.push(s.replace(/^Attack:\s*/, ""));
      else if (s.startsWith(NOTE_PREFIX.spell))
        out.spells.push(s.replace(/^Spell:\s*/, ""));

      else if (s.startsWith(NOTE_PREFIX.resist))
        out.resist.push(s.replace(/^Resist:\s*/, ""));
      else if (s.startsWith(NOTE_PREFIX.immune))
        out.immune.push(s.replace(/^Immune:\s*/, ""));
      else if (s.startsWith(NOTE_PREFIX.vuln))
        out.vuln.push(s.replace(/^Vulnerable:\s*/, ""));
      else if (s.startsWith(NOTE_PREFIX.sense))
        out.sense.push(s.replace(/^Sense:\s*/, ""));

      else if (
        s.startsWith(NOTE_PREFIX.save) ||
        s.startsWith(NOTE_PREFIX.savethrow) ||
        s.startsWith(NOTE_PREFIX.saveprof)
      ) {
        out.saveLines.push(s);
      } else out.other.push(s);
    });

    return out;
  }

  function rebuildNotesFromGroups(oldGroups, edited) {
    const train = (edited.train || []).map((x) => `${NOTE_PREFIX.train} ${x}`);
    const prof = (edited.prof || []).map((x) => `${NOTE_PREFIX.prof} ${x}`);
    const action = (edited.action || []).map((x) => `${NOTE_PREFIX.action} ${x}`);
    const feature = (edited.feature || []).map((x) => `${NOTE_PREFIX.feature} ${x}`);

    const resist = (edited.resist || []).map((x) => `${NOTE_PREFIX.resist} ${x}`);
    const immune = (edited.immune || []).map((x) => `${NOTE_PREFIX.immune} ${x}`);
    const vuln = (edited.vuln || []).map((x) => `${NOTE_PREFIX.vuln} ${x}`);
    const sense = (edited.sense || []).map((x) => `${NOTE_PREFIX.sense} ${x}`);

    // ✅ Attacks: dùng dữ liệu mới nếu có, nếu không thì giữ cũ
    const nextAttacksRaw = Array.isArray(edited.attacks)
      ? edited.attacks
      : (oldGroups.attacks || []);
    const nextAttacks = nextAttacksRaw.map((x) => `${NOTE_PREFIX.attack} ${x}`);

    const spells = (edited.spells || []).map((x) => `${NOTE_PREFIX.spell} ${x}`);

    const keepSaves = oldGroups.saveLines || [];
    const keepOther = oldGroups.other || [];

    return [
      ...train,
      ...prof,
      ...action,
      ...feature,

      ...resist,
      ...immune,
      ...vuln,
      ...sense,

      ...nextAttacks,
      ...spells,
      ...keepSaves,
      ...keepOther,
    ];
  }

  // =========================
  // Attack/Spell view helpers
  // =========================
  function parseAttackLine(s) {
    // format: "Shortbow | Hit:+3 | Dmg:1d6+3 Piercing | Notes:..."
    const parts = String(s || "").split("|").map((x) => x.trim());
    const name = parts[0] || "";
    const get = (prefix) => {
      const p = parts.find((x) => x.toLowerCase().startsWith(prefix));
      return p ? p.split(":").slice(1).join(":").trim() : "";
    };
    return { name, hit: get("hit"), dmg: get("dmg"), notes: get("notes") };
  }

  function buildAttackLine({ name, hit, dmg, notes }) {
    const n = String(name || "").trim();
    const h = String(hit || "").trim();
    const d = String(dmg || "").trim();
    const no = String(notes || "").trim();
    if (!n && !h && !d && !no) return null;
    return `${n || "-"} | Hit:${h || "-"} | Dmg:${d || "-"} | Notes:${no || "-"}`;
  }

  function parseSpellLine(s) {
    // format: "[P] Name | Src:... | Save/Atk:... | Time:... | Range:... | Comp:... | Dur:... | Page:... | Notes:..."
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
    const a = Array.isArray(arr) ? arr : [];
    ul.innerHTML = a.length
      ? a.map((x) => `<li>${esc(x)}</li>`).join("")
      : `<li class="empty">—</li>`;
  }

  // =========================
  // Skills view
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

  function renderSkills(c) {
    const skillsGrid = $("skillsGrid");
    if (!skillsGrid) return;

    const level = Number(c.level || 1);
    const PB = pbFromLevel(level);

    // IMPORTANT: CHỈ đọc c.skills - KHÔNG ghi lên server khi save
    const profSet = new Set(
      (Array.isArray(c.skills) ? c.skills : [])
        .map((x) => String(x).trim().toLowerCase())
        .filter(Boolean)
    );

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
          <div class="skill-mod">${fmtSigned(total)}</div>
        </div>
      `;
    }).join("");
  }

  // =========================
  // Defenses view
  // =========================
  function renderChips(elId, arr) {
    const el = $(elId);
    if (!el) return;
    const a = Array.isArray(arr) ? arr.filter(Boolean) : [];
    el.innerHTML = a.length
      ? a.map((x) => `<span>${esc(x)}</span>`).join("")
      : `<span class="empty">—</span>`;
  }

  function renderSenseList(senseArr) {
    const ul = $("senseList");
    if (!ul) return;
    const a = Array.isArray(senseArr) ? senseArr.filter(Boolean) : [];
    ul.innerHTML = a.length
      ? a.map((x) => `<li>${esc(x)}</li>`).join("")
      : `<li class="empty">—</li>`;
  }

  // =========================
  // Edit mode state
  // =========================
  let current = null;
  let canEdit = false;
  let isEditing = false;

  function showActions() {
    const bar = $("charActions");
    if (!bar) return;
    bar.style.display = canEdit ? "flex" : "none";
  }

  function setEditButtons() {
    const editBtn = $("editBtn");
    const saveBtn = $("saveBtn");
    const cancelBtn = $("cancelBtn");
    if (!editBtn || !saveBtn || !cancelBtn) return;

    editBtn.style.display = isEditing ? "none" : "inline-flex";
    saveBtn.style.display = isEditing ? "inline-flex" : "none";
    cancelBtn.style.display = isEditing ? "inline-flex" : "none";
  }

  function ensureAtkAddButton() {
    const atkBox = $("atkBox");
    if (!atkBox) return;

    // nếu đã có thì thôi
    if ($("atkAddBtn")) return;

    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.justifyContent = "flex-end";
    wrap.style.gap = "8px";
    wrap.style.margin = "8px 0 10px";

    wrap.innerHTML = `
      <button id="atkAddBtn" type="button" class="atk-add-btn" style="
        border:1px solid #e5e7eb;background:#fff;border-radius:12px;
        padding:10px 12px;cursor:pointer;font-weight:700;
      ">+ Thêm đòn đánh</button>
    `;

    // chèn ngay trước atkBox
    atkBox.parentElement.insertBefore(wrap, atkBox);
  }

  function renderAtkRowEdit(a = { name: "", hit: "", dmg: "", notes: "" }) {
    return `
      <div class="atk-row atk-edit-row">
        <div class="atk-box">
          <input class="atk-in atk-name" type="text" value="${esc(a.name)}" placeholder="Name"
            style="width:100%;border:0;outline:none;background:transparent;">
        </div>
        <div class="atk-box">
          <input class="atk-in atk-hit" type="text" value="${esc(a.hit)}" placeholder="+X"
            style="width:100%;border:0;outline:none;background:transparent;">
        </div>
        <div class="atk-box">
          <input class="atk-in atk-dmg" type="text" value="${esc(a.dmg)}" placeholder="1d6+3"
            style="width:100%;border:0;outline:none;background:transparent;">
        </div>
        <div class="atk-box">
          <input class="atk-in atk-notes" type="text" value="${esc(a.notes)}" placeholder="Notes"
            style="width:100%;border:0;outline:none;background:transparent;">
        </div>
        <button class="atk-del" type="button" title="Xoá">✕</button>
      </div>
    `;
  }

  function enterEditMode() {
    if (!current) return;
    isEditing = true;
    setEditButtons();

    // Description
    const descEl = $("charDesc");
    if (descEl) {
      const curVal = descEl.textContent === "—" ? "" : descEl.textContent;
      descEl.innerHTML = `<textarea id="charDesc__ta" style="width:100%;min-height:90px;">${esc(
        curVal
      )}</textarea>`;
    }

    // Stats + hp/ac
    const idsNum = [
      "statStr",
      "statDex",
      "statCon",
      "statInt",
      "statWis",
      "statCha",
      "combatHp",
      "combatAc",
    ];
    idsNum.forEach((id) => {
      const el = $(id);
      if (!el) return;
      const v = Number(el.textContent) || 0;
      el.innerHTML = `<input id="${id}__in" type="number" value="${v}" style="width:100%;max-width:110px;">`;
    });

    // Speed
    const speedEl = $("combatSpeed");
    if (speedEl) {
      const v = speedEl.textContent || "";
      speedEl.innerHTML = `<input id="combatSpeed__in" type="text" value="${esc(
        v
      )}" style="width:100%;max-width:160px;">`;
    }

    // Equipment
    const eqEl = $("equipList");
    if (eqEl) {
      const eq = Array.isArray(current.equipment) ? current.equipment : [];
      eqEl.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
        <textarea id="equipTa" style="width:100%;min-height:140px;" placeholder="Mỗi dòng 1 item...">${esc(
          eq.join("\n")
        )}</textarea>
      </li>`;
    }

    const groups = splitNotes(current.notes || []);

    const setTaInUl = (ulId, taId, lines, ph) => {
      const ul = $(ulId);
      if (!ul) return;
      ul.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
        <textarea id="${taId}" style="width:100%;min-height:120px;" placeholder="${esc(
          ph || "Mỗi dòng 1 mục..."
        )}">${esc((lines || []).join("\n"))}</textarea>
      </li>`;
    };

    setTaInUl("trainUl", "trainTa", groups.train, "Mỗi dòng 1 Train...");
    setTaInUl("profUl", "profTa", groups.prof, "Mỗi dòng 1 Proficiency...");
    setTaInUl("actionUl", "actionTa", groups.action, "Mỗi dòng 1 Action...");

    if ($("featureUl")) {
      setTaInUl("featureUl", "featureTa", groups.feature, "Mỗi dòng 1 Feature...");
    }

    // Defenses: render textarea trong các vùng chips
    const setChipTa = (wrapId, taId, lines, ph) => {
      const wrap = $(wrapId);
      if (!wrap) return;
      wrap.innerHTML = `
        <textarea id="${taId}" style="width:100%;min-height:90px;" placeholder="${esc(
          ph || "Mỗi dòng 1 mục"
        )}">${esc((lines || []).join("\n"))}</textarea>
        <div class="empty" style="margin-top:8px;">Mỗi dòng 1 mục</div>
      `;
    };

    setChipTa(
      "resistChips",
      "resistTa",
      groups.resist,
      "Ví dụ:\nFire\nCold\nPoison"
    );
    setChipTa(
      "immuneChips",
      "immuneTa",
      groups.immune,
      "Ví dụ:\nPoison\nNecrotic"
    );
    setChipTa("vulnChips", "vulnTa", groups.vuln, "Ví dụ:\nRadiant");

    // Senses
    const senseUl = $("senseList");
    if (senseUl) {
      senseUl.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
        <textarea id="sensesTa" style="width:100%;min-height:90px;" placeholder="Ví dụ:\nDarkvision 60 ft\nPassive Perception 13">${esc(
          groups.sense.join("\n")
        )}</textarea>
        <div class="empty" style="margin-top:8px;">Mỗi dòng 1 mục</div>
      </li>`;
    }

    // ===== Attacks (EDIT like your screenshot) =====
    const atkBox = $("atkBox");
    const atkEmpty = $("atkEmpty");
    ensureAtkAddButton();

    const atkRows = (groups.attacks || []).map(parseAttackLine);
    if (atkBox) {
      atkBox.innerHTML = atkRows.length
        ? atkRows.map(renderAtkRowEdit).join("")
        : "";
    }
    if (atkEmpty) atkEmpty.style.display = atkRows.length ? "none" : "block";

    // delete row (delegation)
    if (atkBox && !atkBox.__wiredDelete) {
      atkBox.addEventListener("click", (e) => {
        const btn = e.target.closest(".atk-del");
        if (!btn) return;
        const row = btn.closest(".atk-edit-row");
        if (row) row.remove();
        if (atkEmpty) {
          const left = atkBox.querySelectorAll(".atk-edit-row").length;
          atkEmpty.style.display = left ? "none" : "block";
        }
      });
      atkBox.__wiredDelete = true;
    }

    const atkAddBtn = $("atkAddBtn");
    if (atkAddBtn && !atkAddBtn.__wiredAdd) {
      atkAddBtn.addEventListener("click", () => {
        const box = $("atkBox");
        if (!box) return;
        if (atkEmpty) atkEmpty.style.display = "none";
        box.insertAdjacentHTML("beforeend", renderAtkRowEdit());
      });
      atkAddBtn.__wiredAdd = true;
    }

    // Spells -> textarea
    const spellBody = $("spellTbodyView");
    const spellEmpty = $("spellEmpty");
    if (spellBody) {
      spellBody.innerHTML = `
        <tr>
          <td colspan="11" style="padding:0 10px;">
            <textarea id="spellsTa" style="width:100%;min-height:180px;"
              placeholder="[P] Cure Wounds | Src:PHB | Save/Atk:WIS | Time:1 action | Range:Touch | Comp:V,S | Dur:Instant | Page:230 | Notes:..."
            >${esc(groups.spells.join("\n"))}</textarea>
            <div class="empty" style="margin-top:8px;">Mỗi dòng 1 spell (đúng format bạn đang dùng)</div>
          </td>
        </tr>
      `;
      if (spellEmpty) spellEmpty.style.display = "none";
    }
  }

  function exitEditMode() {
    isEditing = false;
    setEditButtons();
    loadCharacter().catch(() => {});
  }

  async function saveChanges() {
    const { token } = getAuth();
    if (!token) {
      alert("Bạn cần đăng nhập để sửa.");
      return;
    }
    const id = getIdFromUrl();
    if (!id) return;

    // Stats
    const stats = {
      str: Number($("statStr__in")?.value ?? current?.stats?.str ?? 10) || 10,
      dex: Number($("statDex__in")?.value ?? current?.stats?.dex ?? 10) || 10,
      con: Number($("statCon__in")?.value ?? current?.stats?.con ?? 10) || 10,
      int: Number($("statInt__in")?.value ?? current?.stats?.int ?? 10) || 10,
      wis: Number($("statWis__in")?.value ?? current?.stats?.wis ?? 10) || 10,
      cha: Number($("statCha__in")?.value ?? current?.stats?.cha ?? 10) || 10,
    };

    const hp = Number($("combatHp__in")?.value ?? current?.hp ?? 10) || 10;
    const ac = Number($("combatAc__in")?.value ?? current?.ac ?? 10) || 10;
    const speed =
      String($("combatSpeed__in")?.value ?? current?.speed ?? "30 ft").trim() ||
      "30 ft";
    const description = String(
      $("charDesc__ta")?.value ?? current?.description ?? ""
    ).trim();

    const equipment = readLines(
      $("equipTa")?.value ??
        (Array.isArray(current?.equipment) ? current.equipment.join("\n") : "")
    );

    const oldGroups = splitNotes(current?.notes || []);

    const edited = {
      train: readLines($("trainTa")?.value),
      prof: readLines($("profTa")?.value),
      action: readLines($("actionTa")?.value),
      feature: $("featureTa") ? readLines($("featureTa").value) : oldGroups.feature,
      spells: $("spellsTa") ? readLines($("spellsTa").value) : oldGroups.spells,

      resist: $("resistTa") ? readLines($("resistTa").value) : oldGroups.resist,
      immune: $("immuneTa") ? readLines($("immuneTa").value) : oldGroups.immune,
      vuln: $("vulnTa") ? readLines($("vulnTa").value) : oldGroups.vuln,
      sense: $("sensesTa") ? readLines($("sensesTa").value) : oldGroups.sense,

      // Attacks will be added below
      attacks: null,
    };

    // ===== Attacks from UI =====
    const atkBox = $("atkBox");
    let attacks = [];
    if (atkBox) {
      const rows = Array.from(atkBox.querySelectorAll(".atk-edit-row"));
      attacks = rows
        .map((row) => ({
          name: row.querySelector(".atk-name")?.value,
          hit: row.querySelector(".atk-hit")?.value,
          dmg: row.querySelector(".atk-dmg")?.value,
          notes: row.querySelector(".atk-notes")?.value,
        }))
        .map(buildAttackLine)
        .filter(Boolean);
    }
    edited.attacks = attacks;

    const notes = rebuildNotesFromGroups(oldGroups, edited);

    // Payload tối thiểu:
    // ✅ KHÔNG gửi skills / saving_throws => tránh reset
    const payload = {
      description,
      stats,
      hp,
      ac,
      speed,
      equipment,
      notes,
    };

    const res = await fetch(`/api/characters/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert("Lưu thất bại: " + (t || res.status));
      return;
    }

    await loadCharacter();
    isEditing = false;
    setEditButtons();
  }

  // =========================
  // Main load
  // =========================
  async function loadCharacter() {
    const id = getIdFromUrl();
    if (!id) return;

    const container = document.querySelector(".character-page .container");

    const res = await fetch(`/api/characters/public/${encodeURIComponent(id)}`);
    const c = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (container) {
        container.innerHTML = `<div class="card"><h3>Nhân vật không tồn tại hoặc chưa public.</h3></div>`;
      }
      return;
    }

    current = c;

    // Permission: admin hoặc người tạo
    const { user } = getAuth();
    const isAdmin = user?.role === "admin";
    const byUsername =
      c?.created_by &&
      user?.username &&
      String(c.created_by).toLowerCase() ===
        String(user.username).toLowerCase();
    const byId =
      c?.owner_id && user?.id && Number(c.owner_id) === Number(user.id);

    canEdit = Boolean(isAdmin || byUsername || byId);
    showActions();

    // HERO
    const lv = Number(c.level || 1);
    if ($("charTitle")) {
      $("charTitle").textContent = `${c.name || "Nhân vật"} — ${
        c.race || "—"
      } ${c.class_name || "—"} (Cấp ${lv})`;
    }
    if ($("charDesc")) $("charDesc").textContent = c.description || "—";

    const avatar = $("charAvatar");
    if (avatar)
      avatar.src =
        c.avatar && String(c.avatar).trim()
          ? c.avatar
          : "/Assets/images/sample.png";

    if ($("charRace")) $("charRace").textContent = c.race || "—";
    if ($("charClass")) $("charClass").textContent = c.class_name || "—";
    if ($("charAlign")) $("charAlign").textContent = c.alignment || "—";
    if ($("charBg")) $("charBg").textContent = c.background || "—";

    // Stats/combat
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
    if ($("combatInit"))
      $("combatInit").textContent = fmtSigned(modFromScore(st.dex ?? 10));

    // Skills (view)
    renderSkills(c);

    // Equipment (view)
    const eq = Array.isArray(c.equipment) ? c.equipment : [];
    if ($("equipList")) {
      $("equipList").innerHTML = eq.length
        ? eq.map((i) => `<li>${esc(i)}</li>`).join("")
        : `<li class="empty">—</li>`;
    }

    // Notes -> sections
    const groups = splitNotes(c.notes);

    fillUl("trainUl", groups.train);
    fillUl("profUl", groups.prof);
    fillUl("actionUl", groups.action);
    if ($("featureUl")) fillUl("featureUl", groups.feature);

    // Defenses + senses
    renderChips("resistChips", groups.resist);
    renderChips("immuneChips", groups.immune);
    renderChips("vulnChips", groups.vuln);
    renderSenseList(groups.sense);

    // Attacks (view)
    const atkBox = $("atkBox");
    const atkEmpty = $("atkEmpty");
    if (atkBox && atkEmpty) {
      const atkRows = (groups.attacks || []).map(parseAttackLine);
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

    // Spells (view)
    const spellBody = $("spellTbodyView");
    const spellEmpty = $("spellEmpty");
    if (spellBody && spellEmpty) {
      const spells = (groups.spells || []).map(parseSpellLine);
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
  }

  // =========================
  // Wire buttons
  // =========================
  function wireEvents() {
    const editBtn = $("editBtn");
    const saveBtn = $("saveBtn");
    const cancelBtn = $("cancelBtn");

    if (editBtn) editBtn.addEventListener("click", () => enterEditMode());
    if (saveBtn) saveBtn.addEventListener("click", () => saveChanges());
    if (cancelBtn) cancelBtn.addEventListener("click", () => exitEditMode());

    setEditButtons();
  }

  wireEvents();
  loadCharacter().catch(() => {
    const container = document.querySelector(".character-page .container");
    if (container)
      container.innerHTML = `<div class="card"><h3>Lỗi tải nhân vật.</h3></div>`;
  });
})();
