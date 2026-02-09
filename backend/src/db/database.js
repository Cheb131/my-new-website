const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || "./data/app.db";

// tạo folder nếu chưa có
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);

// tạo bảng (mới)
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    excerpt TEXT DEFAULT "",
    content TEXT NOT NULL,
    image TEXT DEFAULT "",
    category TEXT DEFAULT "Tin mới",
    author TEXT DEFAULT "",
    date TEXT DEFAULT "",
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// migrate (cũ -> thêm cột nếu thiếu)
const cols = db.prepare(`PRAGMA table_info(items)`).all().map((c) => c.name);
const addCol = (name, ddl) => {
  if (!cols.includes(name)) {
    try { db.exec(`ALTER TABLE items ADD COLUMN ${ddl}`); } catch {}
  }
};

addCol("excerpt", `excerpt TEXT DEFAULT ""`);
addCol("image", `image TEXT DEFAULT ""`);
addCol("category", `category TEXT DEFAULT "Tin mới"`);
addCol("author", `author TEXT DEFAULT ""`);
addCol("date", `date TEXT DEFAULT ""`);

module.exports = db;
