const express = require("express");

const fishRoutes = require("./fish.routes");
const categoryRoutes = require("./category.routes");
const inventoryRoutes = require("./inventory.routes");
const supplierRoutes = require("./supplier.routes");
const customerRoutes = require("./customer.routes");
const importOrderRoutes = require("./importOrder.routes");
const saleOrderRoutes = require("./saleOrder.routes");
const reportRoutes = require("./report.routes");

const router = express.Router();
router.use("/fishes", fishRoutes);
router.use("/categories", categoryRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/customers", customerRoutes);
router.use("/import-orders", importOrderRoutes);
router.use("/sale-orders", saleOrderRoutes);
router.use("/reports", reportRoutes);

module.exports = router;
