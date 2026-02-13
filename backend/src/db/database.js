const path = require("path");
const Database = require("better-sqlite3");

// __dirname = backend/src/db  ->  ../database.sqlite = backend/src/database.sqlite
const dbPath = path.join(__dirname, "..", "database.sqlite");
console.log("📂 Using database at:", dbPath);

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// ====== users ======
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    email TEXT,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// ====== items ======
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

// ====== characters ======
db.exec(`
  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    class_name TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    alignment TEXT DEFAULT "Neutral",
    background TEXT DEFAULT "Adventurer",
    avatar TEXT DEFAULT "",
    description TEXT DEFAULT "",
    str INTEGER DEFAULT 10,
    dex INTEGER DEFAULT 10,
    con INTEGER DEFAULT 10,
    int INTEGER DEFAULT 10,
    wis INTEGER DEFAULT 10,
    cha INTEGER DEFAULT 10,
    hp INTEGER DEFAULT 10,
    ac INTEGER DEFAULT 10,
    speed TEXT DEFAULT "30 ft",
    skills TEXT DEFAULT "[]",
    equipment TEXT DEFAULT "[]",
    notes TEXT DEFAULT "[]",
    created_by TEXT DEFAULT "",
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// ===== migrate: add is_public if missing (better-sqlite3) =====
try {
  const cols = db.prepare("PRAGMA table_info(characters)").all();
  const has = cols.some(c => c.name === "is_public");
  if (!has) {
    db.prepare("ALTER TABLE characters ADD COLUMN is_public INTEGER DEFAULT 1").run();
    console.log("✅ Migrated: added characters.is_public");
  }
} catch (e) {
  console.error("❌ migrate is_public failed:", e);
}




module.exports = db;
