require("dotenv").config();
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

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api", apiRoute);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
