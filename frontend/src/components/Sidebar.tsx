import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

interface SidebarProps {
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const navItems = [
    { to: "/", label: "Dashboard", icon: "dashboard" },
    { to: "/orders", label: "Orders", icon: "shopping_cart" },
    { to: "/inventory", label: "Inventory", icon: "inventory_2" },
    { to: "/imports", label: "Imports", icon: "file_upload" },
    { to: "/customers", label: "Customers", icon: "person" },
    { to: "/categories", label: "Categories", icon: "category" },
    { to: "/suppliers", label: "Suppliers", icon: "group" },
    { to: "/reports", label: "Reports", icon: "analytics" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-slate-900/90 backdrop-blur-xl border-r border-cyan-500/10 transition-all shadow-2xl shadow-cyan-500/5 relative z-20">
      {/* Glow effect */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent"></div>

      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
          <span className="material-symbols-outlined text-[28px] fill-1 text-white">
            set_meal
          </span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-white leading-none tracking-tight">
            FishMarket
          </h1>
          <span className="text-xs text-cyan-400 font-medium mt-1 uppercase tracking-wider">
            Pro Dashboard
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group cursor-pointer relative ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-cyan-300 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-sm"></div>
                )}
                <span className="material-symbols-outlined text-[20px] relative z-10">
                  {item.icon}
                </span>
                <span className="text-sm font-semibold relative z-10">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        <div className="my-4 border-t border-slate-800/50"></div>

        <button
          onClick={() => navigate("/settings")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-400 hover:bg-slate-800/50 hover:text-cyan-300 cursor-pointer`}
        >
          <span className="material-symbols-outlined text-[20px]">
            settings
          </span>
          <span className="text-sm font-semibold">Settings</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
