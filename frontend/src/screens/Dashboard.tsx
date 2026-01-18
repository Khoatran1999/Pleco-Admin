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
    [weeklyRevenue]
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
        dashboardStats?.revenue?.current || 0
      )}`
    );
    csvRows.push(
      `Total Revenue (Last Week),${formatCurrencyK(
        dashboardStats?.revenue?.previous || 0
      )}`
    );
    csvRows.push(`Revenue Change,${dashboardStats?.revenue?.change || 0}%`);
    csvRows.push(
      `Total Inventory,${Math.round(
        dashboardStats?.inventory?.total || 0
      )} pieces`
    );
    csvRows.push(
      `Today's Imports,${dashboardStats?.inventory?.today_imports || 0} pieces`
    );
    csvRows.push(
      `Total Orders (This Week),${dashboardStats?.orders?.total || 0}`
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
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Welcome back, here's what's happening at FishMarket today.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              download
            </span>
            Export Report
          </button>
          <button
            onClick={() => {
              if (onAddOrder) onAddOrder();
              else navigate("/orders/new");
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/30"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px] fill-1">
                payments
              </span>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-bold ${
                (dashboardStats?.revenue?.change || 0) >= 0
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-red-600 bg-red-50"
              } px-2.5 py-1 rounded-full`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {(dashboardStats?.revenue?.change || 0) >= 0
                  ? "trending_up"
                  : "trending_down"}
              </span>
              <span>{dashboardStats?.revenue?.change || 0}%</span>
            </div>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            Total Revenue
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {formatCurrencyK(dashboardStats?.revenue?.current || 0)}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-2">
            Compared to{" "}
            {formatCurrencyK(dashboardStats?.revenue?.previous || 0)} last week
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px] fill-1">
                inventory_2
              </span>
            </div>
            {(dashboardStats?.inventory?.today_imports || 0) > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[16px]">
                  add_circle
                </span>
                <span>
                  +{dashboardStats?.inventory?.today_imports || 0} today
                </span>
              </div>
            )}
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            Total Inventory
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {Math.round(dashboardStats?.inventory?.total || 0)}{" "}
            <span className="text-lg font-normal text-slate-400">pieces</span>
          </p>
          <p className="text-xs text-slate-400 font-medium mt-2">
            {(dashboardStats?.inventory?.today_imports || 0) > 0
              ? `${dashboardStats?.inventory?.today_imports} pieces arrived today`
              : "Current stock level"}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px] fill-1">
                shopping_bag
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]">
                pending
              </span>
              <span>{dashboardStats?.orders?.pending || 0} Pending</span>
            </div>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            Total Orders
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {dashboardStats?.orders?.total || 0}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-2">This week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Revenue Overview
            </h3>
            <select className="bg-slate-50 border-none text-xs font-bold rounded-xl py-2 px-4 focus:ring-2 focus:ring-primary/20 text-slate-500 cursor-pointer">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#136dec" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#136dec" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number) => [
                    formatCurrencyK(Number(value)),
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#136dec"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Best Selling Species
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-6">
            {speciesData.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-900">{item.name}</span>
                  <span className="text-slate-400">{item.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
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
