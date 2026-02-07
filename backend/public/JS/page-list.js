document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ page-list.js ĐANG CHẠY");

  const listEl = document.getElementById("postList");
  if (!listEl) return;

  // Lấy role từ localStorage.user (core.js đã lưu sau khi login)
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const isAdmin = user?.role === "admin";

  const params = new URLSearchParams(location.search);
  const rawQ = (params.get("q") || "").trim().slice(0, 80);
  const hasSearch = !!rawQ;
  const q = rawQ.toLowerCase();

  try {
    // nếu bạn dùng core.js, có thể gọi window.API.apiGetArticles()
    // nhưng bạn đang gọi trực tiếp apiGetArticles() cũng OK nếu nó tồn tại global
    const raw = await apiGetArticles();
    if (!Array.isArray(raw)) throw new Error("API lỗi");

    const data = raw.map((item) => ({
      id: String(item.id),
      title: item.title || "",
      image: "Assets/images/sample.png",
      date: new Date().toLocaleDateString("vi-VN"),
      category: "Tin mới",
    }));

    const filtered = hasSearch
      ? data.filter((i) => `${i.title} ${i.category}`.toLowerCase().includes(q))
      : data;

    if (filtered.length === 0) {
      listEl.innerHTML = `<div>Không có bài viết</div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map(
        (item) => `
      <div class="post-row">
        <div class="post-row__body">
          <div class="post-row__title">
            <a href="article.html?id=${item.id}">${item.title}</a>
          </div>
          <div class="post-row__meta">
            ${item.date} • ${item.category}
          </div>

          ${
            isAdmin
              ? `<button data-delete-id="${item.id}" class="post-row__delete">Xoá</button>`
              : ""
          }
        </div>
      </div>
    `
      )
      .join("");

    // Chỉ admin mới có nút => chỉ admin mới gắn sự kiện
    if (isAdmin) {
      document.querySelectorAll("[data-delete-id]").forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.dataset.deleteId;
          if (!confirm("Xoá bài này?")) return;

          const token = localStorage.getItem("token");
          if (!token) {
            alert("Bạn cần đăng nhập để xoá.");
            return;
          }

          const res = await fetch(`/api/items/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            const msg = await res.text().catch(() => "");
            alert(`Xoá thất bại (${res.status}). ${msg}`);
            return;
          }

          location.reload();
        };
      });
    }
  } catch (e) {
    console.error(e);
    listEl.innerHTML = `<div>Lỗi tải dữ liệu</div>`;
  }
});
