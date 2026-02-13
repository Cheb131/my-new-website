const db = require("../db/database");
const { z } = require("zod");

const characterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  race: z.string().trim().min(1).max(80),
  class_name: z.string().trim().min(1).max(120),
  level: z.coerce.number().int().min(1).max(20),
  alignment: z.string().trim().min(1).max(80),
  background: z.string().trim().min(1).max(140),
  avatar: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),

  stats: z.object({
    str: z.coerce.number().int().min(1).max(30),
    dex: z.coerce.number().int().min(1).max(30),
    con: z.coerce.number().int().min(1).max(30),
    int: z.coerce.number().int().min(1).max(30),
    wis: z.coerce.number().int().min(1).max(30),
    cha: z.coerce.number().int().min(1).max(30),
  }).default({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),

  hp: z.coerce.number().int().min(1).max(999).default(10),
  ac: z.coerce.number().int().min(1).max(30).default(10),
  speed: z.string().trim().optional().default("30 ft"),

  skills: z.array(z.string().trim().min(1).max(80)).optional().default([]),
  equipment: z.array(z.string().trim().min(1).max(160)).optional().default([]),
  notes: z.array(z.string().trim().min(1).max(240)).optional().default([]),

  // nếu frontend có gửi is_public thì nhận, không thì mặc định true
  is_public: z.coerce.boolean().optional().default(true),
});

function mapRow(row) {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id),
    level: Number(row.level || 1),
    hp: Number(row.hp || 10),
    ac: Number(row.ac || 10),
    is_public: Number(row.is_public || 0) === 1,
    stats: {
      str: Number(row.str || 10),
      dex: Number(row.dex || 10),
      con: Number(row.con || 10),
      int: Number(row.int || 10),
      wis: Number(row.wis || 10),
      cha: Number(row.cha || 10),
    },
    skills: row.skills ? JSON.parse(row.skills) : [],
    equipment: row.equipment ? JSON.parse(row.equipment) : [],
    notes: row.notes ? JSON.parse(row.notes) : [],
  };
}

/**
 * ✅ Helper: kiểm tra cột có tồn tại (để DB cũ vẫn chạy)
 */
let COL_CACHE = null;
function hasColumn(colName) {
  if (!COL_CACHE) {
    const cols = db.prepare("PRAGMA table_info(characters)").all();
    COL_CACHE = new Set(cols.map((c) => c.name));
  }
  return COL_CACHE.has(colName);
}

// ===== PUBLIC list =====
exports.getPublic = (req, res) => {
  const sql = hasColumn("is_public")
    ? "SELECT * FROM characters WHERE is_public = 1 ORDER BY id DESC"
    : "SELECT * FROM characters ORDER BY id DESC";

  const rows = db.prepare(sql).all();
  res.json(rows.map(mapRow));
};

// ===== PUBLIC detail =====
exports.getPublicById = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const sql = hasColumn("is_public")
    ? "SELECT * FROM characters WHERE id = ? AND is_public = 1"
    : "SELECT * FROM characters WHERE id = ?";

  const row = db.prepare(sql).get(id);
  if (!row) return res.status(404).json({ message: "Character not found" });

  res.json(mapRow(row));
};

// ===== CREATE (ai cũng đăng) =====
exports.create = (req, res) => {
  const parsed = characterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation error",
      errors: parsed.error.flatten(),
    });
  }

  const data = parsed.data;

  const cols = [
    "name", "race", "class_name", "level", "alignment", "background", "avatar", "description",
    "str", "dex", "con", "int", "wis", "cha",
    "hp", "ac", "speed",
    "skills", "equipment", "notes",
  ];

  const values = [
    data.name,
    data.race,
    data.class_name,
    data.level,
    data.alignment,
    data.background,
    data.avatar || "",
    data.description || "",
    data.stats.str,
    data.stats.dex,
    data.stats.con,
    data.stats.int,
    data.stats.wis,
    data.stats.cha,
    data.hp,
    data.ac,
    data.speed || "30 ft",
    JSON.stringify(data.skills || []),
    JSON.stringify(data.equipment || []),
    JSON.stringify(data.notes || []),
  ];

  // optional columns if exist
  if (hasColumn("created_by")) {
    cols.push("created_by");
    values.push("guest");
  }
  if (hasColumn("is_public")) {
    cols.push("is_public");
    values.push(data.is_public ? 1 : 0);
  }

  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT INTO characters (${cols.join(", ")}) VALUES (${placeholders})`;

  const info = db.prepare(sql).run(...values);

  const created = db.prepare("SELECT * FROM characters WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(mapRow(created));
};

// ===== DELETE (ai cũng xoá) =====
exports.remove = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const row = db.prepare("SELECT id FROM characters WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ message: "Character not found" });

  db.prepare("DELETE FROM characters WHERE id = ?").run(id);
  res.json({ ok: true, id });
};
