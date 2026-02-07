document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await apiGetArticles();
    console.log("DATA TỪ BACKEND:", data);
  } catch (e) {
    console.error("LỖI GỌI BACKEND:", e);
  }
});
