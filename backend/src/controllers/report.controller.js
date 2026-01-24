const Report = require("../models/report.model.supabase");

const reportController = {
  async getDashboardStats(req, res, next) {
    try {
      const statsResult = await Report.getDashboardStats();
      const stats = statsResult && statsResult.data ? statsResult.data : statsResult;

      // Calculate percentage changes
      const revenueChange =
        (stats.revenue && stats.revenue.last_week_revenue > 0)
          ? (
              ((stats.revenue.this_week_revenue - stats.revenue.last_week_revenue) /
                stats.revenue.last_week_revenue) *
              100
            ).toFixed(1)
          : 0;

      res.json({
        success: true,
        data: {
          revenue: {
            current: stats.revenue?.this_week_revenue || 0,
            previous: stats.revenue?.last_week_revenue || 0,
            change: parseFloat(revenueChange) || 0,
          },
          inventory: {
            total: stats.inventory?.total_inventory || 0,
            today_imports: stats.inventory?.today_imports || 0,
          },
          orders: {
            total: stats.orders?.total_orders || 0,
            pending: stats.orders?.pending_orders || 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getWeeklyRevenue(req, res, next) {
    try {
      const result = await Report.getWeeklyRevenue();
      const data = result && result.data ? result.data : result;

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSalesBySpecies(req, res, next) {
    try {
      const { limit } = req.query;
      const result = await Report.getSalesBySpecies(parseInt(limit) || 4);
      const raw = result && result.data ? result.data : result;

      // Assign colors
      const colors = ["#136dec", "#2dd4bf", "#818cf8", "#94a3b8"];
      const dataWithColors = (Array.isArray(raw) ? raw : []).map((item, index) => ({
        ...item,
        color: colors[index % colors.length],
      }));

      res.json({
        success: true,
        data: dataWithColors,
      });
    } catch (error) {
      next(error);
    }
  },

  async getReportSummary(req, res, next) {
    try {
      const { date_from, date_to } = req.query;

      if (!date_from || !date_to) {
        return res.status(400).json({
          success: false,
          message: "Date range is required (date_from and date_to).",
        });
      }

      const summaryResult = await Report.getReportSummaryWithComparison(
        date_from,
        date_to,
      );
      const summary = summaryResult && summaryResult.data ? summaryResult.data : summaryResult;

      const revenueByDateResult = await Report.getRevenueByDate(date_from, date_to);
      const revenueByDate = revenueByDateResult && revenueByDateResult.data ? revenueByDateResult.data : revenueByDateResult;

      res.json({
        success: true,
        data: {
          ...summary,
          revenue_by_date: revenueByDate,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = reportController;
