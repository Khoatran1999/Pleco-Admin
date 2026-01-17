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
    <aside className="hidden md:flex flex-col w-64 h-full bg-white border-r border-slate-200 transition-all shadow-sm">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
          <span className="material-symbols-outlined text-[28px] fill-1">
            set_meal
          </span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-900 leading-none tracking-tight">
            FishMarket
          </h1>
          <span className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
            Admin Panel
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-primary"
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">
              {item.icon}
            </span>
            <span className="text-sm font-semibold">{item.label}</span>
          </NavLink>
        ))}

        <div className="my-4 border-t border-slate-100"></div>

        <button
          onClick={() => navigate("/settings")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-500 hover:bg-slate-50 hover:text-primary`}
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
