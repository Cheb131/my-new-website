
 db.exec(`
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
 

// bảng nhân vật DnD
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

 module.exports = db;
