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
    // "Shortbow | Hit:+3 | Dmg:1d6+3 Piercing | Notes:..."
    const parts = String(s).split("|").map((x) => x.trim());
    const name = parts[0] || "";

    const get = (prefix) => {
      const p = parts.find((x) => x.toLowerCase().startsWith(prefix));
      return p ? p.split(":").slice(1).join(":").trim() : "";
    };

    return { name, hit: get("hit"), dmg: get("dmg"), notes: get("notes") };
  }

  function parseSpellLine(s) {
    // "[P] Name | Src:... | Save/Atk:... | Time:... | Range:... | Comp:... | Dur:... | Page:... | Notes:..."
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
      (Array.isArray(character.skills) ? character.skills : [])
        .map((s) => String(s).toLowerCase())
    );

    const st = character.stats || {};

    skillsGrid.innerHTML = SKILLS.map((s) => {
      const abilScore = st[s.abil] ?? 10;
      const base = modFromScore(abilScore);

      const norm1 = s.key.toLowerCase();
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
  return String(v || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function renderSavingThrows(character) {
  const savingGrid = $("savingGrid");
  if (!savingGrid) return;

  const level = Number(character.level || 1);
  const PB = pbFromLevel(level);

  // hỗ trợ nhiều kiểu backend có thể trả
  const raw =
    character.saving_throws ??
    character.save_proficiencies ??
    character.saves ??
    [];

  const profSet = new Set((Array.isArray(raw) ? raw : []).map(normToken));

  const st = character.stats || {};

  savingGrid.innerHTML = SAVES.map((s) => {
    const base = modFromScore(st[s.abil] ?? 10);

    // match "str"/"dex"... hoặc "Strength"/"STR"...
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

      // ===== Defenses (R/I/V) =====
    const resist =
    c.resistances ?? c.resistance ?? c.damage_resistances ?? c.dr ?? [];
    const immune =
    c.immunities ?? c.immunity ?? c.damage_immunities ?? c.di ?? [];
    const vuln =
    c.vulnerabilities ?? c.vulnerability ?? c.damage_vulnerabilities ?? c.dv ?? [];

    renderChips("resistChips", resist);
    renderChips("immuneChips", immune);
    renderChips("vulnChips", vuln);

    // ===== Senses =====
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
    } catch (e) {
      container.innerHTML = `<div class="card"><h3>Lỗi tải nhân vật.</h3></div>`;
    }
  }

  loadCharacter();
})();

function asArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    // cho phép "fire, cold" hoặc "fire; cold"
    return s.split(/[,;]+/).map(x => x.trim()).filter(Boolean);
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

  el.innerHTML = arr.map(x => `<span>${esc(x)}</span>`).join("");
}

function renderSenseList(character) {
  const ul = document.getElementById("senseList");
  if (!ul) return;

  // hỗ trợ nhiều key: senses (object/array/string)
  const sensesRaw = character.senses ?? character.sense ?? character.sensor ?? null;

  // Nếu server trả dạng object: { darkvision: "60 ft", passive_perception: 13 }
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

  // Nếu server trả array/string: ["Darkvision 60 ft", "Passive Perception 13"]
  const arr = asArray(sensesRaw);
  ul.innerHTML = arr.length
    ? arr.map(x => `<li>${esc(x)}</li>`).join("")
    : `<li class="empty">—</li>`;
}
