(function () {
  const sheetLayout = document.getElementById("characterLayout");
  const listEl = document.getElementById("characterList");
  const sheetEl = document.getElementById("characterSheet");
  const empty = document.getElementById("characterEmpty");
  const adminBtn = document.getElementById("adminCreateBtn");

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }

  function formatLines(items, fallback) {
    if (!Array.isArray(items) || !items.length) {
      return `<li>${fallback}</li>`;
    }
    return items.map((v) => `<li>${v}</li>`).join("");
  }

  function modifier(score) {
    const m = Math.floor((Number(score || 10) - 10) / 2);
    return m >= 0 ? `+${m}` : String(m);
  }

  function numericModifier(score) {
    return Math.floor((Number(score || 10) - 10) / 2);
  }

  function proficiencyBonus(level) {
    const lvl = Math.max(1, Number(level) || 1);
    return 2 + Math.floor((lvl - 1) / 4);
  }

  function skillAbilityMap() {
    return {
      Acrobatics: "dex",
      "Animal Handling": "wis",
      Arcana: "int",
      Athletics: "str",
      Deception: "cha",
      History: "int",
      Insight: "wis",
      Intimidation: "cha",
      Investigation: "int",
      Medicine: "wis",
      Nature: "int",
      Perception: "wis",
      Performance: "cha",
      Persuasion: "cha",
      Religion: "int",
      "Sleight of Hand": "dex",
      Stealth: "dex",
      Survival: "wis",
    };
  }

  function toProficientSkills(skills) {
    if (!Array.isArray(skills)) return new Set();
    return new Set(
      skills
        .map((s) => String(s || "").toLowerCase())
        .flatMap((raw) => {
          const cleaned = raw.replace(/\([^)]*\)/g, "").replace(/[+\-]\d+/g, "");
          return Object.keys(skillAbilityMap()).filter((skill) => cleaned.includes(skill.toLowerCase()));
        })
    );
  }

  function normalizeEquipmentItem(item) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return {
        name: item.name || item.item || "Unknown gear",
        type: item.type || item.category || "General",
        rarity: item.rarity || item.tier || "Common",
        value: item.damage || item.ac || item.bonus || item.weight || "-",
        description: item.description || item.effect || item.notes || "Không có mô tả.",
      };
    }

    const raw = String(item || "").trim();
    if (!raw) {
      return null;
    }

    const chunks = raw.split("|").map((x) => x.trim()).filter(Boolean);
    const first = chunks[0] || raw;
    const [namePart, descPart] = first.includes("-")
      ? first.split(/\s+-\s+(.+)/)
      : [first, ""];

    return {
      name: namePart || "Unknown gear",
      type: chunks[1] || "General",
      rarity: chunks[2] || "Common",
      value: chunks[3] || "-",
      description: descPart || chunks[4] || chunks.slice(1).join(" • ") || "Không có mô tả.",
    };
  }

  function normalizeSpellItem(item) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return {
        name: item.name || "Unknown spell",
        levelSchool: item.level || item.school || item.level_school || "Cantrip",
        casting: item.casting_time || item.cast || "1 action",
        range: item.range || "Self",
        duration: item.duration || "Instantaneous",
        description: item.description || item.effect || item.notes || "Không có mô tả phép thuật.",
      };
    }

    const raw = String(item || "").trim();
    if (!raw) return null;

    const chunks = raw.split("|").map((x) => x.trim()).filter(Boolean);
    const [name, levelSchool, casting, range, duration, ...descRest] = chunks;

    return {
      name: name || "Unknown spell",
      levelSchool: levelSchool || "Cantrip",
      casting: casting || "1 action",
      range: range || "Self",
      duration: duration || "Instantaneous",
      description: descRest.join(" • ") || "Không có mô tả phép thuật.",
    };
  }

  function renderEquipment(items) {
    const normalized = Array.isArray(items)
      ? items.map(normalizeEquipmentItem).filter(Boolean)
      : [];

    if (!normalized.length) {
      return `<p class="sheet-muted">Chưa có trang bị.</p>`;
    }

    return `
      <div class="equipment-grid">
        ${normalized
          .map(
            (gear) => `
              <article class="sheet-card sheet-card--equipment">
                <h4>${gear.name}</h4>
                <p class="sheet-card__meta">${gear.type} • ${gear.rarity} • ${gear.value}</p>
                <p>${gear.description}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderSpells(character) {
    const spellItems = Array.isArray(character.spells)
      ? character.spells
      : Array.isArray(character.spellbook)
        ? character.spellbook
        : [];
    const normalized = spellItems.map(normalizeSpellItem).filter(Boolean);

    if (!normalized.length) {
      return `<p class="sheet-muted">Nhân vật chưa ghi spell.</p>`;
    }

    return `
      <div class="spell-grid">
        ${normalized
          .map(
            (spell) => `
              <article class="sheet-card sheet-card--spell">
                <h4>${spell.name}</h4>
                <p class="sheet-card__meta">${spell.levelSchool}</p>
                <ul class="spell-facts">
                  <li><strong>Cast:</strong> ${spell.casting}</li>
                  <li><strong>Range:</strong> ${spell.range}</li>
                  <li><strong>Duration:</strong> ${spell.duration}</li>
                </ul>
                <p>${spell.description}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderSheet(character) {
    if (!sheetEl || !character) return;

    const stats = character.stats || {};
    const level = Number(character.level) || 1;
    const pb = proficiencyBonus(level);
    const passivePerception = 10 + numericModifier(stats.wis || 10);
    const proficientSkills = toProficientSkills(character.skills);
    const savingThrows = ["str", "dex", "con", "int", "wis", "cha"];
    const skillRows = Object.entries(skillAbilityMap())
      .map(([name, ability]) => {
        const isProficient = proficientSkills.has(name);
        const total = numericModifier(stats[ability]) + (isProficient ? pb : 0);
        return `
          <li class="skill-row ${isProficient ? "is-proficient" : ""}">
            <span class="skill-prof-dot" aria-hidden="true"></span>
            <span class="skill-name">${name}</span>
            <span class="skill-ability">${ability.toUpperCase()}</span>
            <b class="skill-value">${total >= 0 ? `+${total}` : total}</b>
          </li>
        `;
      })
      .join("");

    const featureItems = Array.isArray(character.features) && character.features.length
      ? character.features
      : Array.isArray(character.notes)
        ? character.notes.slice(0, 4)
        : [];

    sheetEl.innerHTML = `
      <article class="dnd-sheet">
        <header class="dnd-sheet__header">
          <div class="dnd-sheet__identity">
            <img src="${character.avatar || "/Assets/images/sample.png"}" alt="${character.name || "Character"}" class="dnd-sheet__avatar" />
            <div>
              <h2>${character.name || "Unknown"}</h2>
              <p>${character.race || "-"} • ${character.class_name || "-"} • Cấp ${character.level || 1}</p>
              <p>${character.description || "Không có mô tả."}</p>
            </div>
          </div>
          <div class="dnd-sheet__meta">
            <div><span>Alignment</span><b>${character.alignment || "Neutral"}</b></div>
            <div><span>Background</span><b>${character.background || "Adventurer"}</b></div>
            <div><span>Created by</span><b>${character.created_by || "Guild"}</b></div>
          </div>
        </header>

        <section class="dnd-sheet__body">
          <div class="dnd-vitals dnd-section--full">
            <div><span>Proficiency Bonus</span><b>+${pb}</b></div>
            <div><span>Initiative</span><b>${modifier(stats.dex ?? 10)}</b></div>
            <div><span>Passive Perception</span><b>${passivePerception}</b></div>
            <div><span>Inspiration</span><b>0</b></div>
          </div>

          <div class="dnd-abilities">
            <h3>Ability Scores</h3>
            <div class="dnd-abilities__grid">
              ${["str", "dex", "con", "int", "wis", "cha"]
                .map((k) => `
                  <div class="ability-box">
                    <span>${k.toUpperCase()}</span>
                    <b>${stats[k] ?? 10}</b>
                    <small>${modifier(stats[k])}</small>
                  </div>
                `)
                .join("")}
            </div>
          </div>

          <div class="dnd-combat">
            <h3>Combat</h3>
            <ul>
              <li><strong>HP:</strong> ${character.hp || 10}</li>
              <li><strong>AC:</strong> ${character.ac || 10}</li>
              <li><strong>Speed:</strong> ${character.speed || "30 ft"}</li>
              <li><strong>Hit Dice:</strong> ${character.hit_dice || "1d8"}</li>
            </ul>
          </div>

          <div class="dnd-section">
            <h3>Saving Throws</h3>
            <ul class="save-grid">
              ${savingThrows
                .map((k) => `<li><span>${k.toUpperCase()}</span><b>${modifier(stats[k] ?? 10)}</b></li>`)
                .join("")}
            </ul>
          </div>

          <div class="dnd-section dnd-section--full">
            <h3>Skills</h3>
            <ul class="skill-list">${skillRows}</ul>
          </div>

          <div class="dnd-section dnd-section--full">
            <h3>Trang bị</h3>
            ${renderEquipment(character.equipment)}
          </div>

          <div class="dnd-section dnd-section--full">
            <h3>Spellbook</h3>
            ${renderSpells(character)}
          </div>

          <div class="dnd-section">
            <h3>Features & Traits</h3>
            <ul>${formatLines(featureItems, "Chưa có đặc điểm nổi bật")}</ul>
          </div>

          <div class="dnd-section">
            <h3>Nhật ký phiêu lưu</h3>
            <ol>${formatLines(character.notes, "Chưa có ghi chú chiến dịch")}</ol>
          </div>
        </section>
      </article>
    `;
  }

  function renderList(items, activeId) {
    if (!listEl) return;
    listEl.innerHTML = items
      .map(
        (c) => `
          <button class="sheet-list__item ${String(c.id) === String(activeId) ? "is-active" : ""}" data-id="${c.id}" type="button">
            <span class="name">${c.name || "Unknown"}</span>
            <span class="meta">${c.class_name || "-"} • Lv.${c.level || 1}</span>
          </button>
        `
      )
      .join("");
  }

  async function loadCharacters() {
    try {
      const res = await fetch("/api/characters");
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || "Không tải được danh sách nhân vật");

      const items = Array.isArray(data) ? data : [];
      if (!items.length) {
        if (sheetLayout) sheetLayout.hidden = true;
        if (empty) empty.hidden = false;
        return;
      }

      if (empty) empty.hidden = true;
      if (sheetLayout) sheetLayout.hidden = false;

      let active = items[0];
      renderList(items, active.id);
      renderSheet(active);

      listEl?.querySelectorAll(".sheet-list__item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          active = items.find((x) => String(x.id) === String(id)) || items[0];
          renderList(items, active.id);
          renderSheet(active);
        });
      });
    } catch (err) {
      if (sheetLayout) sheetLayout.hidden = true;
      if (empty) {
        empty.hidden = false;
        empty.textContent = err?.message || "Có lỗi xảy ra khi tải dữ liệu nhân vật.";
      }
    }
  }

  const user = getUser();
  if (adminBtn && user?.role === "admin") {
    adminBtn.hidden = false;
  }

  loadCharacters();
})();
