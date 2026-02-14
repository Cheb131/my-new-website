/* /JS/page-character-create.js */
(() => {
  // =========================
  // Helpers
  // =========================
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

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function setError(msg) {
    const box = $("publishError");
    if (!box) return;
    box.textContent = msg || "";
    box.style.display = msg ? "block" : "none";
  }

  function linesToArr(text) {
    return String(text || "")
      .split(/\r?\n|,/g)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function numVal(id, fallback = 0) {
    const el = $(id);
    const n = Number(el?.value);
    return Number.isFinite(n) ? n : fallback;
  }

  function strVal(id, fallback = "") {
    const el = $(id);
    return (el?.value ?? fallback).toString().trim();
  }

  function readChecked(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
      .map((i) => (i.value || "").trim())
      .filter(Boolean);
  }

  // =========================
  // Dynamic rows builders
  // =========================
  function makeBtn(label, cls, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls || "";
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  // ----- Equipment rows -----
  function equipRowTpl({ name = "", qty = 1, weight = 0 } = {}) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="eq-name" placeholder="Ví dụ: Rope" value="${esc(name)}"></td>
      <td><input class="eq-qty" type="number" min="0" value="${esc(qty)}"></td>
      <td><input class="eq-wt" type="number" min="0" step="0.1" value="${esc(weight)}"></td>
      <td class="col-x"></td>
    `;
    const tdX = tr.querySelector(".col-x");
    tdX.appendChild(makeBtn("✕", "btn-ghost", () => tr.remove()));
    return tr;
  }

  function readEquipRows(tbodyId, nameSel, qtySel, wtSel) {
    const body = $(tbodyId);
    if (!body) return [];
    return Array.from(body.querySelectorAll("tr"))
      .map((tr) => {
        const name = tr.querySelector(nameSel)?.value?.trim() || "";
        const qty = Number(tr.querySelector(qtySel)?.value ?? 0);
        const weight = Number(tr.querySelector(wtSel)?.value ?? 0);
        if (!name) return null;
        return {
          name,
          qty: Number.isFinite(qty) ? qty : 0,
          weight: Number.isFinite(weight) ? weight : 0,
        };
      })
      .filter(Boolean);
  }

  // ----- Attacks rows -----
  function atkRowTpl({ name = "", hit = "", damage = "", notes = "" } = {}) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="atk-name" placeholder="Ví dụ: Longsword" value="${esc(name)}"></td>
      <td><input class="atk-hit"  placeholder="+5" value="${esc(hit)}"></td>
      <td><input class="atk-dmg"  placeholder="1d8+3 Slashing" value="${esc(damage)}"></td>
      <td><input class="atk-notes" placeholder="Simple, Finesse..." value="${esc(notes)}"></td>
      <td class="col-x"></td>
    `;
    tr.querySelector(".col-x").appendChild(makeBtn("✕", "btn-ghost", () => tr.remove()));
    return tr;
  }

  function readAtkRows() {
    const body = $("atkBody");
    if (!body) return [];
    return Array.from(body.querySelectorAll("tr"))
      .map((tr) => {
        const name = tr.querySelector(".atk-name")?.value?.trim() || "";
        const hit = tr.querySelector(".atk-hit")?.value?.trim() || "";
        const damage = tr.querySelector(".atk-dmg")?.value?.trim() || "";
        const notes = tr.querySelector(".atk-notes")?.value?.trim() || "";
        if (!name && !hit && !damage && !notes) return null;
        if (!name) return null;
        return { name, hit, damage, notes };
      })
      .filter(Boolean);
  }

  // ----- Spells rows -----
  function spellRowTpl(
    { prepared = false, level = "", name = "", saveAtk = "", time = "", range = "", comp = "", duration = "", notes = "" } = {},
    { isCantrip = false } = {}
  ) {
    const tr = document.createElement("tr");
    tr.dataset.type = isCantrip ? "cantrip" : "spell";
    tr.innerHTML = `
      <td><input class="sp-prep" type="checkbox" ${prepared ? "checked" : ""}></td>
      <td><input class="sp-lv" type="text" placeholder="${isCantrip ? "C" : "1"}" value="${esc(level)}"></td>
      <td><input class="sp-name" type="text" placeholder="Tên spell" value="${esc(name)}"></td>
      <td><input class="sp-save" type="text" placeholder="Save/Atk" value="${esc(saveAtk)}"></td>
      <td><input class="sp-time" type="text" placeholder="1A" value="${esc(time)}"></td>
      <td><input class="sp-range" type="text" placeholder="60 ft" value="${esc(range)}"></td>
      <td><input class="sp-comp" type="text" placeholder="V,S,M" value="${esc(comp)}"></td>
      <td><input class="sp-dur" type="text" placeholder="Instant" value="${esc(duration)}"></td>
      <td><input class="sp-notes" type="text" placeholder="Notes" value="${esc(notes)}"></td>
      <td class="col-x"></td>
    `;
    tr.querySelector(".col-x").appendChild(makeBtn("✕", "btn-ghost", () => tr.remove()));
    return tr;
  }

  function readSpellRows() {
    const body = $("spellBody");
    if (!body) return [];
    return Array.from(body.querySelectorAll("tr"))
      .map((tr) => {
        const prepared = !!tr.querySelector(".sp-prep")?.checked;
        const level = tr.querySelector(".sp-lv")?.value?.trim() || "";
        const name = tr.querySelector(".sp-name")?.value?.trim() || "";
        const saveAtk = tr.querySelector(".sp-save")?.value?.trim() || "";
        const time = tr.querySelector(".sp-time")?.value?.trim() || "";
        const range = tr.querySelector(".sp-range")?.value?.trim() || "";
        const comp = tr.querySelector(".sp-comp")?.value?.trim() || "";
        const duration = tr.querySelector(".sp-dur")?.value?.trim() || "";
        const notes = tr.querySelector(".sp-notes")?.value?.trim() || "";
        const type = tr.dataset.type || "spell";

        if (!name && !saveAtk && !time && !range && !comp && !duration && !notes) return null;
        if (!name) return null;

        return { prepared, level, name, saveAtk, time, range, comp, duration, notes, type };
      })
      .filter(Boolean);
  }

  // =========================
  // Init UI
  // =========================
  function initTables() {
    // Equipment
    const equipBody = $("equipBody");
    $("addEquipRow")?.addEventListener("click", () => equipBody?.appendChild(equipRowTpl()));
    $("clearEquip")?.addEventListener("click", () => { if (equipBody) equipBody.innerHTML = ""; });

    // Attuned
    const attuneBody = $("attuneBody");
    $("addAttuneRow")?.addEventListener("click", () => attuneBody?.appendChild(equipRowTpl()));
    $("clearAttune")?.addEventListener("click", () => { if (attuneBody) attuneBody.innerHTML = ""; });

    // Attacks
    const atkBody = $("atkBody");
    $("addAtk")?.addEventListener("click", () => atkBody?.appendChild(atkRowTpl()));
    $("clearAtk")?.addEventListener("click", () => { if (atkBody) atkBody.innerHTML = ""; });

    // Spells
    const spellBody = $("spellBody");
    $("addSpell")?.addEventListener("click", () => spellBody?.appendChild(spellRowTpl({}, { isCantrip: false })));
    $("addCantrip")?.addEventListener("click", () => spellBody?.appendChild(spellRowTpl({ level: "C" }, { isCantrip: true })));
    $("clearSpells")?.addEventListener("click", () => { if (spellBody) spellBody.innerHTML = ""; });
  }

  // =========================
  // Payload builder
  // =========================
  function buildPayload() {
    // Basic
    const payload = {
      name: strVal("charName"),
      race: strVal("race"),
      class_name: strVal("className"),
      level: numVal("level", 1),
      alignment: strVal("alignment"),
      background: strVal("background"),
      avatar: strVal("avatar"),
      description: strVal("description"),

      stats: {
        str: numVal("statStr", 10),
        dex: numVal("statDex", 10),
        con: numVal("statCon", 10),
        int: numVal("statInt", 10),
        wis: numVal("statWis", 10),
        cha: numVal("statCha", 10),
      },

      hp: numVal("hp", 10),
      ac: numVal("ac", 10),
      speed: strVal("speed", "30 ft"),

      // Skill + Saving Throws
      skills: readChecked("skillCbs"),
      saving_throws: readChecked("saveCbs"),

      // Train/Proficiency/Action/Feature (textarea free-form)
      // -> lưu dạng mảng dòng (backend bạn có thể lưu json)
      feature_lines: linesToArr(strVal("proficiencyText")),

      // Resist / Immune / Vulner + Senses
      resistances: linesToArr(strVal("resistText")),
      immunities: linesToArr(strVal("immuneText")),
      vulnerabilities: linesToArr(strVal("vulnerText")),
      senses: linesToArr(strVal("sensesText")),

      // Equipment: coins + rows
      equipment: {
        coins: {
          cp: numVal("coinCp", 0),
          sp: numVal("coinSp", 0),
          ep: numVal("coinEp", 0),
          gp: numVal("coinGp", 0),
          pp: numVal("coinPp", 0),
        },
        items: readEquipRows("equipBody", ".eq-name", ".eq-qty", ".eq-wt"),
        attuned: readEquipRows("attuneBody", ".eq-name", ".eq-qty", ".eq-wt"),
      },

      // Attacks + Spells
      attacks: readAtkRows(),
      spells: readSpellRows(),
    };

    return payload;
  }

  // =========================
  // Submit
  // =========================
  async function submit() {
    setError("");

    const token = getToken();
    if (!token) {
      setError("Missing token. Bạn hãy đăng nhập trước.");
      return;
    }

    const payload = buildPayload();

    // Basic required check (nhẹ)
    if (!payload.name || !payload.race || !payload.class_name) {
      setError("Thiếu thông tin bắt buộc: Name / Race / Class.");
      return;
    }

    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || `Tạo nhân vật thất bại (${res.status})`;
        setError(msg);
        return;
      }

      // Redirect: về list hoặc qua character.html?id=...
      const newId = data?.id || data?.character?.id || data?.data?.id;
      if (newId) {
        location.href = `character.html?id=${encodeURIComponent(newId)}`;
      } else {
        location.href = `character-list.html`;
      }
    } catch (e) {
      setError("Lỗi mạng hoặc server không phản hồi.");
    }
  }

  // =========================
  // Boot
  // =========================
  function boot() {
    initTables();

    $("publishBtn")?.addEventListener("click", submit);

    // thêm 1 dòng mẫu để dễ nhập (tuỳ thích)
    $("addAtk")?.click();
    $("addSpell")?.click();
    $("addEquipRow")?.click();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
