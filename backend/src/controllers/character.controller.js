// backend/src/controllers/character.controller.js
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

  stats: z
    .object({
      str: z.coerce.number().int().min(1).max(30),
      dex: z.coerce.number().int().min(1).max(30),
      con: z.coerce.number().int().min(1).max(30),
      int: z.coerce.number().int().min(1).max(30),
      wis: z.coerce.number().int().min(1).max(30),
      cha: z.coerce.number().int().min(1).max(30),
    })
    .default({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),

  hp: z.coerce.number().int().min(1).max(999).default(10),
  ac: z.coerce.number().int().min(1).max(30).default(10),
  speed: z.string().trim().optional().default("30 ft"),

  skills: z.array(z.string().trim().min(1).max(80)).optional().default([]),
  equipment: z.array(z.string().trim().min(1).max(240)).optional().default([]),
  notes: z.array(z.string().trim().min(1).max(600)).optional().default([]),

  // extra
  feature_lines: z.array(z.string().trim().min(1).max(600)).optional().default([]),

  resistances: z.array(z.string()).optional().default([]),
  immunities: z.array(z.string()).optional().default([]),
  vulnerabilities: z.array(z.string()).optional().default([]),

  senses: z
    .object({
      passivePerception: z.coerce.number().int().min(0).max(99).optional().default(0),
      passiveInsight: z.coerce.number().int().min(0).max(99).optional().default(0),
      passiveInvestigation: z.coerce.number().int().min(0).max(99).optional().default(0),
    })
    .optional()
    .default({ passivePerception: 0, passiveInsight: 0, passiveInvestigation: 0 }),

  is_public: z.coerce.boolean().optional().default(true),
});

