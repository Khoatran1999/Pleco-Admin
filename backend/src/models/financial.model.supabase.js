/**
 * Financial Model - Supabase Version
 * Handles financial metrics, profit calculations, and analytics
 */

const supabase = require("../config/supabase");
const { executeQuery } = require("../utils/supabase-query");

const Financial = {
  /**
   * Get KPI metrics (Revenue, Profit, Orders, Cash Balance)
   */
  async getKPIs(filters = {}) {
    const { days = 30 } = filters;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    return executeQuery(async () => {
      // Current period revenue
      const { data: currentRevenue } = await supabase
        .from("sale_orders")
        .select("total_amount")
        .eq("status", "completed")
        .gte("order_date", startDate.toISOString());

      const revenue =
        currentRevenue?.reduce(
          (sum, o) => sum + parseFloat(o.total_amount),
          0,
        ) || 0;

      // Previous period revenue
      const { data: previousRevenue } = await supabase
        .from("sale_orders")
        .select("total_amount")
        .eq("status", "completed")
        .gte("order_date", previousStartDate.toISOString())
        .lt("order_date", startDate.toISOString());

      const previousRevenueValue =
        previousRevenue?.reduce(
          (sum, o) => sum + parseFloat(o.total_amount),
          0,
        ) || 0;

      // Current period costs
      const { data: currentCosts } = await supabase
        .from("import_orders")
        .select("total_amount")
        .eq("status", "delivered")
        .gte("created_at", startDate.toISOString());

      const cost =
        currentCosts?.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) ||
        0;

      // Previous period costs
      const { data: previousCosts } = await supabase
        .from("import_orders")
        .select("total_amount")
        .eq("status", "delivered")
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      const previousCostValue =
        previousCosts?.reduce(
          (sum, o) => sum + parseFloat(o.total_amount),
          0,
        ) || 0;

      // Calculate profit
      const netProfit = revenue - cost;
      const previousProfit = previousRevenueValue - previousCostValue;

      // Orders count
      const { count: ordersCount } = await supabase
        .from("sale_orders")
        .select("*", { count: "exact", head: true })
        .gte("order_date", startDate.toISOString());

      const { count: previousOrdersCount } = await supabase
        .from("sale_orders")
        .select("*", { count: "exact", head: true })
        .gte("order_date", previousStartDate.toISOString())
        .lt("order_date", startDate.toISOString());

      // Cash balance (simplified: revenue - cost)
      const cashBalance = revenue - cost;

      // Average order value
      const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0;
      const previousAvgOrderValue =
        previousOrdersCount > 0
          ? previousRevenueValue / previousOrdersCount
          : 0;

      // Dead loss rate
      const { data: losses } = await supabase
        .from("inventory_logs")
        .select("quantity_change")
        .eq("type", "loss")
        .gte("created_at", startDate.toISOString());

      const totalLosses =
        losses?.reduce(
          (sum, l) => sum + Math.abs(parseFloat(l.quantity_change)),
          0,
        ) || 0;

      const { data: imports } = await supabase
        .from("inventory_logs")
        .select("quantity_change")
        .eq("type", "import")
        .gte("created_at", startDate.toISOString());

      const totalImports =
        imports?.reduce((sum, i) => sum + parseFloat(i.quantity_change), 0) ||
        0;

      const deadLossRate =
        totalImports > 0 ? (totalLosses / totalImports) * 100 : 0;

      // Calculate changes
      const revenueChange =
        previousRevenueValue > 0
          ? ((revenue - previousRevenueValue) / previousRevenueValue) * 100
          : 0;

      const profitChange =
        previousProfit > 0
          ? ((netProfit - previousProfit) / Math.abs(previousProfit)) * 100
          : 0;

      const ordersChange =
        previousOrdersCount > 0
          ? ((ordersCount - previousOrdersCount) / previousOrdersCount) * 100
          : 0;

      const avgOrderValueChange =
        previousAvgOrderValue > 0
          ? ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) *
            100
          : 0;

      return {
        data: {
          revenue: {
            current: revenue,
            previous: previousRevenueValue,
            change: revenueChange,
          },
          netProfit: {
            current: netProfit,
            previous: previousProfit,
            change: profitChange,
          },
          totalOrders: {
            current: ordersCount || 0,
            previous: previousOrdersCount || 0,
            change: ordersChange,
          },
          cashBalance: {
            current: cashBalance,
          },
          avgOrderValue: {
            current: avgOrderValue,
            previous: previousAvgOrderValue,
            change: avgOrderValueChange,
          },
          deadLossRate: {
            current: deadLossRate,
          },
        },
      };
    });
  },

  /**
   * Get revenue over time (daily/weekly/monthly aggregation)
   */
  async getRevenueOverTime(filters = {}) {
    const { startDate, endDate, groupBy = "day", category_id } = filters;

    return executeQuery(async () => {
      let query = supabase.rpc("get_revenue_over_time", {
        p_start_date: startDate,
        p_end_date: endDate,
        p_group_by: groupBy,
        p_category_id: category_id || null,
      });

      const { data, error } = await query;
      if (error) {
        // Fallback if RPC doesn't exist
        let salesQuery = supabase
          .from("sale_orders")
          .select(
            `
            order_date,
            total_amount,
            sale_order_items!inner (
              fishes (
                category_id
              )
            )
          `,
          )
          .eq("status", "completed");

        if (startDate) salesQuery = salesQuery.gte("order_date", startDate);
        if (endDate) salesQuery = salesQuery.lte("order_date", endDate);

        const { data: orders } = await salesQuery;

        // Group by date
        const grouped = {};
        orders?.forEach((order) => {
          const date = new Date(order.order_date);
          let key;

          if (groupBy === "month") {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          } else if (groupBy === "week") {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split("T")[0];
          } else {
            key = date.toISOString().split("T")[0];
          }

          if (!grouped[key]) {
            grouped[key] = 0;
          }
          grouped[key] += parseFloat(order.total_amount);
        });

        const result = Object.entries(grouped).map(([date, revenue]) => ({
          period: date,
          revenue,
        }));

        return { data: result };
      }

      return { data };
    });
  },

  /**
   * Get orders and profit over time
   */
  async getOrdersAndProfitOverTime(filters = {}) {
    const { startDate, endDate, groupBy = "day" } = filters;

    return executeQuery(async () => {
      // Get sales
      let salesQuery = supabase
        .from("sale_orders")
        .select("order_date, total_amount, id")
        .eq("status", "completed");

      if (startDate) salesQuery = salesQuery.gte("order_date", startDate);
      if (endDate) salesQuery = salesQuery.lte("order_date", endDate);

      const { data: sales } = await salesQuery;

      // Get costs
      let costsQuery = supabase
        .from("import_orders")
        .select("created_at, total_amount")
        .eq("status", "delivered");

      if (startDate) costsQuery = costsQuery.gte("created_at", startDate);
      if (endDate) costsQuery = costsQuery.lte("created_at", endDate);

      const { data: costs } = await costsQuery;

      // Group by period
      const grouped = {};

      sales?.forEach((sale) => {
        const date = new Date(sale.order_date);
        const key = this._getGroupKey(date, groupBy);

        if (!grouped[key]) {
          grouped[key] = { orders: 0, revenue: 0, cost: 0, profit: 0 };
        }
        grouped[key].orders += 1;
        grouped[key].revenue += parseFloat(sale.total_amount);
      });

      costs?.forEach((cost) => {
        const date = new Date(cost.created_at);
        const key = this._getGroupKey(date, groupBy);

        if (!grouped[key]) {
          grouped[key] = { orders: 0, revenue: 0, cost: 0, profit: 0 };
        }
        grouped[key].cost += parseFloat(cost.total_amount);
      });

      // Calculate profit
      Object.keys(grouped).forEach((key) => {
        grouped[key].profit = grouped[key].revenue - grouped[key].cost;
      });

      const result = Object.entries(grouped)
        .map(([period, data]) => ({
          period,
          ...data,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      return { data: result };
    });
  },

  /**
   * Get inventory risk assessment
   */
  async getInventoryRisk() {
    return executeQuery(async () => {
      const { data: inventory } = await supabase
        .from("inventories")
        .select(
          `
          *,
          fishes (
            id,
            sku,
            name,
            cost_price,
            fish_categories (
              name
            )
          )
        `,
        )
        .gt("quantity", 0);

      // Get loss history
      const { data: losses } = await supabase
        .from("inventory_logs")
        .select("fish_id, quantity_change, created_at")
        .eq("type", "loss");

      // Get import history
      const { data: imports } = await supabase
        .from("inventory_logs")
        .select("fish_id, quantity_change")
        .eq("type", "import");

      const riskData = inventory?.map((inv) => {
        const fish = inv.fishes;
        const daysInStock = Math.floor(
          (new Date() - new Date(inv.last_updated)) / (1000 * 60 * 60 * 24),
        );

        // Calculate risk level
        let riskLevel = "LOW";
        if (daysInStock > 30) riskLevel = "HIGH";
        else if (daysInStock > 14) riskLevel = "MEDIUM";

        // Calculate loss rate
        const fishLosses = losses?.filter((l) => l.fish_id === fish.id) || [];
        const fishImports = imports?.filter((i) => i.fish_id === fish.id) || [];

        const totalLosses = fishLosses.reduce(
          (sum, l) => sum + Math.abs(parseFloat(l.quantity_change)),
          0,
        );
        const totalImports = fishImports.reduce(
          (sum, i) => sum + parseFloat(i.quantity_change),
          0,
        );

        const lossRate =
          totalImports > 0 ? (totalLosses / totalImports) * 100 : 0;

        return {
          fish_id: fish.id,
          sku: fish.sku,
          name: fish.name,
          category: fish.fish_categories?.name || "Uncategorized",
          quantity: parseFloat(inv.quantity),
          days_in_stock: daysInStock,
          risk_level: riskLevel,
          estimated_loss_value:
            parseFloat(inv.quantity) * parseFloat(fish.cost_price),
          loss_rate: lossRate,
          total_losses: totalLosses,
        };
      });

      // Sort by risk level
      const sortedData = riskData?.sort((a, b) => {
        const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (
          riskOrder[a.risk_level] - riskOrder[b.risk_level] ||
          b.estimated_loss_value - a.estimated_loss_value
        );
      });

      // Calculate overall dead loss rate
      const overallLosses =
        losses?.reduce(
          (sum, l) => sum + Math.abs(parseFloat(l.quantity_change)),
          0,
        ) || 0;
      const overallImports =
        imports?.reduce((sum, i) => sum + parseFloat(i.quantity_change), 0) ||
        0;
      const overallLossRate =
        overallImports > 0 ? (overallLosses / overallImports) * 100 : 0;

      return {
        data: {
          items: sortedData || [],
          overall_loss_rate: overallLossRate,
        },
      };
    });
  },

  /**
   * Get cash flow data
   */
  async getCashFlow(filters = {}) {
    const { startDate, endDate, limit = 30 } = filters;

    return executeQuery(async () => {
      // Get sales (cash in)
      let salesQuery = supabase
        .from("sale_orders")
        .select("order_date, total_amount, order_number")
        .eq("status", "completed")
        .order("order_date", { ascending: false })
        .limit(limit);

      if (startDate) salesQuery = salesQuery.gte("order_date", startDate);
      if (endDate) salesQuery = salesQuery.lte("order_date", endDate);

      const { data: sales } = await salesQuery;

      // Get imports (cash out)
      let importsQuery = supabase
        .from("import_orders")
        .select("created_at, total_amount, order_number")
        .eq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (startDate) importsQuery = importsQuery.gte("created_at", startDate);
      if (endDate) importsQuery = importsQuery.lte("created_at", endDate);

      const { data: imports } = await importsQuery;

      // Combine and sort
      const transactions = [
        ...(sales?.map((s) => ({
          date: s.order_date,
          type: "CASH_IN",
          amount: parseFloat(s.total_amount),
          description: `Sale Order #${s.order_number}`,
        })) || []),
        ...(imports?.map((i) => ({
          date: i.created_at,
          type: "CASH_OUT",
          amount: -parseFloat(i.total_amount),
          description: `Import Order #${i.order_number}`,
        })) || []),
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate running balance
      let runningBalance = 0;
      const cashFlowData = transactions.map((t) => {
        runningBalance += t.amount;
        return {
          ...t,
          running_balance: runningBalance,
        };
      });

      return { data: cashFlowData };
    });
  },

  /**
   * Get top products by profit
   */
  async getTopProducts(filters = {}) {
    const { sortBy = "profit", limit = 10, category = "all" } = filters;

    return executeQuery(async () => {
      // Get all products with sales data
      const { data: products } = await supabase
        .from("fishes")
        .select(
          `
          id,
          sku,
          name,
          cost_price,
          retail_price,
          wholesale_price,
          fish_categories (
            name
          ),
          inventories (
            quantity
          )
        `,
        )
        .eq("is_active", true);

      // Get sales data
      const { data: salesItems } = await supabase
        .from("sale_order_items")
        .select(
          `
          fish_id,
          quantity,
          unit_price,
          total_price,
          sale_orders!inner (
            status
          )
        `,
        )
        .eq("sale_orders.status", "completed");

      // Get import costs
      const { data: importItems } = await supabase
        .from("import_order_items")
        .select(
          `
          fish_id,
          quantity,
          unit_price,
          import_orders!inner (
            status
          )
        `,
        )
        .eq("import_orders.status", "delivered");

      const enrichedProducts = products?.map((product) => {
        const sales = salesItems?.filter((s) => s.fish_id === product.id) || [];
        const imports =
          importItems?.filter((i) => i.fish_id === product.id) || [];

        const totalQuantitySold = sales.reduce(
          (sum, s) => sum + parseFloat(s.quantity),
          0,
        );
        const totalRevenue = sales.reduce(
          (sum, s) => sum + parseFloat(s.total_price),
          0,
        );

        const avgImportCost =
          imports.length > 0
            ? imports.reduce((sum, i) => sum + parseFloat(i.unit_price), 0) /
              imports.length
            : parseFloat(product.cost_price);

        const totalCost = totalQuantitySold * avgImportCost;
        const totalProfit = totalRevenue - totalCost;
        const profitMargin =
          totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        let performanceCategory = "NORMAL";
        if (totalQuantitySold === 0) performanceCategory = "NO_SALES";
        else if (profitMargin < 0) performanceCategory = "LOSS_MAKING";
        else if (totalQuantitySold < 5) performanceCategory = "SLOW_MOVING";
        else if (profitMargin > 50) performanceCategory = "HIGH_PROFIT";

        return {
          fish_id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.fish_categories?.name || "Uncategorized",
          quantity_sold: totalQuantitySold,
          revenue: totalRevenue,
          cost: totalCost,
          profit: totalProfit,
          profit_margin: profitMargin,
          current_stock: product.inventories?.quantity || 0,
          performance_category: performanceCategory,
        };
      });

      // Filter by category
      let filtered = enrichedProducts;
      if (category !== "all") {
        if (category === "profitable") {
          filtered = enrichedProducts?.filter(
            (p) => p.performance_category === "HIGH_PROFIT",
          );
        } else if (category === "slow") {
          filtered = enrichedProducts?.filter(
            (p) => p.performance_category === "SLOW_MOVING",
          );
        } else if (category === "loss") {
          filtered = enrichedProducts?.filter(
            (p) => p.performance_category === "LOSS_MAKING",
          );
        }
      }

      // Sort
      const sorted = filtered?.sort((a, b) => {
        if (sortBy === "profit") return b.profit - a.profit;
        if (sortBy === "revenue") return b.revenue - a.revenue;
        if (sortBy === "quantity") return b.quantity_sold - a.quantity_sold;
        if (sortBy === "margin") return b.profit_margin - a.profit_margin;
        return 0;
      });

      return { data: sorted?.slice(0, limit) || [] };
    });
  },

  /**
   * Helper: Get group key for date grouping
   */
  _getGroupKey(date, groupBy) {
    if (groupBy === "month") {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    } else if (groupBy === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().split("T")[0];
    }
    return date.toISOString().split("T")[0];
  },
};

module.exports = Financial;
