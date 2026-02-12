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
});

function mapRow(row) {
  if (!row) return null;
  return {
    ...row,
    level: Number(row.level || 1),
    hp: Number(row.hp || 10),
    ac: Number(row.ac || 10),
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

exports.getAll = (req, res) => {
  const rows = db.prepare("SELECT * FROM characters ORDER BY id DESC").all();
  res.json(rows.map(mapRow));
};

exports.create = (req, res) => {
  const parsed = characterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: parsed.error.flatten() });
  }

  const data = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO characters (
        name, race, class_name, level, alignment, background, avatar, description,
        str, dex, con, int, wis, cha, hp, ac, speed, skills, equipment, notes,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
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
      req.user?.username || "admin"
    );

  const created = db
    .prepare("SELECT * FROM characters WHERE id = ?")
    .get(info.lastInsertRowid);

  res.status(201).json(mapRow(created));
};
