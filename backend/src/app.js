require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const apiRoute = require("./routes/api.route");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
}));
app.use(express.json());
app.use(morgan("dev"));

// health
app.get("/health", (req, res) => res.json({ ok: true }));

// serve frontend
app.use(express.static(path.join(__dirname, "..", "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// api
app.use("/api", apiRoute);

// errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;
