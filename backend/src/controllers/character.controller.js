const { pool } = require("../db/database");
const { z } = require("zod");

// ✅ BỎ ĐĂNG NHẬP: ai cũng có thể tạo/xem/sửa/xoá.
// - created_by sẽ mặc định "guest" (hoặc nếu bạn vẫn gửi req.user từ đâu đó thì vẫn nhận)
// - vẫn giữ is_public để bạn có thể dùng 2 endpoint: /public (lọc) và /characters (tất cả)

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
  equipment: z.array(z.string().trim().min(1).max(160)).optional().default([]),
  notes: z.array(z.string().trim().min(1).max(240)).optional().default([]),

  is_public: z.coerce.boolean().optional().default(true),

  resistances: z.array(z.string().trim().min(1).max(80)).optional().default([]),
  immunities: z.array(z.string().trim().min(1).max(80)).optional().default([]),
  vulnerabilities: z.array(z.string().trim().min(1).max(80)).optional().default([]),

  senses: z
    .object({
      passivePerception: z.coerce.number().int().min(0).max(99).optional().default(0),
      passiveInsight: z.coerce.number().int().min(0).max(99).optional().default(0),
      passiveInvestigation: z.coerce.number().int().min(0).max(99).optional().default(0),
    })
    .optional()
    .default({ passivePerception: 0, passiveInsight: 0, passiveInvestigation: 0 }),
});

function safeJson(v, fallback) {
  try {
    if (v == null) return fallback;
    if (typeof v === "object") return v;
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return fallback;
      return JSON.parse(s);
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function arr(v) {
  const a = safeJson(v, []);
  return Array.isArray(a) ? a : [];
}

function obj(v) {
  const o = safeJson(v, {});
  return o && typeof o === "object" && !Array.isArray(o) ? o : {};
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

    resistances: arr(row.resistances),
    immunities: arr(row.immunities),
    vulnerabilities: arr(row.vulnerabilities),
    senses: obj(row.senses),
  };
}

// ===== PUBLIC list (is_public=true) =====
exports.getPublic = async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM characters WHERE is_public = true ORDER BY id DESC"
  );
  res.json(rows.map(mapRow));
};

// ===== PUBLIC detail (is_public=true) =====
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

// ===== ALL list (không filter) =====
exports.getAll = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM characters ORDER BY id DESC");
  res.json(rows.map(mapRow));
};

// ===== ALL detail (không filter) =====
exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const { rows } = await pool.query("SELECT * FROM characters WHERE id = $1", [id]);
  if (!rows[0]) return res.status(404).json({ message: "Character not found" });
  res.json(mapRow(rows[0]));
};

// ===== CREATE (ai cũng tạo) =====
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
      skills, equipment, notes,
      created_by, is_public,
      resistances, immunities, vulnerabilities, senses
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,$14,$15,$16,$17,
      $18::jsonb,$19::jsonb,$20::jsonb,
      $21,$22,
      $23::jsonb,$24::jsonb,$25::jsonb,$26::jsonb
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

    createdBy,
    !!data.is_public,

    JSON.stringify(data.resistances || []),
    JSON.stringify(data.immunities || []),
    JSON.stringify(data.vulnerabilities || []),
    JSON.stringify(data.senses || { passivePerception: 0, passiveInsight: 0, passiveInvestigation: 0 }),
  ];

  const { rows } = await pool.query(q, params);
  res.status(201).json(mapRow(rows[0]));
};

// ===== UPDATE (ai cũng sửa) =====
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
      : {
          str: cur.str,
          dex: cur.dex,
          con: cur.con,
          int: cur.int,
          wis: cur.wis,
          cha: cur.cha,
        },

    hp: patch.hp ?? cur.hp,
    ac: patch.ac ?? cur.ac,
    speed: patch.speed ?? cur.speed,

    skills: patch.skills ?? arr(cur.skills),
    equipment: patch.equipment ?? arr(cur.equipment),
    notes: patch.notes ?? arr(cur.notes),

    is_public: typeof patch.is_public === "boolean" ? patch.is_public : !!cur.is_public,

    resistances: patch.resistances ?? arr(cur.resistances),
    immunities: patch.immunities ?? arr(cur.immunities),
    vulnerabilities: patch.vulnerabilities ?? arr(cur.vulnerabilities),
    senses: patch.senses ?? obj(cur.senses),
  };

  const q = `
    UPDATE characters SET
      name=$1, race=$2, class_name=$3, level=$4,
      alignment=$5, background=$6, avatar=$7, description=$8,
      str=$9, dex=$10, con=$11, int=$12, wis=$13, cha=$14,
      hp=$15, ac=$16, speed=$17,
      skills=$18::jsonb, equipment=$19::jsonb, notes=$20::jsonb,
      created_by=$21,
      is_public=$22,
      resistances=$23::jsonb, immunities=$24::jsonb, vulnerabilities=$25::jsonb, senses=$26::jsonb
    WHERE id=$27
    RETURNING *
  `;

  // Nếu trước đây có created_by rỗng, mình set lại guest cho nhất quán
  const createdBy = (cur.created_by && String(cur.created_by).trim()) ? cur.created_by : "guest";

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

    createdBy,
    !!next.is_public,

    JSON.stringify(next.resistances || []),
    JSON.stringify(next.immunities || []),
    JSON.stringify(next.vulnerabilities || []),
    JSON.stringify(next.senses || { passivePerception: 0, passiveInsight: 0, passiveInvestigation: 0 }),

    id,
  ];

  const { rows } = await pool.query(q, params);
  res.json(mapRow(rows[0]));
};

// ===== DELETE (ai cũng xoá) =====
exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const found = await pool.query("SELECT id FROM characters WHERE id = $1", [id]);
  const row = found.rows[0];
  if (!row) return res.status(404).json({ message: "Character not found" });

  await pool.query("DELETE FROM characters WHERE id = $1", [id]);
  res.json({ ok: true, id });
};
