const express = require("express");
const router = express.Router();

const characterController = require("../controllers/character.controller");

router.get("/characters/public", characterController.getPublic);
router.get("/characters/public/:id", characterController.getPublicById);
router.post("/characters", characterController.create);

module.exports = router;
