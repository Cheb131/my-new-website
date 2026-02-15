(() => {
  const API_BASE = (location.port === "5500") ? "http://localhost:3000" : "";

  // ✅ Web đã bỏ đăng nhập: vẫn giữ mấy hàm token để không phá các file cũ,
  // nhưng UI sẽ không còn login/register/logout.
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

  function normalizePath(path) {
    // đảm bảo luôn bắt đầu bằng "/"
    const p = String(path || "");
    if (!p) return "/";
    return p.startsWith("/") ? p : `/${p}`;
  }

  async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!headers["Content-Type"] && options.body) headers["Content-Type"] = "application/json";

    // token không bắt buộc, nhưng nếu còn lưu thì vẫn gửi (không ảnh hưởng)
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const urlPath = normalizePath(path);
    const res = await fetch(`${API_BASE}${urlPath}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message || `${res.status} ${res.statusText}`;
      const reason = data?.reason ? ` (${data.reason})` : "";
      throw new Error(`${msg}${reason}`);
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

    // back-compat
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

    // ✅ Không dùng login modal nữa
    const loginModal = document.getElementById("loginModal");
    if (loginModal) loginModal.hidden = true;
    window.openLoginModal = () => {
      // Không làm gì nữa
      alert("Web đã bỏ đăng nhập. Bạn có thể tạo/xem/chỉnh sửa nhân vật trực tiếp.");
    };

    function refreshUserName() {
      if (!userNameEl) return;
      userNameEl.hidden = false;
      userNameEl.textContent = "Guest";
    }

    function renderDropdown() {
      if (!userDropdown || !navUserBox) return;

      // ✅ Luôn hiển thị menu public
      userDropdown.innerHTML = `
        <li><a href="character-list.html">Danh sách nhân vật</a></li>
        <li><a href="character-create.html">Tạo nhân vật</a></li>
        <li><a href="post.html">Đăng bài viết</a></li>
        <li><a href="my-posts.html">Bài viết của tôi</a></li>
      `;
    }

    userToggleBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      renderDropdown();
      navUserBox?.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (navUserBox && !navUserBox.contains(e.target)) navUserBox.classList.remove("open");
    });

    refreshUserName();
  });
})();
