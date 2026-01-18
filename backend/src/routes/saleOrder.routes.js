const express = require("express");
const saleOrderController = require("../controllers/saleOrder.controller");
const { authenticate } = require("../middlewares/supabase-auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", saleOrderController.getAll);
router.get("/today", saleOrderController.getTodaySales);
router.get("/:id", saleOrderController.getById);
router.post("/", saleOrderController.create);
router.patch("/:id/status", saleOrderController.updateStatus);
router.patch("/:id", saleOrderController.update);

module.exports = router;
