document.addEventListener("DOMContentLoaded", async () => {
  const box = document.getElementById("newsList");
  if (!box) return;

  // ===== lấy keyword từ URL =====
  const params = new URLSearchParams(window.location.search);
  const keywordRaw = (params.get("q") || "").trim();
  const keyword = keywordRaw.toLowerCase();

  // ===== hiển thị "từ khóa bạn tìm là" =====
  const keywordBox = document.getElementById("searchKeyword");
  if (keywordBox && keywordRaw) {
    keywordBox.innerHTML = `Từ khóa phiêu lưu của bạn: <b>${keywordRaw}</b>`;
    keywordBox.hidden = false;
  }

  box.innerHTML = "Đang tải dữ liệu...";

  try {
    const res = await fetch("/api/items");
    if (!res.ok) throw new Error("Fetch failed");

    let items = await res.json();

    // ===== LỌC THEO TIÊU ĐỀ =====
    if (keyword) {
      items = items.filter(item =>
        (item.title || "").toLowerCase().includes(keyword)
      );
    }

    if (!items.length) {
      box.innerHTML = keyword
        ? `Không tìm thấy bài viết D&D nào với từ khóa "<b>${keywordRaw}</b>"`
        : "Chưa có bài viết D&D nào.";
      return;
    }

    // ===== RENDER =====
    box.innerHTML = items.map(item => `
      <article class="news-item">
        <a href="/article.html?id=${item.id}" class="news-link">
          <img src="${item.image || "/Assets/images/sample.png"}" alt="">
          <div class="news-content">
            <h3 class="news-title">${item.title}</h3>

            <div class="news-meta">
              ${item.date || ""}${item.author ? " · " + item.author : ""}
            </div>

            <p class="news-excerpt">
              ${item.excerpt || item.content.slice(0,120) + "..."}
            </p>
          </div>
        </a>
      </article>
    `).join("");
  } catch (err) {
    console.error(err);
    box.innerHTML = "Lỗi tải dữ liệu";
  }
});
