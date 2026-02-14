const express = require("express");
const router = express.Router();

const characterController = require("../controllers/character.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

// PUBLIC (ai cũng xem)
router.get("/characters/public", characterController.getPublic);
router.get("/characters/public/:id", characterController.getPublicById);

// CREATE (phải đăng nhập -> mới có created_by đúng user)
router.post("/characters", requireAuth, characterController.create);

// UPDATE (chỉ owner/admin - logic check nằm trong controller.update)
router.patch("/characters/:id", requireAuth, characterController.update);

// DELETE (chỉ owner/admin - logic check nằm trong controller.remove)
router.delete("/characters/:id", requireAuth, characterController.remove);

module.exports = router;
