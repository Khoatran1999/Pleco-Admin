import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

interface SidebarProps {
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = () => {
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
    <aside className="hidden md:flex flex-col w-64 h-full bg-white/98 backdrop-blur-md border-r border-slate-200/80 transition-all shadow-soft-lg relative z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-11 h-11 rounded-card bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-soft">
          <span className="material-symbols-outlined text-[28px] fill-1 text-white">
            set_meal
          </span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-text-primary leading-none">
            FishMarket
          </h1>
          <span className="text-xs text-primary-600 font-medium mt-0.5">
            Pro Dashboard
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-button transition-all group cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 shadow-soft border border-primary-100"
                  : "text-text-secondary hover:bg-background-muted hover:text-primary-600"
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">
              {item.icon}
            </span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        <div className="my-3 border-t border-slate-200"></div>

        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-3 px-4 py-3 rounded-button transition-all text-text-secondary hover:bg-background-muted hover:text-primary-600 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">
            settings
          </span>
          <span className="text-sm font-medium">Settings</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
