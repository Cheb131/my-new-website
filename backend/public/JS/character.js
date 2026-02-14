(() => {
  // ========== Utils ==========
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));

  const $ = (id) => document.getElementById(id);

  function fmtSigned(n) {
    return n >= 0 ? `+${n}` : `${n}`;
  }

  function modFromScore(score) {
    const s = Number(score ?? 10);
    return Math.floor((s - 10) / 2);
  }

  function pbFromLevel(level) {
    const lv = Math.max(1, Math.min(20, Number(level || 1)));
    return 2 + Math.floor((lv - 1) / 4);
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

  // ========== Auth (UI only) ==========
  function getAuth() {
    const token = localStorage.getItem("token");
    if (!token) return { token: null, user: null };

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return { token, user: payload }; // { id, role, username, exp... }
    } catch {
      return { token: null, user: null };
    }
  }

  function norm(s) {
    return String(s || "").trim().toLowerCase();
  }

  // ========== Notes parsing ==========
  function splitNotes(notesArr) {
    const out = { train: [], prof: [], action: [], attacks: [], spells: [], other: [] };

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
    const parts = String(s).split("|").map((x) => x.trim());
    const name = parts[0] || "";

    const get = (prefix) => {
      const p = parts.find((x) => x.toLowerCase().startsWith(prefix));
      return p ? p.split(":").slice(1).join(":").trim() : "";
    };

    return { name, hit: get("hit"), dmg: get("dmg"), notes: get("notes") };
  }

  function parseSpellLine(s) {
    const parts = String(s).split("|").map((x) => x.trim());
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

  // ========== Skills ==========
  const SKILLS = [
    { key: "Nhào lộn", abil: "dex" },
    { key: "Thuần hóa", abil: "wis" },
    { key: "Huyễn học", abil: "int" },
    { key: "Vận động", abil: "str" },
    { key: "Lừa gạt", abil: "cha" },
    { key: "Lịch sử", abil: "int" },
    { key: "Thấu hiểu", abil: "wis" },
    { key: "Đe dọa", abil: "cha" },
    { key: "Điều tra", abil: "int" },
    { key: "Y học", abil: "wis" },
    { key: "Thiên nhiên", abil: "int" },
    { key: "Nhận thức", abil: "wis" },
    { key: "Biểu diễn", abil: "cha" },
    { key: "Thuyết phục", abil: "cha" },
    { key: "Tôn giáo", abil: "int" },
    { key: "Khéo tay", abil: "dex" },
    { key: "Ẩn nấp", abil: "dex" },
    { key: "Sinh tồn", abil: "wis" },
  ];

  function renderSkills(character) {
    const skillsGrid = $("skillsGrid");
    if (!skillsGrid) return;

    const level = Number(character.level || 1);
    const PB = pbFromLevel(level);

    const profSet = new Set(
      (Array.isArray(character.skills) ? character.skills : []).map((s) => norm(s))
    );

    const st = character.stats || {};

    skillsGrid.innerHTML = SKILLS.map((s) => {
      const abilScore = st[s.abil] ?? 10;
      const base = modFromScore(abilScore);

      const norm1 = norm(s.key);
      const norm2 = norm1.replace(/\s+/g, "_");
      const isProf = profSet.has(norm1) || profSet.has(norm2);

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

  // ========== Saving Throws ==========
  const SAVES = [
    { key: "Sức mạnh", short: "STR", abil: "str" },
    { key: "Nhanh nhẹn", short: "DEX", abil: "dex" },
    { key: "Thể chất", short: "CON", abil: "con" },
    { key: "Thông minh", short: "INT", abil: "int" },
    { key: "Uyên bác", short: "WIS", abil: "wis" },
    { key: "Thu hút", short: "CHA", abil: "cha" },
  ];

  function normToken(v) {
    return String(v || "").toLowerCase().replace(/\s+/g, "").replace(/_/g, "");
  }

  function renderSavingThrows(character) {
    const savingGrid = $("savingGrid");
    if (!savingGrid) return;

    const level = Number(character.level || 1);
    const PB = pbFromLevel(level);

    const raw = character.saving_throws ?? character.save_proficiencies ?? character.saves ?? [];
    const profSet = new Set((Array.isArray(raw) ? raw : []).map(normToken));

    const st = character.stats || {};

    savingGrid.innerHTML = SAVES.map((s) => {
      const base = modFromScore(st[s.abil] ?? 10);

      const isProf =
        profSet.has(normToken(s.abil)) ||
        profSet.has(normToken(s.key)) ||
        profSet.has(normToken(s.short));

      const total = base + (isProf ? PB : 0);

      return `
        <div class="skill-item ${isProf ? "skill-prof" : ""}">
          <div class="skill-left">
            <div class="skill-name">${esc(s.key)}</div>
            <div class="skill-abil">(${s.short})</div>
          </div>
          <div class="skill-mod">${fmtSigned(total)}</div>
        </div>
      `;
    }).join("");
  }

  // ========== Defenses / Senses (giữ như bạn đang có) ==========
  function asArray(v) {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return [];
      return s.split(/[,;]+/).map((x) => x.trim()).filter(Boolean);
    }
    return [];
  }

  function renderChips(elId, items) {
    const el = document.getElementById(elId);
    if (!el) return;

    const arr = asArray(items);
    if (!arr.length) {
      el.innerHTML = `<span class="empty">—</span>`;
      return;
    }

    // esc dùng trong IIFE nên dùng lại bằng cách copy safe:
    el.innerHTML = arr.map((x) => `<span>${String(x)
      .replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m]))}</span>`).join("");
  }

  function renderSenseList(character) {
    const ul = document.getElementById("senseList");
    if (!ul) return;

    const sensesRaw = character.senses ?? character.sense ?? character.sensor ?? null;

    if (sensesRaw && typeof sensesRaw === "object" && !Array.isArray(sensesRaw)) {
      const entries = Object.entries(sensesRaw)
        .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "");

      if (!entries.length) {
        ul.innerHTML = `<li class="empty">—</li>`;
        return;
      }

      ul.innerHTML = entries.map(([k, v]) => {
        const label = String(k)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return `<li><strong>${esc(label)}:</strong> ${esc(v)}</li>`;
      }).join("");
      return;
    }

    const arr = asArray(sensesRaw);
    ul.innerHTML = arr.length
      ? arr.map((x) => `<li>${esc(x)}</li>`).join("")
      : `<li class="empty">—</li>`;
  }

  // ========== Edit mode ==========
  let current = null;
  let canEdit = false;

  function showActions() {
    const bar = $("charActions");
    if (!bar) return;
    bar.style.display = canEdit ? "flex" : "none";
  }

  function setEditMode(on) {
    const editBtn = $("editBtn");
    const saveBtn = $("saveBtn");
    const cancelBtn = $("cancelBtn");

    if (!editBtn || !saveBtn || !cancelBtn) return;

    editBtn.style.display = on ? "none" : "inline-flex";
    saveBtn.style.display = on ? "inline-flex" : "none";
    cancelBtn.style.display = on ? "inline-flex" : "none";

    // Toggle inputs
    const idsText = ["charDesc"];
    idsText.forEach((id) => {
      const el = $(id);
      if (!el) return;

      if (on) {
        const curVal = el.textContent === "—" ? "" : el.textContent;
        el.innerHTML = `<textarea id="${id}__ta" style="width:100%;min-height:90px;">${esc(curVal)}</textarea>`;
      } else {
        // render lại bằng loadCharacter() cho chắc
      }
    });

    // Numeric fields -> input
    const idsNum = ["statStr", "statDex", "statCon", "statInt", "statWis", "statCha", "combatHp", "combatAc"];
    idsNum.forEach((id) => {
      const el = $(id);
      if (!el) return;

      if (on) {
        const v = Number(el.textContent) || 0;
        el.innerHTML = `<input id="${id}__in" type="number" value="${v}" style="width:100%;max-width:110px;">`;
      }
    });

    // Speed -> input text
    const speedEl = $("combatSpeed");
    if (speedEl && on) {
      const v = speedEl.textContent || "";
      speedEl.innerHTML = `<input id="combatSpeed__in" type="text" value="${esc(v)}" style="width:100%;max-width:160px;">`;
    }

    // Equipment list -> textarea lines
    const eqEl = $("equipList");
    if (eqEl && on) {
      const eq = Array.isArray(current?.equipment) ? current.equipment : [];
      eqEl.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
        <textarea id="equipTa" style="width:100%;min-height:140px;" placeholder="Mỗi dòng 1 item...">${esc(eq.join("\n"))}</textarea>
      </li>`;
    }

    // Train/Proficiency/Action -> textarea (mỗi dòng)
    const groups = splitNotes(current?.notes || []);
    const setTa = (ulId, taId, lines) => {
      const ul = $(ulId);
      if (!ul) return;
      ul.innerHTML = `<li style="list-style:none;padding:0;margin:0;">
        <textarea id="${taId}" style="width:100%;min-height:120px;" placeholder="Mỗi dòng 1 mục...">${esc(lines.join("\n"))}</textarea>
      </li>`;
    };

    if (on) {
      setTa("trainUl", "trainTa", groups.train);
      setTa("profUl", "profTa", groups.prof);
      setTa("actionUl", "actionTa", groups.action);
    }
  }

  function readLines(text) {
    return String(text || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function saveChanges() {
    const { token } = getAuth();
    if (!token) {
      alert("Bạn cần đăng nhập để sửa.");
      return;
    }

    const id = new URLSearchParams(location.search).get("id");
    if (!id) return;

    // lấy giá trị từ inputs/textarea
    const stats = {
      str: Number($("statStr__in")?.value) || 10,
      dex: Number($("statDex__in")?.value) || 10,
      con: Number($("statCon__in")?.value) || 10,
      int: Number($("statInt__in")?.value) || 10,
      wis: Number($("statWis__in")?.value) || 10,
      cha: Number($("statCha__in")?.value) || 10,
    };

    const hp = Number($("combatHp__in")?.value) || 10;
    const ac = Number($("combatAc__in")?.value) || 10;
    const speed = String($("combatSpeed__in")?.value || "").trim() || "30 ft";
    const description = String($("charDesc__ta")?.value || "").trim();

    const equipment = readLines($("equipTa")?.value);

    // build notes back
    const train = readLines($("trainTa")?.value).map((x) => `Train: ${x}`);
    const prof = readLines($("profTa")?.value).map((x) => `Proficiency: ${x}`);
    const action = readLines($("actionTa")?.value).map((x) => `Action: ${x}`);

    // giữ lại attacks/spells/other cũ để không mất
    const oldGroups = splitNotes(current?.notes || []);
    const notes = [
      ...train,
      ...prof,
      ...action,
      ...oldGroups.attacks.map((x) => `Attack: ${x}`),
      ...oldGroups.spells.map((x) => `Spell: ${x}`),
      ...oldGroups.other,
    ];

    const payload = { description, stats, hp, ac, speed, equipment, notes };

    const res = await fetch(`/api/characters/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text();
      alert("Lưu thất bại: " + t);
      return;
    }

    await loadCharacter(); // reload + thoát edit
  }

  // ========== Main load ==========
  async function loadCharacter() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return;

    const container = document.querySelector(".character-page .container");

    try {
      const res = await fetch(`/api/characters/public/${encodeURIComponent(id)}`);
      const c = await res.json().catch(() => ({}));

      if (!res.ok) {
        container.innerHTML = `<div class="card"><h3>Nhân vật không tồn tại hoặc chưa public.</h3></div>`;
        return;
      }

      current = c;

      const lv = Number(c.level || 1);
      $("charTitle").textContent = `${c.name} — ${c.race} ${c.class_name} (Cấp ${lv})`;
      $("charDesc").textContent = c.description || "—";

      const avatar = $("charAvatar");
      avatar.src = (c.avatar && String(c.avatar).trim()) ? c.avatar : "/Assets/images/sample.png";

      $("charRace").textContent = c.race || "—";
      $("charClass").textContent = c.class_name || "—";
      $("charAlign").textContent = c.alignment || "—";
      $("charBg").textContent = c.background || "—";

      const st = c.stats || {};
      $("statStr").textContent = st.str ?? 10;
      $("statDex").textContent = st.dex ?? 10;
      $("statCon").textContent = st.con ?? 10;
      $("statInt").textContent = st.int ?? 10;
      $("statWis").textContent = st.wis ?? 10;
      $("statCha").textContent = st.cha ?? 10;

      $("combatHp").textContent = c.hp ?? 10;
      $("combatAc").textContent = c.ac ?? 10;
      $("combatSpeed").textContent = c.speed || "30 ft";
      $("combatInit").textContent = fmtSigned(modFromScore(st.dex ?? 10));

      renderSkills(c);
      renderSavingThrows(c);

      // Defenses + Senses
      const resist = c.resistances ?? c.resistance ?? c.damage_resistances ?? c.dr ?? [];
      const immune = c.immunities ?? c.immunity ?? c.damage_immunities ?? c.di ?? [];
      const vuln = c.vulnerabilities ?? c.vulnerability ?? c.damage_vulnerabilities ?? c.dv ?? [];
      renderChips("resistChips", resist);
      renderChips("immuneChips", immune);
      renderChips("vulnChips", vuln);
      renderSenseList(c);

      // Equipment
      const eq = Array.isArray(c.equipment) ? c.equipment : [];
      $("equipList").innerHTML = eq.length
        ? eq.map((i) => `<li>${esc(i)}</li>`).join("")
        : `<li class="empty">—</li>`;

      // Notes split
      const groups = splitNotes(c.notes);
      fillUl("trainUl", groups.train);
      fillUl("profUl", groups.prof);
      fillUl("actionUl", groups.action);

      // Attacks
      const atkBox = $("atkBox");
      const atkEmpty = $("atkEmpty");
      const atkRows = groups.attacks.map(parseAttackLine);

      if (!atkRows.length) {
        atkBox.innerHTML = "";
        atkEmpty.hidden = false;
      } else {
        atkEmpty.hidden = true;
        atkBox.innerHTML = atkRows.map((a) => `
          <div class="atk-row">
            <div class="atk-box">${esc(a.name)}</div>
            <div class="atk-box">${esc(a.hit || "-")}</div>
            <div class="atk-box">${esc(a.dmg || "-")}</div>
            <div class="atk-box">${esc(a.notes || "-")}</div>
            <button class="atk-del" type="button" disabled title="Chỉ xem">✕</button>
          </div>
        `).join("");
      }

      // Spells
      const spellBody = $("spellTbodyView");
      const spellEmpty = $("spellEmpty");
      const spells = groups.spells.map(parseSpellLine);

      if (!spells.length) {
        spellBody.innerHTML = "";
        spellEmpty.hidden = false;
      } else {
        spellEmpty.hidden = true;
        spellBody.innerHTML = spells.map((sp) => `
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
        `).join("");
      }

      // ===== quyền edit: owner hoặc admin =====
      const { token, user } = getAuth();
      canEdit =
        !!token &&
        !!user &&
        (user.role === "admin" || norm(c.created_by) === norm(user.username));

      showActions();

      // thoát edit mode nếu đang bật
      setEditMode(false);
    } catch (e) {
      container.innerHTML = `<div class="card"><h3>Lỗi tải nhân vật.</h3></div>`;
    }
  }

  // Bind buttons
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t) return;

    if (t.id === "editBtn") {
      if (!canEdit) return;
      setEditMode(true);
    }

    if (t.id === "cancelBtn") {
      loadCharacter(); // reload lại dữ liệu, tự tắt edit
    }

    if (t.id === "saveBtn") {
      saveChanges();
    }
  });

  loadCharacter();
})();
