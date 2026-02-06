const db = require("../db/database");
const { z } = require("zod");

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

exports.getAll = (req, res) => {
  const rows = db.prepare("SELECT * FROM items ORDER BY id DESC").all();
  res.json(rows);
};

exports.getById = (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ message: "Not found" });
  res.json(row);
};

exports.create = (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
  }

  const { title, content } = parsed.data;
  const info = db
    .prepare("INSERT INTO items (title, content) VALUES (?, ?)")
    .run(title, content);

  const created = db
    .prepare("SELECT * FROM items WHERE id = ?")
    .get(info.lastInsertRowid);

  res.status(201).json(created);
};
