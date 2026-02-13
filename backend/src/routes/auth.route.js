const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

const db = require("../db/database");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

const usernameSchema = z
  .string()
  .trim()
  .min(4)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ được dùng chữ/số/_");

const passwordSchema = z.string().min(6).max(100);

const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải 10–11 chữ số")
    .optional()
    .or(z.literal("")),
});

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const roleSchema = z.object({
  role: z.enum(["user", "manager", "admin"]),
});

function mustHaveJwtSecret(res) {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ message: "Missing JWT_SECRET (env)" });
    return false;
  }
  return true;
}

function normalizeUsername(u) {
  return String(u || "").trim().toLowerCase();
}

// =========================================================
// POST /api/auth/login
// =========================================================
router.post("/login", (req, res) => {
  if (!mustHaveJwtSecret(res)) return;

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error" });
  }

  const username = normalizeUsername(parsed.data.username);
  const password = parsed.data.password;

  const user = db
    .prepare(
      "SELECT id, username, password_hash, role, email, phone, created_at FROM users WHERE username = ?"
    )
    .get(username);

  // ✅ log đúng chỗ (sau khi có user)
  console.log("LOGIN user from DB =", user ? { id: user.id, username: user.username, role: user.role } : null);

  if (!user) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
    },
  });
});


// =========================================================
// POST /api/auth/register
// - Tạo user mới (mặc định role = user)
// =========================================================
router.post("/register", (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: parsed.error.flatten() });
  }

  const username = normalizeUsername(parsed.data.username);
  const password = parsed.data.password;
  const email = parsed.data.email ? String(parsed.data.email).trim() : null;
  const phone = parsed.data.phone ? String(parsed.data.phone).trim() : null;

  // check tồn tại
  const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (exists) {
    return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  try {
    const info = db
      .prepare(
        "INSERT INTO users (username, password_hash, role, email, phone) VALUES (?, ?, 'user', ?, ?)"
      )
      .run(username, passwordHash, email, phone);

    const created = db
      .prepare(
        "SELECT id, username, role, email, phone, created_at FROM users WHERE id = ?"
      )
      .get(info.lastInsertRowid);

    return res.status(201).json({
      message: "Đăng ký thành công",
      user: created,
    });
  } catch (err) {
    // Unique constraint hoặc lỗi DB khác
    if (String(err?.message || "").includes("UNIQUE")) {
      return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });
    }
    console.error(err);
    return res.status(500).json({ message: "Register failed" });
  }
});

// =========================================================
// GET /api/auth/users
// - Admin xem danh sách user đã đăng ký
// =========================================================
router.get("/users", requireAuth, requireAdmin, (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, username, role, email, phone, created_at FROM users ORDER BY id DESC"
    )
    .all();

  res.json(rows);
});

// =========================================================
// PATCH /api/auth/users/:id/role
// - Admin đổi role user
// =========================================================
router.patch("/users/:id/role", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error" });
  }

  const nextRole = parsed.data.role;

  // Không cho tự hạ quyền (tránh lock chính mình)
  if (req.user?.id === id && nextRole !== "admin") {
    return res
      .status(400)
      .json({ message: "Không thể tự hạ quyền của chính mình" });
  }

  const target = db
    .prepare("SELECT id, username, role FROM users WHERE id = ?")
    .get(id);
  if (!target) return res.status(404).json({ message: "User not found" });

  // Không được làm mất admin cuối cùng
  if (target.role === "admin" && nextRole !== "admin") {
    const adminCount = db
      .prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'")
      .get()?.c;
    if (Number(adminCount) <= 1) {
      return res
        .status(400)
        .json({ message: "Không thể hạ quyền admin cuối cùng" });
    }
  }

  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(nextRole, id);

  const updated = db
    .prepare(
      "SELECT id, username, role, email, phone, created_at FROM users WHERE id = ?"
    )
    .get(id);

  return res.json({ message: "Cập nhật role thành công", user: updated });
});

// =========================================================
// DELETE /api/auth/users/:id
// - Admin xoá user
// =========================================================
router.delete("/users/:id", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  // Không cho tự xoá
  if (req.user?.id === id) {
    return res.status(400).json({ message: "Không thể tự xoá tài khoản" });
  }

  const target = db
    .prepare("SELECT id, username, role FROM users WHERE id = ?")
    .get(id);
  if (!target) return res.status(404).json({ message: "User not found" });

  // Không được xoá admin cuối cùng
  if (target.role === "admin") {
    const adminCount = db
      .prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'")
      .get()?.c;
    if (Number(adminCount) <= 1) {
      return res
        .status(400)
        .json({ message: "Không thể xoá admin cuối cùng" });
    }
  }

  const info = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  if (info.changes === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ message: "Đã xoá user", id });
});

module.exports = router;
