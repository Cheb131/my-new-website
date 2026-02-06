document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("postList");
  if (!listEl) return;

  const titleEl = document.querySelector(".list-page__title");

  const params = new URLSearchParams(location.search);
  const rawQ = (params.get("q") || "").trim().slice(0, 80);
  const hasSearch = !!rawQ;
  const q = rawQ.toLowerCase();

  try {
    // ✅ LẤY DATA ĐÃ MERGE (JSON + localStorage) từ core.js
    const data = await window.Core?.loadArticles?.();
    if (!Array.isArray(data)) throw new Error("Core.loadArticles() không tồn tại hoặc trả về không hợp lệ");

    // ===== LỌC THEO SEARCH =====
    const filtered = hasSearch
      ? data.filter(item =>
          `${item.title || ""} ${item.category || ""}`
            .toLowerCase()
            .includes(q)
        )
      : data;

    // ===== HIỂN THỊ DÒNG CHỮ THÔNG BÁO =====
    if (titleEl) {
      if (hasSearch && filtered.length > 0) {
        titleEl.textContent = `Kết quả tìm kiếm cho: "${rawQ}"`;
      } else if (hasSearch && filtered.length === 0) {
        titleEl.textContent = `Không tìm thấy kết quả cho: "${rawQ}"`;
      } else {
        titleEl.textContent = "Tin tức";
      }
    }

    // ===== RENDER DANH SÁCH =====
    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="no-result">
          Không có bài viết phù hợp.
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(item => `
      <div class="post-row">
        <a class="post-row__thumb" href="article.html?id=${encodeURIComponent(item.id)}">
          <img src="${item.image || ""}" alt="${item.title || ""}">
        </a>
        <div class="post-row__body">
          <div class="post-row__title">
            <a href="article.html?id=${encodeURIComponent(item.id)}">${item.title || ""}</a>
          </div>
          <div class="post-row__meta">
            ${item.date || ""}${item.category ? " • " + item.category : ""}
          </div>
        </div>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    listEl.innerHTML = `
      <div style="padding:12px;color:#b91c1c">
        Không tải được danh sách.
      </div>
    `;
  }
});
