const express = require("express");
const inventoryController = require("../controllers/inventory.controller");
const { authenticate } = require("../middlewares/supabase-auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", inventoryController.getAll);
router.get("/total", inventoryController.getTotal);
router.get("/logs", inventoryController.getLogs);
router.get("/loss-logs", inventoryController.getLossLogs);
router.get("/fish/:fishId", inventoryController.getByFishId);
router.post("/adjust", inventoryController.adjustStock);
router.post("/record-loss", inventoryController.recordLoss);

module.exports = router;
