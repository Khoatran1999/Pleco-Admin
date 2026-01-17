const express = require("express");
const importOrderController = require("../controllers/importOrder.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", importOrderController.getAll);
router.get("/:id", importOrderController.getById);
router.post("/", importOrderController.create);
router.patch("/:id/status", importOrderController.updateStatus);
router.delete("/:id", importOrderController.delete);

module.exports = router;