function arr(v) {
  if (Array.isArray(v)) return v.map(String);
  if (v && typeof v === "object" && !Array.isArray(v)) return [];
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    try {
      const j = JSON.parse(s);
      return Array.isArray(j) ? j.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function obj(v, fallback = {}) {
  if (v && typeof v === "object" && !Array.isArray(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return fallback;
    try {
      const j = JSON.parse(s);
      if (j && typeof j === "object" && !Array.isArray(j)) return j;
    } catch {}
  }
  return fallback;
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

    // ✅ jsonb từ pg thường đã là object/array -> KHÔNG JSON.parse bừa
    skills: arr(row.skills),
    equipment: arr(row.equipment),
    notes: arr(row.notes),
    feature_lines: arr(row.feature_lines),

    resistances: arr(row.resistances),
    immunities: arr(row.immunities),
    vulnerabilities: arr(row.vulnerabilities),
    senses: obj(row.senses, { passivePerception: 0, passiveInsight: 0, passiveInvestigation: 0 }),
  };
}

function isOwnerOrAdmin(reqUser, row) {
  const isAdmin = reqUser?.role === "admin";
  const isOwner =
    String(row?.created_by || "").toLowerCase() ===
    String(reqUser?.username || "").toLowerCase();
  return isAdmin || isOwner;
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

// ===== AUTH detail (owner/admin xem private) =====
exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const r = await pool.query("SELECT * FROM characters WHERE id = $1", [id]);
  const row = r.rows[0];
  if (!row) return res.status(404).json({ message: "Character not found" });

  if (!row.is_public && !isOwnerOrAdmin(req.user, row)) {
    return res.status(403).json({ message: "Bạn không có quyền xem nhân vật này" });
  }

  res.json(mapRow(row));
};

// ===== CREATE =====
exports.create = async (req, res) => {
  const parsed = characterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation error",
      errors: parsed.error.flatten(),
    });
  }

  const data = parsed.data;
  const createdBy = req.user?.username ? String(req.user.username) : "guest";

  const q = `
    INSERT INTO characters (
      name, race, class_name, level, alignment, background, avatar, description,
      str, dex, con, int, wis, cha, hp, ac, speed,
      skills, equipment, notes, feature_lines, created_by, is_public,
      resistances, immunities, vulnerabilities, senses
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,$14,$15,$16,$17,
      $18::jsonb,$19::jsonb,$20::jsonb,$21::jsonb,$22,$23,
      $24::jsonb,$25::jsonb,$26::jsonb,$27::jsonb
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

    JSON.stringify(data.skills || []),
    JSON.stringify(data.equipment || []),
    JSON.stringify(data.notes || []),
    JSON.stringify(data.feature_lines || []),

    createdBy,
    !!data.is_public,

    JSON.stringify(data.resistances || []),
    JSON.stringify(data.immunities || []),
    JSON.stringify(data.vulnerabilities || []),
    JSON.stringify(data.senses || {}),
  ];

  const { rows } = await pool.query(q, params);
  res.status(201).json(mapRow(rows[0]));
};

// ===== UPDATE (owner/admin) =====
exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const parsed = characterSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation error",
      errors: parsed.error.flatten(),
    });
  }

  const curR = await pool.query("SELECT * FROM characters WHERE id = $1", [id]);
  const cur = curR.rows[0];
  if (!cur) return res.status(404).json({ message: "Character not found" });

  if (!isOwnerOrAdmin(req.user, cur)) {
    return res.status(403).json({ message: "Bạn không có quyền sửa nhân vật này" });
  }

  const patch = parsed.data;

  const next = {
    name: patch.name ?? cur.name,
    race: patch.race ?? cur.race,
    class_name: patch.class_name ?? cur.class_name,
    level: patch.level ?? cur.level,
    alignment: patch.alignment ?? cur.alignment,
    background: patch.background ?? cur.background,
    avatar: patch.avatar ?? cur.avatar,
    description: patch.description ?? cur.description,

    stats: patch.stats
      ? patch.stats
      : { str: cur.str, dex: cur.dex, con: cur.con, int: cur.int, wis: cur.wis, cha: cur.cha },

    hp: patch.hp ?? cur.hp,
    ac: patch.ac ?? cur.ac,
    speed: patch.speed ?? cur.speed,

    skills: patch.skills ?? arr(cur.skills),
    equipment: patch.equipment ?? arr(cur.equipment),
    notes: patch.notes ?? arr(cur.notes),
    feature_lines: patch.feature_lines ?? arr(cur.feature_lines),

    resistances: patch.resistances ?? arr(cur.resistances),
    immunities: patch.immunities ?? arr(cur.immunities),
    vulnerabilities: patch.vulnerabilities ?? arr(cur.vulnerabilities),
    senses: patch.senses ?? obj(cur.senses, { passivePerception: 0, passiveInsight: 0, passiveInvestigation: 0 }),

    is_public: typeof patch.is_public === "boolean" ? patch.is_public : !!cur.is_public,
  };

  const q = `
    UPDATE characters SET
      name=$1, race=$2, class_name=$3, level=$4,
      alignment=$5, background=$6, avatar=$7, description=$8,
      str=$9, dex=$10, con=$11, int=$12, wis=$13, cha=$14,
      hp=$15, ac=$16, speed=$17,
      skills=$18::jsonb, equipment=$19::jsonb, notes=$20::jsonb, feature_lines=$21::jsonb,
      is_public=$22,
      resistances=$23::jsonb, immunities=$24::jsonb, vulnerabilities=$25::jsonb, senses=$26::jsonb
    WHERE id=$27
    RETURNING *
  `;

  const params = [
    next.name,
    next.race,
    next.class_name,
    Number(next.level || 1),
    next.alignment,
    next.background,
    next.avatar || "",
    next.description || "",

    Number(next.stats.str || 10),
    Number(next.stats.dex || 10),
    Number(next.stats.con || 10),
    Number(next.stats.int || 10),
    Number(next.stats.wis || 10),
    Number(next.stats.cha || 10),

    Number(next.hp || 10),
    Number(next.ac || 10),
    next.speed || "30 ft",

    JSON.stringify(next.skills || []),
    JSON.stringify(next.equipment || []),
    JSON.stringify(next.notes || []),
    JSON.stringify(next.feature_lines || []),

    !!next.is_public,

    JSON.stringify(next.resistances || []),
    JSON.stringify(next.immunities || []),
    JSON.stringify(next.vulnerabilities || []),
    JSON.stringify(next.senses || {}),

    id,
  ];

  const { rows } = await pool.query(q, params);
  res.json(mapRow(rows[0]));
};

// ===== DELETE (owner/admin) =====
exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const found = await pool.query("SELECT id, created_by FROM characters WHERE id = $1", [id]);
  const row = found.rows[0];
  if (!row) return res.status(404).json({ message: "Character not found" });

  if (!isOwnerOrAdmin(req.user, row)) {
    return res.status(403).json({ message: "Bạn không có quyền xoá nhân vật này" });
  }

  await pool.query("DELETE FROM characters WHERE id = $1", [id]);
  res.json({ ok: true, id });
};
