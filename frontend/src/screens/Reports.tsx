import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import formatCurrencyK from "../utils/format";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchReportSummary,
  fetchWeeklyRevenue,
  fetchSpeciesSales,
} from "../store/features/report/reportSlice";

const COLORS = [
  "#136dec",
  "#0ea5e9",
  "#07883b",
  "#94a3b8",
  "#f59e0b",
  "#ef4444",
];

const Reports: React.FC = () => {
  const dispatch = useAppDispatch();
  const { summary, weeklyRevenue, speciesSales, loading } = useAppSelector(
    (state) => state.report,
  );

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    dispatch(fetchReportSummary({ startDate, endDate }));
    dispatch(fetchWeeklyRevenue());
    dispatch(fetchSpeciesSales({ startDate, endDate }));
  }, [dispatch, startDate, endDate]);

  const revenueData = (weeklyRevenue || []).map((item) => ({
    name: item.day,
    revenue: Number(item.revenue),
  }));

  const pieData = (speciesSales || []).map((item, index) => ({
    name: item.name,
    value: Number(item.quantity),
    color: COLORS[index % COLORS.length],
  }));

  const safeSummary = summary || {};

  const totalSold = pieData.reduce((sum, item) => sum + item.value, 0);

  // Helper to format change percentages
  const formatChange = (value: number | undefined) => {
    if (value === undefined || value === null) return "N/A";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const changes = safeSummary.changes || {};

  const stats = [
    {
      label: "Total Revenue",
      value: `${formatCurrencyK(Number(safeSummary.total_revenue || 0))}`,
      change: formatChange(changes.revenue),
      changeValue: changes.revenue || 0,
      icon: "attach_money",
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      label: "Total Orders",
      value: safeSummary.total_orders?.toString() || "0",
      change: formatChange(changes.orders),
      changeValue: changes.orders || 0,
      icon: "shopping_cart",
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: "Fish Sold (pieces)",
      value: `${Number(safeSummary.total_quantity || 0).toFixed(0)} pieces`,
      change: formatChange(changes.quantity),
      changeValue: changes.quantity || 0,
      icon: "scale",
      bg: "bg-cyan-50",
      color: "text-cyan-600",
    },
    {
      label: "Avg Order Value",
      value: `${formatCurrencyK(Number(safeSummary.avg_order_value || 0))}`,
      change: formatChange(changes.avg_order_value),
      changeValue: changes.avg_order_value || 0,
      icon: "account_balance_wallet",
      bg: "bg-purple-50",
      color: "text-purple-600",
    },
  ];

  const handleExportCSV = () => {
    // Prepare CSV content
    const csvRows = [];

    // Header
    csvRows.push("FishMarket Pro - Sales Report");
    csvRows.push(`Date Range: ${startDate} to ${endDate}`);
    csvRows.push(`Generated: ${new Date().toLocaleString()}`);
    csvRows.push("");

    // Summary section
    csvRows.push("SUMMARY");
    csvRows.push("Metric,Value,Change vs Last Period");
    stats.forEach((stat) => {
      csvRows.push(
        `${stat.label},${stat.value.replace(/,/g, "")},${stat.change}`,
      );
    });
    csvRows.push("");

    // Revenue by day section
    csvRows.push("DAILY REVENUE (Last 7 Days)");
    csvRows.push("Day,Revenue");
    revenueData.forEach((item) => {
      csvRows.push(`${item.name},${formatCurrencyK(item.revenue)}`);
    });
    csvRows.push("");

    // Sales by species section
    csvRows.push("SALES BY SPECIES");
    csvRows.push("Species,Quantity Sold");
    pieData.forEach((item) => {
      csvRows.push(`${item.name},${item.value}`);
    });

    // Create and download file
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fishmarket-report-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Sales & Inventory Reports
          </h2>
          <p className="text-cyan-300 font-medium mt-1">
            Performance overview for the fish store.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl px-3 py-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm font-bold text-cyan-300 bg-transparent border-none focus:ring-0"
            />
            <span className="text-cyan-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm font-bold text-cyan-300 bg-transparent border-none focus:ring-0"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-2xl hover:shadow-cyan-500/30 transition-all shadow-lg shadow-cyan-500/20"
          >
            <span className="material-symbols-outlined text-[20px]">
              download
            </span>
            Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-cyan-500/20 shadow-sm hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-400/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest">
                    {stat.label}
                  </span>
                  <div
                    className={`p-2 ${stat.bg} ${stat.color} rounded-xl group-hover:scale-110 transition-transform`}
                  >
                    <span className="material-symbols-outlined text-[20px] fill-1">
                      {stat.icon}
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-black text-white tracking-tight">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      stat.changeValue >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {stat.changeValue >= 0 ? "trending_up" : "trending_down"}
                  </span>
                  <p
                    className={`text-xs font-bold ${
                      stat.changeValue >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {stat.change}{" "}
                    <span className="text-slate-400 font-normal ml-1">
                      vs last period
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-cyan-500/20 shadow-sm flex flex-col h-[400px] hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-white">
                  Revenue Trends (Last 7 Days)
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-cyan-500"></div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                      Revenue
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#1e293b"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "#1e293b" }}
                        contentStyle={{
                          borderRadius: "16px",
                          border: "1px solid rgba(6, 182, 212, 0.2)",
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          backdropFilter: "blur(12px)",
                          color: "#ffffff",
                        }}
                        labelStyle={{ color: "#06b6d4" }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#06b6d4"
                        radius={[6, 6, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No revenue data available
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-purple-500/20 shadow-sm flex flex-col h-[400px] hover:border-purple-400/40 hover:shadow-2xl hover:shadow-purple-500/20 transition-all">
              <h3 className="text-lg font-black text-white mb-6">
                Sales by Species
              </h3>
              <div className="flex-1 relative flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400">No sales data</div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900">
                    {totalSold}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    pieces sold
                  </span>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                {pieData.slice(0, 4).map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-slate-500">
                        {item.name} (
                        {totalSold > 0
                          ? ((item.value / totalSold) * 100).toFixed(0)
                          : 0}
                        %)
                      </span>
                    </div>
                    <span className="text-slate-900">{item.value} pieces</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
