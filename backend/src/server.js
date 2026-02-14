// backend/src/server.js
require("dotenv").config();

const app = require("./app");
const { initDb } = require("./db/database");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await initDb(); // chạy migrations/ensure tables trước khi listen
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ initDb failed:", err);
    process.exit(1);
  }
})();
