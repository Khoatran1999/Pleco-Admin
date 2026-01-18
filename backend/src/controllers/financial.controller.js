const Financial = require("../models/financial.model.supabase");

const financialController = {
  /**
   * GET /api/financial/kpis
   * Get financial KPIs (Revenue, Profit, Orders, Cash Balance)
   */
  async getKPIs(req, res, next) {
    try {
      const { days = 30 } = req.query;

      const kpis = await Financial.getKPIs({ days: parseInt(days) });

      res.json({
        success: true,
        data: kpis,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/financial/revenue-over-time
   * Get revenue trends over time
   */
  async getRevenueOverTime(req, res, next) {
    try {
      const { startDate, endDate, groupBy = "day", category_id } = req.query;

      const data = await Financial.getRevenueOverTime({
        startDate,
        endDate,
        groupBy,
        category_id,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/financial/orders-profit
   * Get orders count and profit over time
   */
  async getOrdersAndProfit(req, res, next) {
    try {
      const { startDate, endDate, groupBy = "day" } = req.query;

      const data = await Financial.getOrdersAndProfitOverTime({
        startDate,
        endDate,
        groupBy,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/financial/inventory-risk
   * Get inventory risk assessment
   */
  async getInventoryRisk(req, res, next) {
    try {
      const data = await Financial.getInventoryRisk();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/financial/cash-flow
   * Get cash flow data
   */
  async getCashFlow(req, res, next) {
    try {
      const { startDate, endDate, limit = 30 } = req.query;

      const data = await Financial.getCashFlow({
        startDate,
        endDate,
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/financial/top-products
   * Get top products by profit/revenue/quantity
   */
  async getTopProducts(req, res, next) {
    try {
      const { sortBy = "profit", limit = 10, category = "all" } = req.query;

      const data = await Financial.getTopProducts({
        sortBy,
        limit: parseInt(limit),
        category,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = financialController;
