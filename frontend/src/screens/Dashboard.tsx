import React, { useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import formatCurrencyK from "../utils/format";
import {
  fetchDashboardStats,
  fetchWeeklyRevenue,
  fetchSpeciesSales,
} from "../store/features/report/reportSlice";

interface DashboardProps {
  onAddOrder?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onAddOrder }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { dashboardStats, weeklyRevenue, speciesSales, loading } =
    useAppSelector((state) => state.report);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchWeeklyRevenue());
    dispatch(fetchSpeciesSales({ limit: 4 }));
  }, [dispatch]);

  const chartData = useMemo(
    () =>
      weeklyRevenue.length > 0
        ? weeklyRevenue
        : [
            { name: "Mon", revenue: 0 },
            { name: "Tue", revenue: 0 },
            { name: "Wed", revenue: 0 },
            { name: "Thu", revenue: 0 },
            { name: "Fri", revenue: 0 },
            { name: "Sat", revenue: 0 },
            { name: "Sun", revenue: 0 },
          ],
    [weeklyRevenue],
  );

  const speciesData = useMemo(() => {
    if (!speciesSales || speciesSales.length === 0) {
      return [{ name: "No Data", percentage: 100, color: "#94a3b8" }];
    }

    const total =
      speciesSales.reduce((s: number, it: any) => s + (it.quantity || 0), 0) ||
      1;

    return speciesSales.map((item: any, index: number) => ({
      name: item.name || "Unknown",
      percentage: Math.round(((item.quantity || 0) / total) * 100),
      color:
        item.color || ["#136dec", "#2dd4bf", "#818cf8", "#94a3b8"][index % 4],
    }));
  }, [speciesSales]);

  // Use K-format for currency display (e.g. 600.00 -> 600K)

  const handleExportReport = useCallback(() => {
    const csvRows = [];

    csvRows.push("FishMarket Pro - Dashboard Report");
    csvRows.push(`Generated: ${new Date().toLocaleString()}`);
    csvRows.push("");

    csvRows.push("SUMMARY");
    csvRows.push("Metric,Value");
    csvRows.push(
      `Total Revenue (This Week),${formatCurrencyK(
        dashboardStats?.revenue?.current || 0,
      )}`,
    );
    csvRows.push(
      `Total Revenue (Last Week),${formatCurrencyK(
        dashboardStats?.revenue?.previous || 0,
      )}`,
    );
    csvRows.push(`Revenue Change,${dashboardStats?.revenue?.change || 0}%`);
    csvRows.push(
      `Total Inventory,${Math.round(
        dashboardStats?.inventory?.total || 0,
      )} pieces`,
    );
    csvRows.push(
      `Today's Imports,${dashboardStats?.inventory?.today_imports || 0} pieces`,
    );
    csvRows.push(
      `Total Orders (This Week),${dashboardStats?.orders?.total || 0}`,
    );
    csvRows.push(`Pending Orders,${dashboardStats?.orders?.pending || 0}`);
    csvRows.push("");

    csvRows.push("WEEKLY REVENUE");
    csvRows.push("Day,Revenue");
    chartData.forEach((item) => {
      csvRows.push(`${item.name},${formatCurrencyK(Number(item.revenue))}`);
    });
    csvRows.push("");

    csvRows.push("TOP SELLING SPECIES");
    csvRows.push("Species,Percentage");
    speciesData.forEach((item) => {
      csvRows.push(`${item.name},${item.percentage}%`);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fishmarket-dashboard-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [dashboardStats, chartData, speciesData]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-card p-8 shadow-soft-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary-500 rounded-button shadow-soft">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-primary tracking-tight">
                Dashboard Overview
              </h2>
            </div>
            <p className="text-secondary text-lg font-medium">
              Welcome back, here's what's happening at FishMarket today.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportReport}
              className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-button text-sm font-bold text-secondary hover:bg-background-soft hover:border-primary-500 transition-all shadow-soft hover:shadow-soft-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Report
            </button>
            <button
              onClick={() => {
                if (onAddOrder) onAddOrder();
                else navigate("/orders/new");
              }}
              className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-primary-500 rounded-button text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-soft hover:shadow-soft-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Order
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="cursor-pointer group relative overflow-hidden bg-white rounded-card p-6 border border-slate-200 hover:border-primary-500 hover:shadow-soft-lg transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary-500 rounded-button shadow-soft group-hover:scale-110 transition-all">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div
                className={`flex items-center gap-1.5 text-xs font-bold ${
                  (dashboardStats?.revenue?.change || 0) >= 0
                    ? "text-secondary-600 bg-secondary-100 border border-secondary-200"
                    : "text-red-600 bg-red-100 border border-red-200"
                } px-3 py-1.5 rounded-full shadow-soft`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d={
                      (dashboardStats?.revenue?.change || 0) >= 0
                        ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    }
                  />
                </svg>
                <span>{Math.abs(dashboardStats?.revenue?.change || 0)}%</span>
              </div>
            </div>
            <h3 className="text-muted text-xs font-extrabold uppercase tracking-wider mb-2">
              Total Revenue
            </h3>
            <p className="text-4xl font-black text-primary mb-2">
              {formatCurrencyK(dashboardStats?.revenue?.current || 0)}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-secondary font-medium">Last 7 days</span>
              <span className="text-muted">•</span>
              <span className="text-muted font-medium">
                {formatCurrencyK(dashboardStats?.revenue?.previous || 0)} prev
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="cursor-pointer group relative overflow-hidden bg-white rounded-card p-6 border border-slate-200 hover:border-secondary-500 hover:shadow-soft-lg transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-secondary-500 rounded-button shadow-soft group-hover:scale-110 transition-all">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              {(dashboardStats?.inventory?.today_imports || 0) > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-600 bg-secondary-100 border border-secondary-200 px-3 py-1.5 rounded-full shadow-soft">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>+{dashboardStats?.inventory?.today_imports}</span>
                </div>
              )}
            </div>
            <h3 className="text-muted text-xs font-extrabold uppercase tracking-wider mb-2">
              Total Inventory
            </h3>
            <p className="text-4xl font-black text-primary mb-2">
              {Math.round(dashboardStats?.inventory?.total || 0)}
              <span className="text-xl font-bold text-muted ml-2">pcs</span>
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-secondary font-medium">
                {(dashboardStats?.inventory?.today_imports || 0) > 0
                  ? `${dashboardStats?.inventory?.today_imports} arrived today`
                  : "Current stock level"}
              </span>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="cursor-pointer group relative overflow-hidden bg-white rounded-card p-6 border border-slate-200 hover:border-accent-500 hover:shadow-soft-lg transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-accent-500 rounded-button shadow-soft group-hover:scale-110 transition-all">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent-600 bg-accent-100 border border-accent-200 px-3 py-1.5 rounded-full shadow-soft">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{dashboardStats?.orders?.pending || 0} Pending</span>
              </div>
            </div>
            <h3 className="text-muted text-xs font-extrabold uppercase tracking-wider mb-2">
              Total Orders
            </h3>
            <p className="text-4xl font-black text-primary mb-2">
              {dashboardStats?.orders?.total || 0}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-secondary font-medium">Last 7 days</span>
              <span className="text-muted">•</span>
              <span className="text-muted font-medium">
                {dashboardStats?.orders?.pending || 0} awaiting
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-card p-6 border border-slate-200 hover:border-primary-500 hover:shadow-soft-lg transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black text-primary">
                Revenue Overview
              </h3>
              <p className="text-sm text-secondary font-medium mt-1">
                Daily revenue for the past 7 days
              </p>
            </div>
            <select className="cursor-pointer bg-white border border-slate-200 text-xs font-bold rounded-button py-2.5 px-4 focus:ring-2 focus:ring-primary-500 text-secondary hover:bg-background-soft transition-colors">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 13, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    padding: "12px 16px",
                    backgroundColor: "#ffffff",
                  }}
                  labelStyle={{
                    color: "#1e293b",
                    fontWeight: 700,
                    fontSize: "13px",
                    marginBottom: "4px",
                  }}
                  itemStyle={{
                    color: "#3b82f6",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                  formatter={(value: number) => [
                    formatCurrencyK(Number(value)),
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  dot={{
                    fill: "#3b82f6",
                    strokeWidth: 2,
                    r: 4,
                    stroke: "#ffffff",
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#3b82f6",
                    stroke: "#ffffff",
                    strokeWidth: 3,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Selling Species */}
        <div className="bg-white rounded-card p-6 border border-slate-200 hover:border-accent-500 hover:shadow-soft-lg transition-all flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-black text-primary">
              Best Selling Species
            </h3>
            <p className="text-sm text-secondary font-medium mt-1">
              Top performers this week
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-6">
            {speciesData.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                className="space-y-3 group cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shadow-soft"
                      style={{
                        backgroundColor: item.color,
                      }}
                    ></div>
                    <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-black text-primary">
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-background-soft rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
