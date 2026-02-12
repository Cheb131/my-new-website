 const router = require("express").Router();
 
 const itemController = require("../controllers/item.controller");
const characterController = require("../controllers/character.controller");
 const { requireAuth, requireAdmin, requireManagerOrAdmin } = require("../middlewares/auth.middleware");
 
 router.get("/items", itemController.getAll);
 router.get("/items/:id", itemController.getById);
 
 // manager + admin được đăng
 router.post("/items", requireAuth, requireManagerOrAdmin, itemController.create);
 
 // admin toàn quyền chỉnh sửa
 router.put("/items/:id", requireAuth, requireAdmin, itemController.update);
 
 // admin toàn quyền xoá
 router.delete("/items/:id", requireAuth, requireAdmin, itemController.remove);
 

router.get("/characters", characterController.getAll);
router.post("/characters", requireAuth, requireAdmin, characterController.create);

 module.exports = router;
