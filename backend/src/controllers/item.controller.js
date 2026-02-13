const { pool } = require("../db/database");
const { z } = require("zod");

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional().default(""),
  image: z.string().optional().default(""),
  category: z.string().optional().default("Tin mới"),
  author: z.string().optional().default(""),
  date: z.string().optional().default(""),
});

exports.getAll = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM items ORDER BY id DESC");
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query("SELECT * FROM items WHERE id = $1", [id]);
  if (!rows[0]) return res.status(404).json({ message: "Not found" });
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
  }

  const { title, content, excerpt, image, category, author, date } = parsed.data;

  const q = `
    INSERT INTO items (title, excerpt, content, image, category, author, date)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
  const { rows } = await pool.query(q, [
    title,
    excerpt || "",
    content,
    image || "",
    category || "Tin mới",
    author || "",
    date || "",
  ]);

  res.status(201).json(rows[0]);
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  const r = await pool.query("DELETE FROM items WHERE id = $1", [id]);
  if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted successfully" });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
  }

  const { title, content, excerpt, image, category, author, date } = parsed.data;

  const q = `
    UPDATE items
    SET title=$1, excerpt=$2, content=$3, image=$4, category=$5, author=$6, date=$7
    WHERE id=$8
    RETURNING *
  `;

  const { rows } = await pool.query(q, [
    title,
    excerpt || "",
    content,
    image || "",
    category || "Tin mới",
    author || "",
    date || "",
    id,
  ]);

  if (!rows[0]) return res.status(404).json({ message: "Not found" });
  res.json(rows[0]);
};
