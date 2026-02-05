document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("mnavToggle");
  const desktopList = document.querySelector(".main-nav .nav-list");
  

  if (!toggle || !desktopList) return;

  // ========== OVERLAY + PANEL ==========
  let overlay = document.getElementById("mnavOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "mnavOverlay";
    overlay.className = "mnav-overlay";
    overlay.hidden = true;
    document.body.appendChild(overlay);
  }

  let panel = document.getElementById("mnav");
  if (!panel) {
    panel = document.createElement("nav");
    panel.id = "mnav";
    panel.className = "mnav";
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("aria-label", "Menu mobile");
    panel.innerHTML = `
      <div class="mnav-head">
        <div class="mnav-title">MENU</div>
        <button class="mnav-close" id="mnavClose" type="button" aria-label="Đóng menu">✕</button>
      </div>
      <div class="mnav-body">
        <ul class="mnav-list" id="mnavList"></ul>
      </div>
    `;
    document.body.appendChild(panel);
  }

  const closeBtn = panel.querySelector("#mnavClose");
  const mnavList = panel.querySelector("#mnavList");

  // ========== CLONE MENU DESKTOP SANG MOBILE ==========
  
  const cloned = desktopList.cloneNode(true);
  cloned.querySelectorAll(".nav-user").forEach((li) => li.remove());

  mnavList.innerHTML = "";

  const searchLi = cloned.querySelector("li.nav-search");
  if (searchLi) {

    searchLi.classList.add("mnav-search-li");
    mnavList.appendChild(searchLi);
  }

  Array.from(cloned.children).forEach((li) => {
  if (li.classList.contains("nav-search")) return;
  mnavList.appendChild(li);
  });

  // ========== DROPDOWN DESKTOP -> ACCORDION MOBILE ==========

  mnavList.querySelectorAll("li.has-dropdown").forEach((li) => {
    li.classList.remove("has-dropdown");
    li.classList.add("has-sub");

    const drop = li.querySelector(":scope > ul.dropdown");
    const link = li.querySelector(":scope > a");

    if (drop && link) {
      drop.classList.remove("dropdown");
      drop.classList.add("sub");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sub-toggle";
      btn.setAttribute("aria-label", "Mở mục con");
      btn.textContent = "+";
      li.insertBefore(btn, drop);

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        li.classList.toggle("open");
        btn.textContent = li.classList.contains("open") ? "−" : "+";
      });
    }
  });

  mnavList.querySelectorAll("li.active > a").forEach((a) => a.classList.add("is-active"));

  // ========== OPEN/CLOSE ==========
  const openNav = () => {
    document.body.classList.add("mnav-open");
    overlay.hidden = false;
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
  };

  const closeNav = () => {
    document.body.classList.remove("mnav-open");
    overlay.hidden = true;
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
  };

  toggle.addEventListener("click", openNav);
  closeBtn?.addEventListener("click", closeNav);
  overlay.addEventListener("click", closeNav);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeNav());

  panel.querySelectorAll("a[href]").forEach((a) => a.addEventListener("click", closeNav));
});
