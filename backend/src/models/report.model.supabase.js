/**
 * Report Model - Supabase Version
 * Handles analytics and reporting
 */

const supabase = require("../config/supabase");
const { executeQuery } = require("../utils/supabase-query");

const Report = {
  /**
   * Get dashboard summary
   */
  async getDashboardSummary(filters = {}) {
    return executeQuery(async () => {
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ).toISOString();

      // Total revenue (completed sales)
      let revenueQuery = supabase
        .from("sale_orders")
        .select("total_amount")
        .eq("status", "completed");

      if (filters.start_date) {
        revenueQuery = revenueQuery.gte("order_date", filters.start_date);
      } else {
        revenueQuery = revenueQuery.gte("order_date", startOfMonth);
      }

      if (filters.end_date) {
        revenueQuery = revenueQuery.lte("order_date", filters.end_date);
      }

      const { data: sales } = await revenueQuery;
      const totalRevenue =
        sales?.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) ||
        0;

      // Total orders
      const { count: totalOrders } = await supabase
        .from("sale_orders")
        .select("*", { count: "exact", head: true })
        .gte("order_date", filters.start_date || startOfMonth)
        .lte("order_date", filters.end_date || new Date().toISOString());

      // Low stock count
      const { data: inventories } = await supabase.from("inventories").select(`
          quantity,
          fishes (min_stock)
        `);

      const lowStockCount =
        inventories?.filter((inv) => {
          const qty = inv.quantity || 0;
          const minStock = inv.fishes?.min_stock || 10;
          return qty > 0 && qty <= minStock;
        }).length || 0;

      // Pending orders
      const { count: pendingOrders } = await supabase
        .from("sale_orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "processing"]);

      // Today's sales
      const { data: todaySales } = await supabase
        .from("sale_orders")
        .select("total_amount")
        .eq("status", "completed")
        .gte("order_date", today);

      const todayRevenue =
        todaySales?.reduce(
          (sum, sale) => sum + parseFloat(sale.total_amount),
          0,
        ) || 0;

      return {
        data: {
          total_revenue: totalRevenue,
          total_orders: totalOrders || 0,
          low_stock_items: lowStockCount,
          pending_orders: pendingOrders || 0,
          today_revenue: todayRevenue,
        },
      };
    });
  },

  /**
   * Get sales report
   */
  async getSalesReport(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("sale_orders").select(`
          id,
          order_number,
          order_date,
          status,
          sale_type,
          subtotal,
          discount_amount,
          total_amount,
          payment_method,
          customers (name, customer_type)
        `);

      if (filters.start_date) {
        query = query.gte("order_date", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("order_date", filters.end_date);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.sale_type) {
        query = query.eq("sale_type", filters.sale_type);
      }

      query = query.order("order_date", { ascending: false });

      const { data: orders } = await query;

      // Calculate summary
      const summary = {
        total_orders: orders?.length || 0,
        total_revenue: 0,
        total_discount: 0,
        retail_orders: 0,
        wholesale_orders: 0,
        retail_revenue: 0,
        wholesale_revenue: 0,
      };

      orders?.forEach((order) => {
        if (order.status === "completed") {
          summary.total_revenue += parseFloat(order.total_amount);
          summary.total_discount += parseFloat(order.discount_amount);

          if (order.sale_type === "retail") {
            summary.retail_orders++;
            summary.retail_revenue += parseFloat(order.total_amount);
          } else {
            summary.wholesale_orders++;
            summary.wholesale_revenue += parseFloat(order.total_amount);
          }
        }
      });

      return {
        data: {
          orders,
          summary,
        },
      };
    });
  },

  /**
   * Get inventory report
   */
  async getInventoryReport(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("inventories").select(`
          *,
          fishes (
            id,
            sku,
            name,
            size,
            min_stock,
            unit,
            retail_price,
            cost_price,
            fish_categories (name)
          )
        `);

      const { data: inventories } = await query;

      const report =
        inventories?.map((inv) => {
          const fish = inv.fishes;
          const qty = inv.quantity || 0;
          const minStock = fish?.min_stock || 10;

          let status = "Out of Stock";
          if (qty > 0 && qty <= minStock) {
            status = "Low Stock";
          } else if (qty > minStock) {
            status = "In Stock";
          }

          const stockValue = qty * (parseFloat(fish?.retail_price) || 0);
          const stockCost = qty * (parseFloat(fish?.cost_price) || 0);

          return {
            fish_id: fish?.id,
            sku: fish?.sku,
            name: fish?.name,
            size: fish?.size,
            category: fish?.fish_categories?.name,
            quantity: qty,
            min_stock: minStock,
            unit: fish?.unit,
            status,
            retail_price: fish?.retail_price,
            cost_price: fish?.cost_price,
            stock_value: stockValue,
            stock_cost: stockCost,
            last_updated: inv.last_updated,
          };
        }) || [];

      // Calculate summary
      const summary = {
        total_items: report.reduce((sum, item) => sum + item.quantity, 0),
        total_value: report.reduce((sum, item) => sum + item.stock_value, 0),
        total_cost: report.reduce((sum, item) => sum + item.stock_cost, 0),
        in_stock: report.filter((item) => item.status === "In Stock").length,
        low_stock: report.filter((item) => item.status === "Low Stock").length,
        out_of_stock: report.filter((item) => item.status === "Out of Stock")
          .length,
        total_products: report.length,
      };

      // Apply status filter
      let filteredReport = report;
      if (filters.status) {
        filteredReport = report.filter(
          (item) => item.status === filters.status,
        );
      }

      return {
        data: {
          inventory: filteredReport,
          summary,
        },
      };
    });
  },

  /**
   * Get top selling products
   */
  async getTopSellingProducts(filters = {}) {
    return executeQuery(async () => {
      const limit = filters.limit || 10;

      let dateFilter = "";
      if (filters.start_date && filters.end_date) {
        dateFilter = `AND so.order_date >= '${filters.start_date}' AND so.order_date <= '${filters.end_date}'`;
      }

      // Use raw SQL for complex aggregation
      const { data, error } = await supabase.rpc("get_top_selling_products", {
        date_from: filters.start_date || "1900-01-01",
        date_to: filters.end_date || "2100-12-31",
        result_limit: limit,
      });

      if (error) {
        // Fallback: manual aggregation
        const { data: items } = await supabase.from("sale_order_items").select(`
            fish_id,
            quantity,
            total_price,
            sale_orders!inner (
              status,
              order_date
            ),
            fishes (
              name,
              sku,
              size,
              image
            )
          `);

        // Group by fish_id
        const grouped = {};
        items?.forEach((item) => {
          if (item.sale_orders.status !== "completed") return;

          if (
            filters.start_date &&
            item.sale_orders.order_date < filters.start_date
          )
            return;
          if (
            filters.end_date &&
            item.sale_orders.order_date > filters.end_date
          )
            return;

          if (!grouped[item.fish_id]) {
            grouped[item.fish_id] = {
              fish_id: item.fish_id,
              name: item.fishes?.name,
              sku: item.fishes?.sku,
              size: item.fishes?.size,
              image: item.fishes?.image,
              total_quantity: 0,
              total_revenue: 0,
              order_count: 0,
            };
          }

          grouped[item.fish_id].total_quantity += parseFloat(item.quantity);
          grouped[item.fish_id].total_revenue += parseFloat(item.total_price);
          grouped[item.fish_id].order_count++;
        });

        // Sort by quantity and take top N
        const sortedData = Object.values(grouped)
          .sort((a, b) => b.total_quantity - a.total_quantity)
          .slice(0, limit);

        return { data: sortedData };
      }

      return { data };
    });
  },

  /**
   * Get revenue by period (daily, monthly)
   */
  async getRevenueByPeriod(filters = {}) {
    return executeQuery(async () => {
      const period = filters.period || "daily"; // daily, monthly

      let query = supabase
        .from("sale_orders")
        .select("order_date, total_amount, status");

      if (filters.start_date) {
        query = query.gte("order_date", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("order_date", filters.end_date);
      }

      query = query.eq("status", "completed");
      query = query.order("order_date");

      const { data: orders } = await query;

      // Group by period
      const grouped = {};

      orders?.forEach((order) => {
        let key;
        const date = new Date(order.order_date);

        if (period === "monthly") {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        } else {
          key = order.order_date.split("T")[0];
        }

        if (!grouped[key]) {
          grouped[key] = {
            period: key,
            revenue: 0,
            orders: 0,
          };
        }

        grouped[key].revenue += parseFloat(order.total_amount);
        grouped[key].orders++;
      });

      const data = Object.values(grouped).sort((a, b) =>
        a.period.localeCompare(b.period),
      );

      return { data };
    });
  },

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(filters = {}) {
    return executeQuery(async () => {
      let query = supabase
        .from("customers")
        .select(
          `
          id,
          name,
          customer_type,
          phone,
          email
        `,
        )
        .eq("is_active", true);

      const { data: customers } = await query;

      // Get orders for each customer
      const customerData = await Promise.all(
        customers?.map(async (customer) => {
          const { data: orders } = await supabase
            .from("sale_orders")
            .select("total_amount, status")
            .eq("customer_id", customer.id);

          const totalOrders = orders?.length || 0;
          const totalRevenue =
            orders
              ?.filter((o) => o.status === "completed")
              .reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0;

          return {
            ...customer,
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            average_order_value:
              totalOrders > 0 ? totalRevenue / totalOrders : 0,
          };
        }) || [],
      );

      // Sort by revenue
      const sorted = customerData.sort(
        (a, b) => b.total_revenue - a.total_revenue,
      );

      return { data: sorted };
    });
  },

  /**
   * Get inventory value report
   */
  async getInventoryValue() {
    return executeQuery(async () => {
      const { data: inventories } = await supabase.from("inventories").select(`
          quantity,
          fishes (
            retail_price,
            cost_price,
            fish_categories (name)
          )
        `);

      let totalRetailValue = 0;
      let totalCostValue = 0;
      const byCategory = {};

      inventories?.forEach((inv) => {
        const qty = inv.quantity || 0;
        const retailPrice = parseFloat(inv.fishes?.retail_price) || 0;
        const costPrice = parseFloat(inv.fishes?.cost_price) || 0;
        const category = inv.fishes?.fish_categories?.name || "Uncategorized";

        totalRetailValue += qty * retailPrice;
        totalCostValue += qty * costPrice;

        if (!byCategory[category]) {
          byCategory[category] = {
            category,
            retail_value: 0,
            cost_value: 0,
          };
        }

        byCategory[category].retail_value += qty * retailPrice;
        byCategory[category].cost_value += qty * costPrice;
      });

      return {
        data: {
          total_retail_value: totalRetailValue,
          total_cost_value: totalCostValue,
          potential_profit: totalRetailValue - totalCostValue,
          by_category: Object.values(byCategory),
        },
      };
    });
  },

  /**
   * Get dashboard stats (for Dashboard screen)
   */
  async getDashboardStats() {
    return executeQuery(async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      // Rolling 7-day windows for better UX
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Last 7 days revenue (including today)
      const { data: last7DaysSales } = await supabase
        .from("sale_orders")
        .select("total_amount")
        .eq("status", "completed")
        .gte("order_date", sevenDaysAgo.toISOString().split("T")[0])
        .lte("order_date", todayStr);

      const this_week_revenue =
        last7DaysSales?.reduce(
          (sum, sale) => sum + parseFloat(sale.total_amount),
          0,
        ) || 0;

      // Previous 7 days revenue (8-14 days ago)
      const { data: prev7DaysSales } = await supabase
        .from("sale_orders")
        .select("total_amount")
        .eq("status", "completed")
        .gte("order_date", fourteenDaysAgo.toISOString().split("T")[0])
        .lt("order_date", sevenDaysAgo.toISOString().split("T")[0]);

      const last_week_revenue =
        prev7DaysSales?.reduce(
          (sum, sale) => sum + parseFloat(sale.total_amount),
          0,
        ) || 0;

      // Total inventory
      const { data: inventories } = await supabase
        .from("inventories")
        .select("quantity, fishes!inner(is_active)")
        .eq("fishes.is_active", true);

      const total_inventory =
        inventories?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;

      // Today's imports
      const { data: todayImports } = await supabase
        .from("import_order_items")
        .select("quantity, import_orders!inner(delivery_date, status)")
        .eq("import_orders.status", "delivered")
        .gte("import_orders.delivery_date", todayStr);

      const today_imports =
        todayImports?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

      // Last 7 days orders
      const { data: last7DaysOrders, count: total_orders } = await supabase
        .from("sale_orders")
        .select("status", { count: "exact" })
        .gte("order_date", sevenDaysAgo.toISOString().split("T")[0])
        .lte("order_date", todayStr);

      const pending_orders =
        last7DaysOrders?.filter((order) => order.status === "pending").length ||
        0;

      return {
        data: {
          revenue: {
            this_week_revenue,
            last_week_revenue,
          },
          inventory: {
            total_inventory,
            today_imports,
          },
          orders: {
            total_orders: total_orders || 0,
            pending_orders,
          },
        },
      };
    });
  },

  /**
   * Get weekly revenue (last 7 days)
   */
  async getWeeklyRevenue() {
    return executeQuery(async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split("T")[0]);
      }

      const revenueData = await Promise.all(
        days.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          const { data: sales } = await supabase
            .from("sale_orders")
            .select("total_amount")
            .eq("status", "completed")
            .gte("order_date", date)
            .lt("order_date", nextDay.toISOString().split("T")[0]);

          const revenue =
            sales?.reduce(
              (sum, sale) => sum + parseFloat(sale.total_amount),
              0,
            ) || 0;

          return {
            date,
            day: new Date(date).toLocaleDateString("en-US", {
              weekday: "short",
            }),
            revenue,
          };
        }),
      );

      return { data: revenueData };
    });
  },

  /**
   * Get sales by species (top selling fish categories)
   */
  async getSalesBySpecies(limit = 4) {
    return executeQuery(async () => {
      // Get all sale order items with fish and category info
      const { data: items } = await supabase
        .from("sale_order_items")
        .select(
          `
          quantity,
          total_price,
          sale_orders!inner (status),
          fishes!inner (
            name,
            fish_categories (id, name)
          )
        `,
        )
        .eq("sale_orders.status", "completed");

      // Group by category
      const categoryStats = {};

      items?.forEach((item) => {
        const categoryName = item.fishes?.fish_categories?.name || "Other";

        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = {
            name: categoryName,
            quantity: 0,
            revenue: 0,
          };
        }

        categoryStats[categoryName].revenue += parseFloat(item.total_price);
        categoryStats[categoryName].quantity += parseFloat(item.quantity);
      });

      // Sort by quantity and take top N
      const topCategories = Object.values(categoryStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit)
        .map((cat) => ({
          name: cat.name,
          quantity: Math.round(cat.quantity),
          revenue: Math.round(cat.revenue),
        }));

      return { data: topCategories };
    });
  },

  /**
   * Get report summary with comparison to previous period
   */
  async getReportSummaryWithComparison(startDate, endDate) {
    return executeQuery(async () => {
      // Calculate period length
      const start = new Date(startDate);
      const end = new Date(endDate);
      const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // Previous period dates
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - periodDays + 1);

      // Current period stats
      const { data: currentOrders } = await supabase
        .from("sale_orders")
        .select("total_amount, status")
        .gte("order_date", startDate)
        .lte("order_date", endDate);

      const { data: currentItems } = await supabase
        .from("sale_order_items")
        .select(
          `
          quantity,
          sale_orders!inner(order_date, status)
        `,
        )
        .gte("sale_orders.order_date", startDate)
        .lte("sale_orders.order_date", endDate)
        .eq("sale_orders.status", "completed");

      // Previous period stats
      const { data: prevOrders } = await supabase
        .from("sale_orders")
        .select("total_amount, status")
        .gte("order_date", prevStart.toISOString().split("T")[0])
        .lte("order_date", prevEnd.toISOString().split("T")[0]);

      const { data: prevItems } = await supabase
        .from("sale_order_items")
        .select(
          `
          quantity,
          sale_orders!inner(order_date, status)
        `,
        )
        .gte("sale_orders.order_date", prevStart.toISOString().split("T")[0])
        .lte("sale_orders.order_date", prevEnd.toISOString().split("T")[0])
        .eq("sale_orders.status", "completed");

      // Calculate current metrics
      const currentRevenue =
        currentOrders
          ?.filter((o) => o.status === "completed")
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0;
      const currentOrderCount = currentOrders?.length || 0;
      const currentQuantity =
        currentItems?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
      const currentAvgOrder =
        currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;

      // Calculate previous metrics
      const prevRevenue =
        prevOrders
          ?.filter((o) => o.status === "completed")
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0;
      const prevOrderCount = prevOrders?.length || 0;
      const prevQuantity =
        prevItems?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
      const prevAvgOrder =
        prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0;

      // Calculate percentage changes
      const revenueChange =
        prevRevenue > 0
          ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
          : 0;
      const ordersChange =
        prevOrderCount > 0
          ? ((currentOrderCount - prevOrderCount) / prevOrderCount) * 100
          : 0;
      const quantityChange =
        prevQuantity > 0
          ? ((currentQuantity - prevQuantity) / prevQuantity) * 100
          : 0;
      const avgOrderChange =
        prevAvgOrder > 0
          ? ((currentAvgOrder - prevAvgOrder) / prevAvgOrder) * 100
          : 0;

      return {
        data: {
          total_revenue: currentRevenue,
          total_orders: currentOrderCount,
          total_quantity: currentQuantity,
          avg_order_value: currentAvgOrder,
          changes: {
            revenue: parseFloat(revenueChange.toFixed(1)),
            orders: parseFloat(ordersChange.toFixed(1)),
            quantity: parseFloat(quantityChange.toFixed(1)),
            avg_order_value: parseFloat(avgOrderChange.toFixed(1)),
          },
        },
      };
    });
  },

  /**
   * Get revenue by date for chart
   */
  async getRevenueByDate(startDate, endDate) {
    return executeQuery(async () => {
      const { data: orders } = await supabase
        .from("sale_orders")
        .select("order_date, total_amount")
        .eq("status", "completed")
        .gte("order_date", startDate)
        .lte("order_date", endDate)
        .order("order_date");

      // Group by date
      const grouped = {};
      orders?.forEach((order) => {
        const date = order.order_date.split("T")[0];
        if (!grouped[date]) {
          grouped[date] = {
            date,
            revenue: 0,
          };
        }
        grouped[date].revenue += parseFloat(order.total_amount);
      });

      return { data: Object.values(grouped) };
    });
  },
};

module.exports = Report;
