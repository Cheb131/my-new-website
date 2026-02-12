(function () {
  const form = document.getElementById("characterCreateForm");
  const errorBox = document.getElementById("createError");
  const successBox = document.getElementById("createSuccess");

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.hidden = false;
    errorBox.textContent = msg;
    if (successBox) successBox.hidden = true;
  }

  function showSuccess(msg) {
    if (!successBox) return;
    successBox.hidden = false;
    successBox.textContent = msg;
    if (errorBox) errorBox.hidden = true;
  }

  function linesToArray(value) {
    return String(value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const user = getUser();
  const token = getToken();
  if (!user || user.role !== "admin" || !token) {
    showError("Bạn không có quyền truy cập trang này. Chỉ admin được tạo nhân vật.");
    if (form) form.hidden = true;
    return;
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      race: String(fd.get("race") || "").trim(),
      class_name: String(fd.get("class_name") || "").trim(),
      level: Number(fd.get("level") || 1),
      alignment: String(fd.get("alignment") || "Neutral").trim(),
      background: String(fd.get("background") || "Adventurer").trim(),
      avatar: String(fd.get("avatar") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      stats: {
        str: Number(fd.get("str") || 10),
        dex: Number(fd.get("dex") || 10),
        con: Number(fd.get("con") || 10),
        int: Number(fd.get("int") || 10),
        wis: Number(fd.get("wis") || 10),
        cha: Number(fd.get("cha") || 10),
      },
      hp: Number(fd.get("hp") || 10),
      ac: Number(fd.get("ac") || 10),
      speed: String(fd.get("speed") || "30 ft").trim(),
      skills: linesToArray(fd.get("skills")),
      equipment: linesToArray(fd.get("equipment")),
      notes: linesToArray(fd.get("notes")),
    };

    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || "Tạo nhân vật thất bại";
        showError(msg);
        return;
      }

      showSuccess("Tạo nhân vật thành công! Đang chuyển về trang danh sách...");
      form.reset();
      setTimeout(() => {
        window.location.href = "character.html";
      }, 900);
    } catch (err) {
      showError(err?.message || "Không kết nối được server");
    }
  });
})();

