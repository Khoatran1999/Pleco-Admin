const db = require("../config/db");

const Report = {
  async getDashboardStats() {
    // Get revenue stats
    const [revenueStats] = await db.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN strftime('%Y%W', order_date) = strftime('%Y%W', 'now') THEN total_amount ELSE 0 END), 0) as this_week_revenue,
        COALESCE(SUM(CASE WHEN strftime('%Y%W', order_date) = strftime('%Y%W', DATE('now', '-7 days')) THEN total_amount ELSE 0 END), 0) as last_week_revenue
      FROM sale_orders
      WHERE status != 'cancelled'
    `);

    // Get inventory stats with today's imports
    const [inventoryStats] = await db.execute(`
      SELECT COALESCE(SUM(i.quantity), 0) as total_inventory
      FROM inventories i
      JOIN fishes f ON i.fish_id = f.id
      WHERE f.is_active = 1
    `);

    // Get today's import quantity (delivered imports)
    const [todayImports] = await db.execute(`
      SELECT COALESCE(SUM(ioi.quantity), 0) as today_imports
      FROM import_order_items ioi
      JOIN import_orders io ON ioi.import_order_id = io.id
      WHERE DATE(io.delivery_date) = DATE('now')
        AND io.status = 'delivered'
    `);

    // Get order stats
    const [orderStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders
      FROM sale_orders
      WHERE strftime('%Y%W', created_at) = strftime('%Y%W', 'now')
    `);

    return {
      revenue: revenueStats[0],
      inventory: {
        ...inventoryStats[0],
        today_imports: todayImports[0].today_imports,
      },
      orders: orderStats[0],
    };
  },

  async getWeeklyRevenue() {
    const [rows] = await db.execute(`
      SELECT 
        CASE strftime('%w', order_date)
          WHEN '0' THEN 'Sunday'
          WHEN '1' THEN 'Monday'
          WHEN '2' THEN 'Tuesday'
          WHEN '3' THEN 'Wednesday'
          WHEN '4' THEN 'Thursday'
          WHEN '5' THEN 'Friday'
          WHEN '6' THEN 'Saturday'
        END as name,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM sale_orders
      WHERE order_date >= DATE('now', '-7 days')
        AND status != 'cancelled'
      GROUP BY strftime('%w', order_date)
      ORDER BY strftime('%w', order_date)
    `);
    return rows;
  },

  async getSalesBySpecies(limit = 4) {
    const [rows] = await db.execute(
      `
      SELECT 
        f.name,
        COALESCE(SUM(soi.quantity), 0) as quantity_sold,
        ROUND((SUM(soi.quantity) / (SELECT SUM(quantity) FROM sale_order_items soi2 
          JOIN sale_orders so2 ON soi2.sale_order_id = so2.id WHERE so2.status != 'cancelled')) * 100, 0) as percentage
      FROM fishes f
      LEFT JOIN sale_order_items soi ON f.id = soi.fish_id
      LEFT JOIN sale_orders so ON soi.sale_order_id = so.id AND so.status != 'cancelled'
      WHERE f.is_active = 1
      GROUP BY f.id, f.name
      ORDER BY quantity_sold DESC
      LIMIT ?
    `,
      [limit]
    );
    return rows;
  },

  async getReportSummary(dateFrom, dateTo) {
    const [revenue] = await db.execute(
      `
      SELECT COALESCE(SUM(total_amount), 0) as total_revenue
      FROM sale_orders
      WHERE order_date BETWEEN ? AND ? AND status != 'cancelled'
    `,
      [dateFrom, dateTo]
    );

    const [orders] = await db.execute(
      `
      SELECT COUNT(*) as total_orders
      FROM sale_orders
      WHERE order_date BETWEEN ? AND ? AND status != 'cancelled'
    `,
      [dateFrom, dateTo]
    );

    const [quantitySold] = await db.execute(
      `
      SELECT COALESCE(SUM(soi.quantity), 0) as total_quantity
      FROM sale_order_items soi
      JOIN sale_orders so ON soi.sale_order_id = so.id
      WHERE so.order_date BETWEEN ? AND ? AND so.status != 'cancelled'
    `,
      [dateFrom, dateTo]
    );

    const [profit] = await db.execute(
      `
      SELECT COALESCE(SUM(soi.total_price - (soi.quantity * f.cost_price)), 0) as net_profit
      FROM sale_order_items soi
      JOIN sale_orders so ON soi.sale_order_id = so.id
      JOIN fishes f ON soi.fish_id = f.id
      WHERE so.order_date BETWEEN ? AND ? AND so.status != 'cancelled'
    `,
      [dateFrom, dateTo]
    );

    return {
      total_revenue: revenue[0].total_revenue,
      total_orders: orders[0].total_orders,
      total_quantity: quantitySold[0].total_quantity,
      net_profit: profit[0].net_profit,
    };
  },

  async getReportSummaryWithComparison(dateFrom, dateTo) {
    // Calculate period length in days
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    const periodDays =
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate previous period dates
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays + 1);

    const prevFrom = prevStartDate.toISOString().split("T")[0];
    const prevTo = prevEndDate.toISOString().split("T")[0];

    // Current period stats
    const current = await this.getReportSummary(dateFrom, dateTo);

    // Previous period stats
    const previous = await this.getReportSummary(prevFrom, prevTo);

    // Calculate avg order value for both periods
    const currentAvg =
      current.total_orders > 0
        ? current.total_revenue / current.total_orders
        : 0;
    const previousAvg =
      previous.total_orders > 0
        ? previous.total_revenue / previous.total_orders
        : 0;

    // Calculate percentage changes
    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      total_revenue: current.total_revenue,
      total_orders: current.total_orders,
      total_quantity: current.total_quantity,
      avg_order_value: currentAvg,
      changes: {
        revenue: calcChange(current.total_revenue, previous.total_revenue),
        orders: calcChange(current.total_orders, previous.total_orders),
        quantity: calcChange(current.total_quantity, previous.total_quantity),
        avg_order_value: calcChange(currentAvg, previousAvg),
      },
    };
  },

  async getRevenueByDate(dateFrom, dateTo) {
    const [rows] = await db.execute(
      `
      SELECT 
        CASE strftime('%w', order_date)
          WHEN '0' THEN 'Sun'
          WHEN '1' THEN 'Mon'
          WHEN '2' THEN 'Tue'
          WHEN '3' THEN 'Wed'
          WHEN '4' THEN 'Thu'
          WHEN '5' THEN 'Fri'
          WHEN '6' THEN 'Sat'
        END as name,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM sale_orders
      WHERE order_date BETWEEN ? AND ? AND status != 'cancelled'
      GROUP BY order_date
      ORDER BY order_date
    `,
      [dateFrom, dateTo]
    );
    return rows;
  },
};

module.exports = Report;
