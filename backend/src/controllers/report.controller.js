const Report = require("../models/report.model");

const reportController = {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await Report.getDashboardStats();

      // Calculate percentage changes
      const revenueChange =
        stats.revenue.last_week_revenue > 0
          ? (
              ((stats.revenue.this_week_revenue -
                stats.revenue.last_week_revenue) /
                stats.revenue.last_week_revenue) *
              100
            ).toFixed(1)
          : 0;

      res.json({
        success: true,
        data: {
          revenue: {
            current: stats.revenue.this_week_revenue,
            previous: stats.revenue.last_week_revenue,
            change: parseFloat(revenueChange),
          },
          inventory: {
            total: stats.inventory.total_inventory,
            today_imports: stats.inventory.today_imports,
          },
          orders: {
            total: stats.orders.total_orders,
            pending: stats.orders.pending_orders,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getWeeklyRevenue(req, res, next) {
    try {
      const data = await Report.getWeeklyRevenue();

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
      const data = await Report.getSalesBySpecies(parseInt(limit) || 4);

      // Assign colors
      const colors = ["#136dec", "#2dd4bf", "#818cf8", "#94a3b8"];
      const dataWithColors = data.map((item, index) => ({
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

      const summary = await Report.getReportSummaryWithComparison(
        date_from,
        date_to
      );
      const revenueByDate = await Report.getRevenueByDate(date_from, date_to);

      res.json({
        success: true,
        data: {
          summary,
          revenue_by_date: revenueByDate,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = reportController;
