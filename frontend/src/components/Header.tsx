import React from "react";
import { useNavigate } from "react-router-dom";

const Header: React.FC = React.memo(() => {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900/30 backdrop-blur-xl border-b border-cyan-500/10 sticky top-0 z-10 shadow-lg shadow-black/20">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden p-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer">
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="hidden sm:flex max-w-md w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-cyan-500 text-[20px]">
              search
            </span>
          </div>
          <input
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-700/50 rounded-xl bg-slate-800/50 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            placeholder="Search inventory, orders..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2.5 text-slate-400 hover:bg-slate-800/50 hover:text-cyan-400 rounded-xl transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[24px]">
            notifications
          </span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full border-2 border-slate-900 animate-pulse shadow-lg shadow-cyan-500/50"></span>
        </button>

        <div className="hidden md:block h-8 w-[1px] bg-slate-700/50 mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right hidden lg:flex">
            <span className="text-sm font-bold text-slate-100">
              Alex Morgan
            </span>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
              Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
