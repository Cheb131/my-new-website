const router = require("express").Router();
const itemController = require("../controllers/item.controller");

router.get("/items", itemController.getAll);
router.get("/items/:id", itemController.getById);
router.post("/items", itemController.create);

module.exports = router;
