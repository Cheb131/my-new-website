/* =========================================================
   articles-data.js
   - Load articles from articles.json
   - Provide helper methods: all, latest, getById, searchByTitle
========================================================= */

(() => {
  const state = {
    loaded: false,
    items: [],
    loadingPromise: null,
  };

  function normalizeText(s) {
    return (s ?? "")
      .toString()
      .trim()
      .toLowerCase();
  }

  async function fetchFirstOk(urls) {
    let lastErr = null;

    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
        return await res.json();
      } catch (e) {
        lastErr = e;
      }
    }

    throw lastErr || new Error("Cannot load articles.json");
  }

  async function load() {
    if (state.loaded) return state.items;
    if (state.loadingPromise) return state.loadingPromise;

    // Thử vài đường dẫn phổ biến (bạn có thể chỉnh nếu dự án đặt file ở nơi khác)
    const candidates = [
      "articles.json",
      "./articles.json",
      "/articles.json",
      "Assets/articles.json",
      "./Assets/articles.json",
    ];

    state.loadingPromise = (async () => {
      const data = await fetchFirstOk(candidates);

      // đảm bảo là array
      state.items = Array.isArray(data) ? data : [];
      state.loaded = true;
      return state.items;
    })();

    return state.loadingPromise;
  }

  function all() {
    return state.items.slice();
  }

  function getById(id) {
    const needle = String(id);
    return state.items.find((a) => String(a.id) === needle) || null;
  }

  // "latest" theo thứ tự: ưu tiên date nếu parse được, fallback theo id desc
  function toTime(dmy) {
    // dd/mm/yyyy
    if (!dmy) return NaN;
    const m = String(dmy).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return NaN;
    const dd = Number(m[1]), mm = Number(m[2]) - 1, yy = Number(m[3]);
    const t = new Date(yy, mm, dd).getTime();
    return Number.isFinite(t) ? t : NaN;
  }

  function latest(n = 4) {
    const items = state.items.slice();

    items.sort((a, b) => {
      const ta = toTime(a.date);
      const tb = toTime(b.date);

      if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return tb - ta;
      // fallback id desc
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    return items.slice(0, n);
  }

  function searchByTitle(query, limit = 6) {
    const q = normalizeText(query);
    if (!q) return [];

    const scored = state.items
      .map((a) => {
        const t = normalizeText(a.title);
        let score = 0;

        if (t === q) score = 100;
        else if (t.startsWith(q)) score = 80;
        else if (t.includes(q)) score = 60;

        return { a, score };
      })
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score);

    return scored.slice(0, limit).map((x) => x.a);
  }

  window.ArticlesData = {
    load,
    all,
    latest,
    getById,
    searchByTitle,
  };
})();
