(() => {
  function ensureMobileNav() {
    if (!document.getElementById("mnavOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "mnavOverlay";
      overlay.className = "mnav-overlay";
      document.body.appendChild(overlay);
    }

    if (!document.getElementById("mnav")) {
      const nav = document.createElement("aside");
      nav.id = "mnav";
      nav.className = "mnav";
      nav.innerHTML = `
        <div class="mnav-head">
          <div class="mnav-title">DnD Guild Chronicle</div>
          <button class="mnav-close" id="mnavClose" type="button" aria-label="Đóng">✕</button>
        </div>
        <div class="mnav-body">
          <ul class="mnav-list" id="mnavList"></ul>
        </div>
      `;
      document.body.appendChild(nav);
    }
  }

  function makeLi(text, href) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    li.appendChild(a);
    return { li, a };
  }

  function makeSub(title, items) {
    const li = document.createElement("li");
    li.className = "has-sub";

    const a = document.createElement("a");
    a.href = "#";
    a.textContent = title;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sub-toggle";
    btn.textContent = "+";

    const ul = document.createElement("ul");
    ul.className = "sub";

    items.forEach(({ text, href }) => {
      const subLi = document.createElement("li");
      const subA = document.createElement("a");
      subA.href = href;
      subA.textContent = text;
      subLi.appendChild(subA);
      ul.appendChild(subLi);
    });

    btn.addEventListener("click", () => li.classList.toggle("open"));
    a.addEventListener("click", (e) => { e.preventDefault(); li.classList.toggle("open"); });

    li.appendChild(a);
    li.appendChild(btn);
    li.appendChild(ul);
    return li;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("mnavToggle");
    if (!toggle) return;

    ensureMobileNav();

    const overlay = document.getElementById("mnavOverlay");
    const closeBtn = document.getElementById("mnavClose");
    const list = document.getElementById("mnavList");

    const closeNav = () => document.body.classList.remove("mnav-open");

    const buildMenu = () => {
      if (!list) return;
      list.innerHTML = "";

      // Clone search từ desktop
      const desktopSearch = document.querySelector(".nav-search form");
      if (desktopSearch) {
        const liSearch = document.createElement("li");
        liSearch.className = "mnav-search-li";
        liSearch.appendChild(desktopSearch.cloneNode(true));
        list.appendChild(liSearch);
      }

      // Menu chính (khớp nav desktop)
      list.appendChild(makeLi("Trang chủ", "index.html").li);

      list.appendChild(makeSub("Nhiệm vụ & Sự kiện", [
        { text: "Nhiệm vụ mới", href: "#" },
        { text: "Sự kiện guild", href: "#" },
        { text: "Thông cáo từ hội quán", href: "#" },
      ]));

      list.appendChild(makeSub("Sổ tay huấn luyện", [
        { text: "Thông tin nhân vật", href: "character.html" },
        { text: "2026", href: "#" },
        { text: "2027", href: "#" },
      ]));

      list.appendChild(makeSub("Kho tư liệu cổ thư", [
        { text: "Bách khoa quái vật", href: "#" },
        { text: "Bản đồ lục địa", href: "#" },
        { text: "Luật chơi tân thủ", href: "#" },
        { text: "Hướng dẫn DM", href: "#" },
      ]));

      list.appendChild(makeSub("Kho học cụ", [
        { text: "Thư viện phép thuật", href: "https://stbook.vn/" },
        { text: "Tài nguyên chiến dịch", href: "#" },
      ]));

      // Divider
      const hr = document.createElement("hr");
      hr.style.margin = "10px 0";
      hr.style.opacity = "0.6";
      list.appendChild(hr);

      const user = window.Core?.getUser?.();

      if (!user?.username) {
        const { li: liLogin, a: aLogin } = makeLi("Đăng nhập", "#");
        aLogin.addEventListener("click", (e) => {
          e.preventDefault();
          closeNav();
          window.openLoginModal?.();
        });
        list.appendChild(liLogin);
        list.appendChild(makeLi("Đăng ký", "register.html").li);
        return;
      }

      const role = user.role || "user";
      const isAdmin = role === "admin";
      const isManager = role === "manager";

      list.appendChild(makeLi("Thông tin nhân vật", "character.html").li);
      if (isAdmin) list.appendChild(makeLi("Tạo nhân vật (Admin)", "character-create.html").li);
      if (isAdmin || isManager) list.appendChild(makeLi("Đăng bài viết", "post.html").li);
      if (isAdmin) list.appendChild(makeLi("Quản lý bài viết", "my-posts.html").li);

      const { li: liLogout, a: aLogout } = makeLi("Đăng xuất", "#");
      aLogout.addEventListener("click", (e) => {
        e.preventDefault();
        window.Core?.clearAuth?.();
        closeNav();
        window.location.reload();
      });
      list.appendChild(liLogout);
    };

    const openNav = () => {
      buildMenu();
      document.body.classList.add("mnav-open");
    };

    toggle.addEventListener("click", openNav);
    overlay?.addEventListener("click", closeNav);
    closeBtn?.addEventListener("click", closeNav);
  });
})();
