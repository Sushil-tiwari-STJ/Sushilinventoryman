import React from 'react';
import {
  AlertTriangle,
  Boxes,
  History,
  LayoutDashboard,
  Package,
  Plus,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: 'all' | 'low-stock';
  onSelectTab: (tab: 'all' | 'low-stock') => void;
  onOpenHistory: () => void;
  onAddItem: () => void;
  lowStockCount: number;
  totalItemsCount: number;
  isLiveConnected: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenHistory,
  onAddItem,
  lowStockCount,
  totalItemsCount,
  isLiveConnected,
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-slate-900 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-lg shadow-sm">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-white font-semibold text-base tracking-tight block">
                  StockMaster
                </span>
                <span className="text-xs">🇮🇳</span>
              </div>
              <span className="text-[10px] text-indigo-400 uppercase tracking-wider block font-semibold">
                India Edition • ₹ INR
              </span>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onSelectTab('all');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="w-5 text-center flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-indigo-400" />
              </span>
              <span>Dashboard</span>
            </div>
            <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 font-mono">
              {totalItemsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('low-stock');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'low-stock'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="w-5 text-center flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </span>
              <span>Low Stock Alerts</span>
            </div>
            {lowStockCount > 0 && (
              <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[11px] font-bold text-rose-400">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenHistory();
              onCloseMobile();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <span className="w-5 text-center flex items-center justify-center">
              <History className="h-4 w-4 text-slate-400" />
            </span>
            <span>Audit Trail</span>
          </button>

          {/* Quick Action: New Product */}
          <div className="pt-4 mt-4 border-t border-slate-800/70">
            <button
              type="button"
              onClick={() => {
                onAddItem();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product (₹)</span>
            </button>
          </div>
        </nav>

        {/* Database Status at bottom */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 px-4 py-3 bg-emerald-900/30 rounded-lg border border-emerald-500/20">
            <div
              className={`w-2 h-2 rounded-full ${
                isLiveConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-emerald-400 text-xs font-medium">
                {isLiveConnected ? 'Database Connected' : 'Connecting DB...'}
              </span>
              <span className="text-[10px] text-emerald-500/80 font-mono">
                PostgreSQL • Live Sync
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
