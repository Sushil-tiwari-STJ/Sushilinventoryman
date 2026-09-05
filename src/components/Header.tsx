import React from 'react';
import {
  LogIn,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  IndianRupee,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  onToggleMobileSidebar,
}) => {
  const { user, signIn, signOut } = useAuth();

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'AD';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-xs shrink-0 z-20">
      {/* Mobile Toggle & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="sleek-header-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products, SKU, HSN code, or Indian hub..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: India Badge, Refresh & User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* India Locale & Rupee Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
          <span className="text-sm leading-none" role="img" aria-label="India flag">
            🇮🇳
          </span>
          <span className="font-semibold text-[11px] tracking-wide">India (INR ₹)</span>
        </div>

        {/* Refresh button */}
        <button
          id="refresh-inventory-btn"
          type="button"
          onClick={onRefresh}
          title="Refresh PostgreSQL database"
          disabled={isRefreshing}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
        </button>

        {/* User profile widget */}
        {user ? (
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                {user.displayName || user.email?.split('@')[0] || 'Admin User'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-tight">
                Super Administrator
              </p>
            </div>

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full border border-indigo-200 object-cover shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 bg-indigo-100 rounded-full border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-xs">
                {getInitials(user.displayName, user.email)}
              </div>
            )}

            <button
              id="sign-out-btn"
              type="button"
              onClick={signOut}
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              id="sign-in-btn"
              type="button"
              onClick={signIn}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
