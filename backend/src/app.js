require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const apiRoute = require("./routes/api.route");
const authRoute = require("./routes/auth.route"); 
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
}));
app.use(express.json());
app.use(morgan("dev"));

// ===== HEALTH CHECK =====
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ===== SERVE FRONTEND =====
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ===== API =====
app.use("/api", apiRoute);
app.use("/api/auth", authRoute); 
// ===== ERROR HANDLER =====
app.use(notFound);
app.use(errorHandler);

module.exports = app;
