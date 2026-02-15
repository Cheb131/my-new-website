const jwt = require("jsonwebtoken");

function getTokenFromReq(req) {
  // 1) Authorization: Bearer <token>
  const auth = req.headers.authorization || req.headers.Authorization || "";
  if (typeof auth === "string" && auth.trim()) {
    const parts = auth.trim().split(/\s+/);
    if (parts.length === 2 && /^bearer$/i.test(parts[0])) return parts[1];
    // fallback: nếu client gửi thẳng token không có Bearer
    if (parts.length === 1) return parts[0];
  }

  // 2) x-access-token / token (fallback)
  const x = req.headers["x-access-token"] || req.headers["token"];
  if (typeof x === "string" && x.trim()) return x.trim();

  return "";
}

function requireAuth(req, res, next) {
  try {
    const token = getTokenFromReq(req);

    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Missing JWT_SECRET (env)" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // payload nên có: { id, role, username }
    req.user = payload;
    return next();
  } catch (err) {
    // DEBUG: in ra lý do để bạn biết chắc là sai secret hay sai token
    console.error("requireAuth verify failed:", err?.name, err?.message);
    return res.status(401).json({
      message: "Unauthorized",
      reason: err?.message || "verify_failed",
    });
  }
}

function requireAdmin(req, res, next) {
  const role = req.user?.role;
  if (role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
