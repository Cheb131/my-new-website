const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  next();
}

// ✅ mới: admin hoặc manager đều được
function requireManagerOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireManagerOrAdmin };
