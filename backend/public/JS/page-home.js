async function apiGetArticles() {
  const res = await fetch("/api/items");
  if (!res.ok) throw new Error("Fetch failed");
  return await res.json();
}


document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await apiGetArticles();
    console.log("DATA TỪ BACKEND:", data);
  } catch (e) {
    console.error("LỖI GỌI BACKEND:", e);
  }
});
