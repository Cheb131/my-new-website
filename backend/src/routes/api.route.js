const express = require("express");
const router = express.Router();

const characterController = require("../controllers/character.controller");

// PUBLIC (ai cũng xem)
router.get("/characters/public", characterController.getPublic);
router.get("/characters/public/:id", characterController.getPublicById);

// CREATE (ai cũng đăng)
router.post("/characters", characterController.create);

// DELETE (ai cũng xoá)
router.delete("/characters/:id", characterController.remove);

module.exports = router;
