const express = require("express");
const reportController = require("../controllers/report.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", reportController.getDashboardStats);
router.get("/weekly-revenue", reportController.getWeeklyRevenue);
router.get("/sales-by-species", reportController.getSalesBySpecies);
router.get("/summary", reportController.getReportSummary);

module.exports = router;
