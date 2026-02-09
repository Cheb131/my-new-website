require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const apiRoute = require("./routes/api.route");
const authRoute = require("./routes/auth.route");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

/* ================= STATIC FRONTEND ================= */
// ⛔ PHẢI ĐẶT TRƯỚC API & notFound
const publicDir = path.resolve(__dirname, "../public");
console.log("STATIC DIR =", publicDir);

app.use(express.static(publicDir));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

/* ================= API ================= */
app.use("/api", apiRoute);
app.use("/api/auth", authRoute);

/* ================= ERROR ================= */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
