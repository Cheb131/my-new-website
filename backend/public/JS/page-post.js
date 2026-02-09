document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("postForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Bạn chưa đăng nhập");
      return;
    }

    const data = {
      title: form.title.value.trim(),
      excerpt: form.excerpt.value.trim(),
      content: form.content.value.trim(),
      image: form.image?.value || "",
      category: form.category?.value || "Tin mới",
      author: form.author?.value || "",
      date: form.date?.value || "",
    };

    if (!data.title || !data.content) {
      alert("Thiếu tiêu đề hoặc nội dung");
      return;
    }

    const res = await fetch("/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      alert("Bạn không có quyền đăng bài");
      return;
    }

    alert("Đăng bài thành công");
    window.location.href = "/my-posts.html";
  });
});
