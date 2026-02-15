const express = require("express");
const router = express.Router();

const characterController = require("../controllers/character.controller");

// ✅ BỎ ĐĂNG NHẬP: mọi API nhân vật đều PUBLIC

// Public list/detail (chỉ những nhân vật is_public=true)
router.get("/characters/public", characterController.getPublic);
router.get("/characters/public/:id", characterController.getPublicById);

// Full list/detail (tất cả nhân vật, kể cả is_public=false)
router.get("/characters", characterController.getAll);
router.get("/characters/:id", characterController.getById);

// CRUD (ai cũng tạo/sửa/xoá được)
router.post("/characters", characterController.create);
router.patch("/characters/:id", characterController.update);
router.delete("/characters/:id", characterController.remove);

module.exports = router;
