const app = require("./app");
const { initDb } = require("./db/database");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await initDb();
    app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
  } catch (e) {
    console.error("❌ initDb failed:", e);
    process.exit(1);
  }
})();
