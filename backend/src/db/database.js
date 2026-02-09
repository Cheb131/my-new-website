const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

// Cho phép override vị trí DB khi deploy
const dbPath = process.env.DB_PATH || "./data/app.db";

// Tạo folder nếu chưa có
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

// =========================================================
// Schema
// =========================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    email TEXT,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
  CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
`);

// =========================================================
// Seed tài khoản mặc định (chỉ tạo nếu chưa có)
// =========================================================

const seedUsers = [
  { username: "admin", role: "admin", password: "123456" },
  { username: "manager", role: "manager", password: "123456" },
  { username: "user", role: "user", password: "123456" },
];

const getUserByUsername = db.prepare("SELECT id FROM users WHERE username = ?");
const insertUser = db.prepare(
  "INSERT INTO users (username, password_hash, role, email, phone) VALUES (?, ?, ?, ?, ?)"
);

for (const u of seedUsers) {
  const exists = getUserByUsername.get(u.username);
  if (!exists) {
    const hash = bcrypt.hashSync(u.password, 10);
    insertUser.run(u.username, hash, u.role, null, null);
  }
}

module.exports = db;
