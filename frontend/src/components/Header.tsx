import React from "react";

const Header: React.FC = React.memo(() => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-10 shadow-soft">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden p-2 text-text-secondary hover:text-primary-600 transition-colors cursor-pointer">
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="hidden sm:flex max-w-md w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-primary-500 text-[20px]">
              search
            </span>
          </div>
          <input
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-button bg-background-soft text-sm text-text-primary placeholder-text-muted focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all"
            placeholder="Search inventory, orders..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2.5 text-text-secondary hover:bg-background-muted hover:text-primary-600 rounded-button transition-all cursor-pointer">
          <span className="material-symbols-outlined text-[24px]">
            notifications
          </span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full border-2 border-white animate-soft-pulse"></span>
        </button>

        <div className="hidden md:block h-8 w-[1px] bg-slate-200 mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right hidden lg:flex">
            <span className="text-sm font-semibold text-text-primary">
              Alex Morgan
            </span>
            <span className="text-xs font-medium text-primary-600">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
