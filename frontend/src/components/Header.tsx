import React from "react";
import { useNavigate } from "react-router-dom";

const Header: React.FC = React.memo(() => {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden p-2 text-slate-500 hover:text-primary">
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="hidden sm:flex max-w-md w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">
              search
            </span>
          </div>
          <input
            className="block w-full pl-10 pr-4 py-2.5 border-none rounded-xl bg-slate-100 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Search inventory, orders..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <span className="material-symbols-outlined text-[24px]">
            notifications
          </span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="hidden md:block h-8 w-[1px] bg-slate-200 mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right hidden lg:flex">
            <span className="text-sm font-bold text-slate-900">
              Alex Morgan
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
