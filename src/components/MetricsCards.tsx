import React, { useState } from 'react';
import { IndianRupee, Layers } from 'lucide-react';
import { InventoryMetrics } from '../types.ts';
import { formatRupees, formatRupeeDenomination } from '../lib/currency.ts';

interface MetricsCardsProps {
  metrics: InventoryMetrics;
  isFilterLowStock: boolean;
  onToggleLowStock: () => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  isFilterLowStock,
  onToggleLowStock,
}) => {
  // Toggle between Indian Compact (Lakhs/Crores) and Full Standard Notation
  const [useCompactRupees, setUseCompactRupees] = useState(true);

  const numVal = parseFloat(metrics.totalValue || '0');
  const denomination = formatRupeeDenomination(numVal);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Total Items */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
          Total Products
        </p>
        <h3 className="text-2xl font-bold text-slate-900">
          {metrics.totalItems.toLocaleString('en-IN')}
        </h3>
        <p className="text-emerald-600 text-xs mt-2 font-medium flex items-center gap-1">
          <span>↑ 2.4%</span>
          <span className="text-slate-400 font-normal">active Indian catalog</span>
        </p>
      </div>

      {/* Low Stock Alert */}
      <div
        onClick={onToggleLowStock}
        className={`bg-white p-5 rounded-2xl border cursor-pointer shadow-xs hover:shadow-sm transition-all ${
          isFilterLowStock
            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
            : 'border-slate-200 hover:border-rose-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Low Stock Alert
          </p>
          {isFilterLowStock && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              Filtered
            </span>
          )}
        </div>
        <h3
          className={`text-2xl font-bold ${
            metrics.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}
        >
          {metrics.lowStockCount}
        </h3>
        <p
          className={`text-xs mt-2 ${
            metrics.lowStockCount > 0 ? 'text-rose-500 font-medium' : 'text-slate-400'
          }`}
        >
          {metrics.lowStockCount > 0
            ? 'Reorder required for hubs'
            : 'All stock levels optimal'}
        </p>
      </div>

      {/* Inventory Value (INR ₹) with Lakhs/Crores switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all relative group">
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>Inventory Value (INR)</span>
          </p>
          <button
            type="button"
            onClick={() => setUseCompactRupees(!useCompactRupees)}
            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors"
            title="Switch between Lakhs/Crores and standard Rupee notation"
          >
            {useCompactRupees ? '₹ Lakhs/Cr' : '₹ Full'}
          </button>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1">
          {useCompactRupees ? (
            <span>{formatRupees(metrics.totalValue, { compact: true })}</span>
          ) : (
            <span>{formatRupees(metrics.totalValue, { compact: false })}</span>
          )}
        </h3>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono">
            {useCompactRupees ? formatRupees(metrics.totalValue, { compact: false }) : `${denomination.label} format`}
          </span>
          <span className="inline-flex items-center text-[10px] font-medium text-slate-400">
            🇮🇳 INR
          </span>
        </div>
      </div>

      {/* Units in Stock */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
          Units in Warehouses
        </p>
        <h3 className="text-2xl font-bold text-slate-900">
          {metrics.totalQuantity.toLocaleString('en-IN')}
        </h3>
        <p className="text-indigo-600 text-xs mt-2 font-medium flex items-center gap-1">
          <Layers className="h-3 w-3 text-indigo-500" />
          <span>Across Indian fulfillment centers</span>
        </p>
      </div>
    </div>
  );
};
