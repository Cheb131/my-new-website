document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const postEl = document.getElementById("postDetail");
  if (!postEl || !id) return;

  try {
    const items = await (window.Core?.loadArticles?.() || []);
    const a = items.find((x) => String(x.id) === String(id));
    if (!a) throw new Error("Not found");

    const title = a.title || "(Không có tiêu đề)";
    const date = a.date || (a.created_at ? new Date(a.created_at).toLocaleDateString("vi-VN") : "");
    const category = a.category || "Tin mới";
    const content = a.content || "(Không có nội dung)";

    document.title = title;

    postEl.innerHTML = `
      <h1 class="post__title">${escapeHtml(title)}</h1>
      <div class="post__meta">
        <span class="meta__date">${escapeHtml(date)}</span>
        <span class="meta__dot">•</span>
        <span class="meta__cat">${escapeHtml(category)}</span>
      </div>
      <div class="post__content">${escapeHtml(content).replace(/\n/g, "<br>")}</div>
    `;

    renderOtherArticles(items, id);
  } catch (err) {
    console.error(err);
    postEl.innerHTML = `<div style="padding:12px;color:#b91c1c">Không tải được bài viết.</div>`;
  }
});

function renderOtherArticles(items, currentId) {
  const box = document.getElementById("otherArticles");
  if (!box) return;

  const latest = (items || [])
    .filter((x) => String(x.id) !== String(currentId))
    .slice(0, 4);

  box.innerHTML = latest
    .map(
      (a) => `
      <article class="news-item">
        <a href="article.html?id=${encodeURIComponent(a.id)}" class="news-item__thumb">
          <img src="${a.image || "Assets/images/sample.png"}" alt="">
        </a>
        <div class="news-item__body">
          <h4 class="news-item__title">
            <a href="article.html?id=${encodeURIComponent(a.id)}">${escapeHtml(a.title || "")}</a>
          </h4>
        </div>
      </article>
    `
    )
    .join("");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
