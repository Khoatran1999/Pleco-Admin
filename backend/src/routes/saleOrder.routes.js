const express = require("express");
const saleOrderController = require("../controllers/saleOrder.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", saleOrderController.getAll);
router.get("/today", saleOrderController.getTodaySales);
router.get("/:id", saleOrderController.getById);
router.post("/", saleOrderController.create);
router.patch("/:id/status", saleOrderController.updateStatus);
router.patch("/:id", saleOrderController.update);

module.exports = router;
