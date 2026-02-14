// routes/api.route.js
const express = require("express");
const router = express.Router();

const characterController = require("../controllers/character.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

// PUBLIC (ai cũng xem)
router.get("/characters/public", characterController.getPublic);
router.get("/characters/public/:id", characterController.getPublicById);

// AUTH detail (owner/admin xem full - kể cả không public)
router.get("/characters/:id", requireAuth, characterController.getById);

// CREATE (phải đăng nhập -> mới có created_by đúng user)
router.post("/characters", requireAuth, characterController.create);

// UPDATE (chỉ owner/admin)
router.patch("/characters/:id", requireAuth, characterController.update);

// DELETE (chỉ owner/admin)
router.delete("/characters/:id", requireAuth, characterController.remove);

module.exports = router;
