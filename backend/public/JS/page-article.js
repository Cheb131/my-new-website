document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const postEl = document.getElementById("postDetail");
  if (!postEl) return;

  try {
    const a = await apiGetArticle(id);

    // fallback
    const title = a?.title || "(Không có tiêu đề)";
    const content = a?.content || "(Không có nội dung)";
    const date = a?.created_at
      ? new Date(a.created_at).toLocaleString("vi-VN")
      : new Date().toLocaleString("vi-VN");

    document.title = title;

    postEl.innerHTML = `
      <h1 class="post__title">${title}</h1>
      <div class="post__meta">
        <span class="meta__date">${date}</span>
        <span class="meta__dot">•</span>
        <span class="meta__cat">Tin mới</span>
      </div>
      <div class="post__content">
        ${escapeHtml(content).replace(/\n/g, "<br>")}
      </div>
    `;
  } catch (err) {
    console.error(err);
    postEl.innerHTML = `
      <div style="padding:12px;color:#b91c1c">
        Không tải được bài viết.
      </div>
    `;
  }
});

// chống XSS khi render content
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function renderOtherArticles() {
  const box = document.getElementById("otherArticles");
  if (!box) return;

  try {
    const items = await apiGetArticles();
    const latest = items.slice(0, 4);

    box.innerHTML = latest.map(a => `
      <article class="news-item">
        <a href="article.html?id=${a.id}" class="news-item__thumb">
          <img src="Assets/images/sample.png" alt="">
        </a>
        <div class="news-item__body">
          <h4 class="news-item__title">
            <a href="article.html?id=${a.id}">${a.title}</a>
          </h4>
        </div>
      </article>
    `).join("");
  } catch (e) {
    box.innerHTML = "";
  }
}

renderOtherArticles();
