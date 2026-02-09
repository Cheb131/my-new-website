
(() => {
  // =========================================================
  // Helpers
  // =========================================================
  const normalize = (s) => (s || "").toLowerCase().trim();

  const DATA_URL = "Data/articles.json";
  const LS_POSTS_KEY = "posts";
  let ARTICLES_CACHE = null;

  // =========================================================
// API + AUTH (frontend đang serve chung từ backend => API_BASE = "")
// =========================================================
const API_BASE = ""; // để rỗng khi deploy chung domain; local cũng OK

function setToken(token) {
  localStorage.setItem("token", token);
}
function getToken() {
  return localStorage.getItem("token");
}
function clearToken() {
  localStorage.removeItem("token");
}

// GET list bài viết từ backend
async function apiGetArticles() {
  const res = await fetch(`${API_BASE}/api/items`);
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data?.message || "Không lấy được danh sách bài viết");
  return data;
}

// POST tạo bài (cần token)
async function apiCreateArticle(payload) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Tạo bài thất bại");
  return data;
}

// LOGIN: nhận token + user
async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Login failed");

  setToken(data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

// (tuỳ chọn) dùng token cho request cần quyền
async function apiDeleteItem(id) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/items/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Delete failed");
  return data;
}

// expose để page-list.js / page-post.js dùng
window.API = window.API || {};
window.API.apiGetArticles = apiGetArticles;
window.API.apiCreateArticle = apiCreateArticle;
window.API.apiLogin = apiLogin;
window.API.apiDeleteItem = apiDeleteItem;
window.API.getToken = getToken;
window.API.clearToken = clearToken;

  
  function parseVNDateToTime(s) {
    // hỗ trợ "DD/MM/YYYY" hoặc ISO "YYYY-MM-DD"
    if (!s) return 0;
    const str = String(s).trim();

    if (str.includes("/")) {
      const [d, m, y] = str.split("/").map((x) => parseInt(x, 10));
      if (!y || !m || !d) return 0;
      return new Date(y, m - 1, d).getTime();
    }

    const t = Date.parse(str);
    return Number.isNaN(t) ? 0 : t;
  }

  function loadLocalPosts() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_POSTS_KEY) || "[]");
      if (!Array.isArray(raw)) return [];

      // Gắn prefix để tránh trùng id với articles.json
      return raw.map((p) => ({
        id: "u_" + p.id,
        title: p.title || "",
        date: p.date || "",
        category: p.category || "",
        image: p.image || "Assets/images/sample.png",
        excerpt: p.excerpt || "",
        content: p.content || "",
        author: p.author || "",
        __source: "local",
        __time: parseVNDateToTime(p.date),
      }));
    } catch {
      return [];
    }
  }

  function normalizeRemoteArticles(arr) {
    return (arr || []).map((a) => ({
      ...a,
      id: String(a.id),
      __source: "json",
      __time: parseVNDateToTime(a.date),
    }));
  }

  function mergeAndSort(remote, local) {
    const merged = [...local, ...remote];
    merged.sort((a, b) => (b.__time || 0) - (a.__time || 0));
    return merged;
  }

  async function loadArticles(force = false) {
    if (!force && ARTICLES_CACHE) return ARTICLES_CACHE;

    // 1) lấy từ backend
    const raw = await apiGetArticles();

    // chuẩn hoá shape để code cũ render không bị vỡ
    const remote = (raw || []).map((item) => ({
      id: String(item.id),
      title: item.title || "",
      content: item.content || "",
      excerpt: item.excerpt || item.content?.slice?.(0, 140) || "",
      image: item.image || "Assets/images/sample.png",
      date: item.date || "",
      category: item.category || "Tin mới",
      author: item.author || "",
      __source: "api",
      __time: parseVNDateToTime(item.date),
    }));

    // 2) nếu bạn vẫn muốn trộn thêm bài localStorage (tuỳ bạn)
    const local = loadLocalPosts();

    ARTICLES_CACHE = mergeAndSort(remote, local);
    return ARTICLES_CACHE;
  }


  // expose cho page-list.js / page-article.js dùng
  window.Core = window.Core || {};
  window.Core.loadArticles = loadArticles;

  function isPage(name) {
    return (
      window.location.pathname.endsWith("/" + name) ||
      window.location.pathname.endsWith(name)
    );
  }

  // =========================================================
  // Featured
  // =========================================================
  async function renderFeatured() {
    const featuredEl = document.getElementById("featuredArticle");
    if (!featuredEl) return;

    try {
      const articles = await loadArticles();
      if (!articles?.length) return;

      const item = articles[0];

      featuredEl.innerHTML = `
        <a href="article.html?id=${encodeURIComponent(item.id)}" class="featured-main__thumb">
          <img src="${item.image || ""}" alt="${item.title || ""}">
        </a>
        <div class="featured-main__body">
          <h3 class="featured-main__title">
            <a href="article.html?id=${encodeURIComponent(item.id)}">${item.title || ""}</a>
          </h3>
          <div class="meta">
            <span class="meta__date">${item.date || ""}</span>
            <span class="meta__dot">•</span>
            <span class="meta__cat">${item.category || ""}</span>
          </div>
          <p class="featured-main__desc">${item.excerpt || ""}</p>
        </div>
      `;
    } catch (err) {
      console.error(err);
      featuredEl.innerHTML =
        `<p style="padding:12px;color:#b91c1c">Không tải được tin nổi bật.</p>`;
    }
  }

  // =========================================================
  // Right list
  // =========================================================
  function renderRightList(listEl, items) {
    if (!listEl) return;

    if (!items || !items.length) {
      listEl.innerHTML = `<p style="padding:12px;color:#6b7280">Không có bài viết.</p>`;
      return;
    }

    listEl.innerHTML = items
      .map(
        (item) => `
      <article class="news-item">
        <a href="article.html?id=${encodeURIComponent(item.id)}" class="news-item__thumb">
          <img src="${item.image || ""}" alt="${item.title || ""}">
        </a>
        <div class="news-item__body">
          <h4 class="news-item__title">
            <a href="article.html?id=${encodeURIComponent(item.id)}">${item.title || ""}</a>
          </h4>
          <div class="meta meta--small">
            <span class="meta__date">${item.date || ""}</span>
            <span class="meta__dot">•</span>
            <span class="meta__cat">${item.category || ""}</span>
          </div>
          <p class="news-item__desc">${item.excerpt || ""}</p>
        </div>
      </article>
    `
      )
      .join("");
  }

  async function initRightList() {
    const listEl = document.getElementById("articleList");
    if (!listEl) return;
    if (!isPage("index.html")) return;

    try {
      const articles = await loadArticles();
      renderRightList(listEl, articles.slice(0, 4));
    } catch (err) {
      console.error(err);
      listEl.innerHTML = `<p style="padding:12px;color:#b91c1c">Không tải được bài viết.</p>`;
    }
  }

  /* =====================================================
    SEARCH DROPDOWN – GỢI Ý BÀI VIẾT THEO TIÊU ĐỀ
  ===================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    let cacheItems = null;
    let fetchPromise = null;

    // load bài viết 1 lần
    async function loadItems() {
      if (cacheItems) return cacheItems;
      if (!fetchPromise) {
        fetchPromise = fetch("/api/items")
          .then(res => res.json())
          .then(data => (cacheItems = data))
          .catch(err => {
            console.error("Search load error:", err);
            cacheItems = [];
            return [];
          });
      }
      return fetchPromise;
    }

    function hideResults(el) {
      if (!el) return;
      el.hidden = true;
      el.innerHTML = "";
    }

    function showResults(el, items) {
      if (!el) return;

      if (!items.length) {
        el.innerHTML = `<a href="javascript:void(0)">Không tìm thấy bài viết</a>`;
        el.hidden = false;
        return;
      }

      el.innerHTML = items
        .slice(0, 6)
        .map(
          item => `
          <a href="/article.html?id=${item.id}">
            ${item.title}
            <span class="muted">${item.date || ""}</span>
          </a>
        `
        )
        .join("");

      el.hidden = false;
    }

    // gõ tìm kiếm
    document.addEventListener("input", async e => {
      const input = e.target.closest(".search__input");
      if (!input) return;

      const form = input.closest("form.search");
      if (!form) return;

      const results = form.querySelector(".search-results");
      if (!results) return;

      const q = input.value.trim().toLowerCase();
      if (!q) return hideResults(results);

      const items = await loadItems();

      const matched = items.filter(item =>
        (item.title || "").toLowerCase().includes(q)
      );

      showResults(results, matched);
    });

    // focus lại thì hiện kết quả
    document.addEventListener("focusin", async e => {
      const input = e.target.closest(".search__input");
      if (!input) return;

      const form = input.closest("form.search");
      const results = form?.querySelector(".search-results");
      if (!results) return;

      const q = input.value.trim().toLowerCase();
      if (!q) return;

      const items = await loadItems();
      const matched = items.filter(item =>
        (item.title || "").toLowerCase().includes(q)
      );

      showResults(results, matched);
    });

    // submit → sang list.html
    document.addEventListener("submit", e => {
      const form = e.target.closest("form.search");
      if (!form) return;

      e.preventDefault();

      const input = form.querySelector('input[name="q"]');
      const q = input?.value.trim();
      if (!q) return;

      hideResults(form.querySelector(".search-results"));
      window.location.href = `/list.html?q=${encodeURIComponent(q)}`;
    });

    // click ra ngoài → ẩn
    document.addEventListener("click", e => {
      document.querySelectorAll(".search-results").forEach(el => {
        if (!el.closest("form.search")?.contains(e.target)) {
          hideResults(el);
        }
      });
    });

    // ESC → ẩn
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".search-results").forEach(hideResults);
    });
  });


  // =========================================================
  // Login
  // =========================================================

    // ===== LOGIN ERROR UI =====
    const loginErrorEl = document.getElementById("loginError");

    function showLoginError(msg) {
      if (!loginErrorEl) return;
      loginErrorEl.textContent = msg;
      loginErrorEl.style.display = "block";
    }

    function clearLoginError() {
      if (!loginErrorEl) return;
      loginErrorEl.textContent = "";
      loginErrorEl.style.display = "none";
    }

    // ===== USERS STORE (from register.html) =====
    function getUsers() {
      try {
        const arr = JSON.parse(localStorage.getItem("users") || "[]");
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }


  function initLogin() {
    const LS_KEY = "user";

    const navUserBox = document.getElementById("navUserBox");
    const userToggleBtn = document.getElementById("userToggleBtn");
    const userNameEl = document.getElementById("userName");
    const userDropdown = document.getElementById("userDropdown");

    const loginModal = document.getElementById("loginModal");
    const loginForm = document.getElementById("loginForm");
    const loginClose =
      document.getElementById("loginClose") ||
      document.getElementById("loginCloseBtn");

    if (!navUserBox || !userToggleBtn || !userDropdown) return;

    function getUser() {
      try {
        return JSON.parse(localStorage.getItem(LS_KEY) || "null");
      } catch {
        return null;
      }
    }
    function setUser(user) {
      localStorage.setItem(LS_KEY, JSON.stringify(user));
    }
    function clearUser() {
      localStorage.removeItem(LS_KEY);
    }

    function openModal() {
      if (loginModal) {
        clearLoginError();
        loginModal.hidden = false;
        document.body.classList.add("modal-open");
      }
    }

    function closeModal() {
      if (loginModal) {
        loginModal.hidden = true;
        document.body.classList.remove("modal-open");
      }
    }

    function renderDropdown() {
      const user = getUser();

      if (user?.username) {
        userNameEl.hidden = false;
        userNameEl.textContent = user.username;
      } else {
        userNameEl.hidden = true;
        userNameEl.textContent = "";
      }

      if (!user) {
        userDropdown.innerHTML = `
          <li><a href="#" id="loginAction">Đăng nhập</a></li>
          <li><a href="#" id="registerAction">Đăng ký</a></li>
        `;

        document.getElementById("loginAction")?.addEventListener("click", (e) => {
          e.preventDefault();
          navUserBox.classList.remove("open");
          openModal();
        });

        document.getElementById("registerAction")?.addEventListener("click", (e) => {
          e.preventDefault();
          navUserBox.classList.remove("open");
          window.location.href = "register.html";
        });
      } else {
          const role = user.role || "user";
          const isAdmin = role === "admin";
          const isManager = role === "manager";

          userDropdown.innerHTML = `
            ${(isAdmin || isManager) ? `<li><a href="post.html">Đăng bài viết</a></li>` : ""}
            ${isAdmin ? `<li><a href="my-posts.html">Quản lý bài viết</a></li>` : ""}
            <li><a href="#" id="logoutAction">Đăng xuất</a></li>
          `;

          document.getElementById("logoutAction")?.addEventListener("click", (e) => {
            e.preventDefault();
            clearUser();
            localStorage.removeItem("token");
            navUserBox.classList.remove("open");
            renderDropdown();
          });
        }
    }

    userToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      renderDropdown();
      navUserBox.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!navUserBox.contains(e.target)) navUserBox.classList.remove("open");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        navUserBox.classList.remove("open");
        closeModal();
      }
    });

    loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearLoginError();

    const username =
      document.getElementById("loginUsername")?.value.trim() ||
      document.getElementById("loginUser")?.value.trim() ||
      "";

    const password =
      document.getElementById("loginPassword")?.value ||
      document.getElementById("loginPass")?.value ||
      "";

    if (!username || !password) {
      return showLoginError("Vui lòng nhập tên đăng nhập và mật khẩu.");
    }

    try {
      const data = await apiLogin(username, password);

      // lưu user để dropdown hiển thị
      setUser({
        username: data.user?.username || username,
        email: data.user?.email || "",
        phone: data.user?.phone || "",
        role: data.user?.role || "user",
      });

      closeModal();
      renderDropdown();
    } catch (err) {
      showLoginError(err?.message || "Đăng nhập thất bại");
    }
    });



      loginClose?.addEventListener("click", closeModal);
      loginModal?.addEventListener("click", (e) => {
        if (e.target === loginModal) closeModal();
      });

      renderDropdown();
  }

  // =========================================================
  // Roll
  // =========================================================
  function initTopbarLikeMau() {
    const body = document.body;
    const nav = document.querySelector(".main-nav");
    const banner = document.querySelector(".header-banner");
    if (!nav) return;

    let spacer = document.querySelector(".topbar-spacer");
    if (!spacer) {
      spacer = document.createElement("div");
      spacer.className = "topbar-spacer";
      nav.parentNode.insertBefore(spacer, nav.nextSibling);
    }

    let triggerY = 0;

    const measure = () => {
      const bannerH = banner ? banner.offsetHeight : 0;
      triggerY = bannerH;
      const navH = nav.offsetHeight;
      spacer.style.setProperty("--topbar-h", navH + "px");
    };

    const onScroll = () => {
      if (window.scrollY > triggerY) body.classList.add("is-topbar");
      else body.classList.remove("is-topbar");
    };

    measure();
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      measure();
      onScroll();
    });
  }




  // =========================================================
  // Init
  // =========================================================
  document.addEventListener("DOMContentLoaded", async () => {
    initTopbarLikeMau();
    initLogin();
    await renderFeatured();
    await initRightList();
    await initSearch();
  });
})();





