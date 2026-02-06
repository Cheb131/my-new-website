const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || "./data/app.db";

// tạo folder nếu chưa có
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

// tạo bảng mẫu
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
