document.addEventListener("DOMContentLoaded", async () => {
  const postEl = document.getElementById("postDetail");
  const otherEl = document.getElementById("otherArticles");

  // Lấy id từ URL: article.html?id=1
  const params = new URLSearchParams(window.location.search);
  const currentId = Number(params.get("id"));

  if (!postEl || !otherEl) return;

  try {
    
    const res = await fetch("Data/articles.json");
    if (!res.ok) throw new Error("Fetch lỗi: " + res.status);

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Không có dữ liệu bài viết");

    // tìm bài đang xem
    const current = data.find(a => Number(a.id) === currentId) || data[0];

    // LEFT render
    postEl.innerHTML = `
      <div class="post__head">
        <h1 class="post__title">${current.title || "Bài viết"}</h1>
        <div class="post__meta">${current.date || ""}${current.category ? " • " + current.category : ""}</div>
      </div>

      <div class="post__body">
        ${current.image ? `<img src="${current.image}" alt="${current.title || ""}">` : ""}
        <p>${current.excerpt || ""}</p>
        ${
          current.content
            ? `<div>${current.content}</div>`
            : `<p>(Bạn có thể thêm field <b>content</b> trong articles.json để hiển thị nội dung dài.)</p>`
        }
      </div>
    `;
    document.title = `${current.title} | Không gian văn hoá Hồ Chí Minh`;

    // RIGHT render (bài khác)
    const others = data.filter(a => Number(a.id) !== Number(current.id)).slice(0, 4);

    otherEl.innerHTML = others.map(item => `
      <a class="sidebar-item" href="article.html?id=${item.id}">
        <span class="sidebar-thumb">
          <img src="${item.image || "Assets/images/sample.png"}" alt="${item.title || ""}">
        </span>
        <span class="sidebar-body">
          <div class="sidebar-item-title">${item.title || ""}</div>
          <div class="sidebar-item-meta">${item.date || ""}${item.category ? " • " + item.category : ""}</div>
        </span>
      </a>
    `).join("");

  } catch (err) {
    console.error(err);
    postEl.innerHTML = `<div style="padding:16px;color:#b91c1c">Không tải được bài viết.</div>`;
    otherEl.innerHTML = ``;
  }

  

});
