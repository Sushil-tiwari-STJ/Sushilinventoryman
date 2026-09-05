import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  History,
  Package,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { StockTransaction } from '../types.ts';

interface TransactionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: StockTransaction[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const TransactionsDrawer: React.FC<TransactionsDrawerProps> = ({
  isOpen,
  onClose,
  transactions,
  isLoading,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const getTypeBadge = (type: StockTransaction['type']) => {
    switch (type) {
      case 'RESTOCK':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <ArrowUpRight className="h-3 w-3" />
            Restock
          </span>
        );
      case 'DISPATCH':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
            <ArrowDownRight className="h-3 w-3" />
            Dispatch
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            <SlidersHorizontal className="h-3 w-3" />
            Adjusted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            <Package className="h-3 w-3" />
            Initial
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">PostgreSQL Audit Trail</h2>
              <p className="text-[11px] text-slate-500">Live stock transactions & movements</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Refresh log"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-xs text-slate-400">
              Loading transactions from PostgreSQL...
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs text-slate-500">No stock movements recorded yet</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs transition-colors hover:border-indigo-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{tx.itemName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{tx.itemSku}</div>
                  </div>
                  {getTypeBadge(tx.type)}
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-600">
                  <span>
                    Change:{' '}
                    <strong
                      className={
                        tx.quantityChange > 0
                          ? 'text-emerald-600'
                          : tx.quantityChange < 0
                          ? 'text-rose-600'
                          : 'text-slate-700'
                      }
                    >
                      {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                    </strong>
                  </span>
                  <span>
                    Stock: {tx.previousQuantity} → <strong className="text-slate-900">{tx.newQuantity}</strong>
                  </span>
                </div>

                {tx.notes && (
                  <div className="mt-1.5 text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                    "{tx.notes}"
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>By: {tx.performedBy}</span>
                  <span>{new Date(tx.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
