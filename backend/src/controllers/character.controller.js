const { pool } = require("../db/database");
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
  is_public: z.coerce.boolean().optional().default(true),
});

function arr(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return []; }
  }
  return [];
}

function mapRow(row) {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id),
    level: Number(row.level || 1),
    hp: Number(row.hp || 10),
    ac: Number(row.ac || 10),
    is_public: !!row.is_public,
    stats: {
      str: Number(row.str || 10),
      dex: Number(row.dex || 10),
      con: Number(row.con || 10),
      int: Number(row.int || 10),
      wis: Number(row.wis || 10),
      cha: Number(row.cha || 10),
    },
    skills: arr(row.skills),
    equipment: arr(row.equipment),
    notes: arr(row.notes),
  };
}

// ===== PUBLIC list =====
exports.getPublic = async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM characters WHERE is_public = true ORDER BY id DESC"
  );
  res.json(rows.map(mapRow));
};

// ===== PUBLIC detail =====
exports.getPublicById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const { rows } = await pool.query(
    "SELECT * FROM characters WHERE id = $1 AND is_public = true",
    [id]
  );
  if (!rows[0]) return res.status(404).json({ message: "Character not found" });

  res.json(mapRow(rows[0]));
};

// ===== CREATE (ai cũng đăng) =====
exports.create = async (req, res) => {
  const parsed = characterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation error",
      errors: parsed.error.flatten(),
    });
  }

  const data = parsed.data;

  const q = `
    INSERT INTO characters (
      name, race, class_name, level, alignment, background, avatar, description,
      str, dex, con, int, wis, cha, hp, ac, speed,
      skills, equipment, notes, created_by, is_public
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,$14,$15,$16,$17,
      $18,$19,$20,$21,$22
    )
    RETURNING *
  `;

  const params = [
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
    data.skills || [],
    data.equipment || [],
    data.notes || [],
    "guest",
    !!data.is_public,
  ];

  const { rows } = await pool.query(q, params);
  res.status(201).json(mapRow(rows[0]));
};

// ===== DELETE (ai cũng xoá) =====
exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const found = await pool.query("SELECT id FROM characters WHERE id = $1", [id]);
  if (!found.rows[0]) return res.status(404).json({ message: "Character not found" });

  await pool.query("DELETE FROM characters WHERE id = $1", [id]);
  res.json({ ok: true, id });
};
