// src/db/database.js
const { Pool } = require("pg");
console.log("DATABASE_URL =", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon cần TLS; config này giúp tránh lỗi cert trên cloud
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      email TEXT,
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      excerpt TEXT DEFAULT '',
      content TEXT NOT NULL,
      image TEXT DEFAULT '',
      category TEXT DEFAULT 'Tin mới',
      author TEXT DEFAULT '',
      date TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS characters (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      race TEXT NOT NULL,
      class_name TEXT NOT NULL,
      level INT DEFAULT 1,
      alignment TEXT DEFAULT 'Neutral',
      background TEXT DEFAULT 'Adventurer',
      avatar TEXT DEFAULT '',
      description TEXT DEFAULT '',
      str INT DEFAULT 10,
      dex INT DEFAULT 10,
      con INT DEFAULT 10,
      int INT DEFAULT 10,
      wis INT DEFAULT 10,
      cha INT DEFAULT 10,
      hp INT DEFAULT 10,
      ac INT DEFAULT 10,
      speed TEXT DEFAULT '30 ft',
      skills JSONB DEFAULT '[]'::jsonb,
      equipment JSONB DEFAULT '[]'::jsonb,
      notes JSONB DEFAULT '[]'::jsonb,
      created_by TEXT DEFAULT '',
      is_public BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  console.log("✅ Postgres tables ensured");
}

module.exports = { pool, initDb };
