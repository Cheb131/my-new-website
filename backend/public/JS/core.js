(() => {
  /**
   * API_BASE strategy:
   * - Production (Render): serve static + API cùng 1 domain => API_BASE = ""
   * - Local dev (Live Server 5500): gọi API ở localhost:3000
   * - Có thể override bằng window.__API_BASE (nếu sau này tách frontend/backend)
   */
  const API_BASE =
    (window.__API_BASE && String(window.__API_BASE)) ||
    ((location.hostname === "localhost" && location.port === "5500")
      ? "http://localhost:3000"
      : "");

  const LS_USER = "user";
  const LS_TOKEN = "token";

  function getUser() {
    try { return JSON.parse(localStorage.getItem(LS_USER) || "null"); }
    catch { return null; }
  }
  function getToken() {
    return localStorage.getItem(LS_TOKEN) || "";
  }
  function setAuth(user, token) {
    localStorage.setItem(LS_USER, JSON.stringify(user));
    localStorage.setItem(LS_TOKEN, token);
  }
  function clearAuth() {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_TOKEN);
  }

  async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!headers["Content-Type"] && options.body) headers["Content-Type"] = "application/json";

    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message || `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    return data;
  }

  // Expose Core for other pages
  window.Core = {
    API_BASE,
    getUser,
    getToken,
    setAuth,
    clearAuth,
    apiFetch,
    loadArticles: () => apiFetch("/api/items"),
  };

  // Backward-compat cho page-home.js hiện tại
  window.apiGetArticles = window.Core.loadArticles;

  document.addEventListener("DOMContentLoaded", () => {
    // ===== NAV USER DROPDOWN =====
    const navUserBox = document.getElementById("navUserBox");
    const userToggleBtn = document.getElementById("userToggleBtn");
    const userDropdown = document.getElementById("userDropdown");
    const userNameEl = document.getElementById("userName");

    // ===== LOGIN MODAL =====
    const loginModal = document.getElementById("loginModal");
    const loginClose = document.getElementById("loginClose");
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");
    const loginUsername = document.getElementById("loginUsername");
    const loginPassword = document.getElementById("loginPassword");

    function openModal() {
      if (!loginModal) {
        // page nào không có modal thì về index
        window.location.href = "index.html";
        return;
      }
      loginError && (loginError.style.display = "none");
      loginError && (loginError.textContent = "");
      loginModal.hidden = false;
      setTimeout(() => loginUsername?.focus(), 0);
    }

    function closeModal() {
      if (!loginModal) return;
      loginModal.hidden = true;
    }

    // Cho menu mobile gọi được
    window.openLoginModal = openModal;

    function refreshUserName() {
      const user = getUser();
      if (!userNameEl) return;
      if (user?.username) {
        userNameEl.hidden = false;
        userNameEl.textContent = user.username;
      } else {
        userNameEl.hidden = true;
        userNameEl.textContent = "";
      }
    }

    function renderDropdown() {
      if (!userDropdown || !navUserBox) return;

      const user = getUser();
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
        return;
      }

      const role = user.role || "user";
      const isAdmin = role === "admin";
      const isManager = role === "manager";

      userDropdown.innerHTML = `
        <li><a href="character.html">Thông tin nhân vật</a></li>
        ${isAdmin ? `<li><a href="character-create.html">Tạo nhân vật (Admin)</a></li>` : ""}
        ${(isAdmin || isManager) ? `<li><a href="post.html">Đăng bài viết</a></li>` : ""}
        ${isAdmin ? `<li><a href="my-posts.html">Quản lý bài viết</a></li>` : ""}
        <li><a href="#" id="logoutAction">Đăng xuất</a></li>
      `;

      document.getElementById("logoutAction")?.addEventListener("click", (e) => {
        e.preventDefault();
        clearAuth();
        navUserBox.classList.remove("open");
        refreshUserName();
        renderDropdown();
        window.location.reload();
      });
    }

    userToggleBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      renderDropdown();
      navUserBox?.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (navUserBox && !navUserBox.contains(e.target)) navUserBox.classList.remove("open");
    });

    // Login submit
    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = (loginUsername?.value || "").trim();
      const password = (loginPassword?.value || "").trim();

      try {
        const data = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });

        setAuth(data.user, data.token);
        closeModal();
        refreshUserName();
        renderDropdown();
        window.location.reload();
      } catch (err) {
        if (loginError) {
          loginError.textContent = err.message || "Đăng nhập thất bại";
          loginError.style.display = "block";
        } else {
          alert(err.message || "Đăng nhập thất bại");
        }
      }
    });

    loginClose?.addEventListener("click", closeModal);
    loginModal?.addEventListener("click", (e) => {
      if (e.target === loginModal) closeModal();
    });

    refreshUserName();
  });
})();
