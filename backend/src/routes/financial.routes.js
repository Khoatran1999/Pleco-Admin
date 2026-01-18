const express = require("express");
const router = express.Router();
const financialController = require("../controllers/financial.controller");
const { authenticate } = require("../middlewares/supabase-auth.middleware");

// All financial routes require authentication
router.use(authenticate);

// GET /api/financial/kpis
router.get("/kpis", financialController.getKPIs);

// GET /api/financial/revenue-over-time
router.get("/revenue-over-time", financialController.getRevenueOverTime);

// GET /api/financial/orders-profit
router.get("/orders-profit", financialController.getOrdersAndProfit);

// GET /api/financial/inventory-risk
router.get("/inventory-risk", financialController.getInventoryRisk);

// GET /api/financial/cash-flow
router.get("/cash-flow", financialController.getCashFlow);

// GET /api/financial/top-products
router.get("/top-products", financialController.getTopProducts);

module.exports = router;
