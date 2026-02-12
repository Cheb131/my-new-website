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

  // ========== Helpers ==========
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };

  const openLoginModal = () => {
    const loginModal = document.getElementById("loginModal");
    if (!loginModal) return;

    // clear error nếu có
    const loginErrorEl = document.getElementById("loginError");
    if (loginErrorEl) {
      loginErrorEl.textContent = "";
      loginErrorEl.style.display = "none";
    }

    loginModal.hidden = false;
    document.body.classList.add("modal-open");
  };

  // ========== CLONE MENU DESKTOP SANG MOBILE ==========
  const cloned = desktopList.cloneNode(true);

  // bỏ user desktop để thay bằng auth items mobile (đẹp + đúng logic)
  cloned.querySelectorAll(".nav-user").forEach((li) => li.remove());

  mnavList.innerHTML = "";

  // đưa search lên đầu
  const searchLi = cloned.querySelector("li.nav-search");
  if (searchLi) {
    searchLi.classList.add("mnav-search-li");
    mnavList.appendChild(searchLi);
  }

  // append các mục còn lại
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

  // ========== AUTH ITEMS (Đăng nhập / Đăng ký / Đăng xuất...) ==========
  function syncAuthItems() {
    // xóa các mục auth cũ
    mnavList.querySelectorAll('li[data-mnav-auth="1"]').forEach((li) => li.remove());

    const user = getUser();

    const makeLi = (text, href = "#") => {
      const li = document.createElement("li");
      li.dataset.mnavAuth = "1";
      const a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      li.appendChild(a);
      return { li, a };
    };

    // ngăn cách nhẹ (tùy thích)
    const divider = document.createElement("li");
    divider.dataset.mnavAuth = "1";
    divider.style.borderBottom = "1px solid rgba(255,255,255,.14)";
    divider.style.margin = "8px 0";
    divider.style.opacity = "0.8";

    mnavList.appendChild(divider);

    if (!user?.username) {
      // Đăng nhập
      const { li: liLogin, a: aLogin } = makeLi("Đăng nhập", "#");
      aLogin.addEventListener("click", (e) => {
        e.preventDefault();
        closeNav();
        openLoginModal();
      });
      mnavList.appendChild(liLogin);

      // Đăng ký
      const { li: liReg } = makeLi("Đăng ký", "register.html");
      mnavList.appendChild(liReg);
      return;
    }

    const role = user.role || "user";
    const isAdmin = role === "admin";
    const isManager = role === "manager";

    mnavList.appendChild(makeLi("Thông tin nhân vật", "character.html").li);

    if (isAdmin) {
      mnavList.appendChild(makeLi("Tạo nhân vật (Admin)", "character-create.html").li);
    }

    if (isAdmin || isManager) {
      mnavList.appendChild(makeLi("Đăng bài viết", "post.html").li);
    }
    if (isAdmin) {
      mnavList.appendChild(makeLi("Quản lý bài viết", "my-posts.html").li);
      // nếu bạn có trang users.html (admin quản lý user) thì mở thêm dòng này:
      // mnavList.appendChild(makeLi("Quản lý tài khoản", "users.html").li);
    }

    const { li: liLogout, a: aLogout } = makeLi("Đăng xuất", "#");
    aLogout.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      closeNav();
      // reload để cập nhật UI
      window.location.reload();
    });
    mnavList.appendChild(liLogout);
  }

  // ========== OPEN/CLOSE ==========
  const openNav = () => {
    syncAuthItems();
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

  // init lần đầu
  syncAuthItems();
});
