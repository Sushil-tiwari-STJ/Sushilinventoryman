import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, SlidersHorizontal, X, IndianRupee } from 'lucide-react';
import { InventoryItem } from '../types.ts';
import { formatRupees } from '../lib/currency.ts';

interface StockAdjustModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSubmit: (itemId: number, change: number, type: 'RESTOCK' | 'DISPATCH' | 'ADJUSTMENT', notes: string) => Promise<void>;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  item,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<'RESTOCK' | 'DISPATCH' | 'ADJUSTMENT'>('RESTOCK');
  const [amount, setAmount] = useState('10');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const currentQty = item.quantity;
  const parsedAmount = Math.max(1, parseInt(amount, 10) || 0);
  const unitPriceNum = parseFloat(item.unitPrice || '0') || 0;

  let change = 0;
  if (type === 'RESTOCK') change = parsedAmount;
  else if (type === 'DISPATCH') change = -parsedAmount;
  else change = parsedAmount;

  const projectedQty = Math.max(0, currentQty + change);
  const valuationDelta = change * unitPriceNum;
  const projectedTotalValuation = projectedQty * unitPriceNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid quantity greater than 0.');
      return;
    }

    if (type === 'DISPATCH' && parsedAmount > currentQty) {
      setError(`Cannot dispatch more than current on-hand stock (${currentQty} units).`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(item.id, change, type, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Record Stock Movement</h2>
            <p className="text-xs text-slate-500 font-mono">
              {item.sku} • {item.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Operation Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Operation Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setType('RESTOCK')}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
                  type === 'RESTOCK'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Restock
              </button>
              <button
                type="button"
                onClick={() => setType('DISPATCH')}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
                  type === 'DISPATCH'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="h-3.5 w-3.5" />
                Dispatch
              </button>
              <button
                type="button"
                onClick={() => setType('ADJUSTMENT')}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
                  type === 'ADJUSTMENT'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Audit Correc.
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Quantity to {type === 'RESTOCK' ? 'Receive (Add)' : type === 'DISPATCH' ? 'Dispatch (Deduct)' : 'Adjust (+/-)'}
            </label>
            <input
              id="stock-adjust-quantity-input"
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Real-time Rupee & Stock Valuation Preview */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Current Stock on Hand:</span>
              <span className="font-semibold text-slate-900">{currentQty} units</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Unit Rate (₹ INR):</span>
              <span className="font-mono text-slate-900 font-semibold">{formatRupees(unitPriceNum)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Rupee Valuation Impact:</span>
              <span
                className={`font-semibold font-mono ${
                  valuationDelta > 0 ? 'text-emerald-600' : valuationDelta < 0 ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                {valuationDelta > 0 ? `+${formatRupees(valuationDelta)}` : formatRupees(valuationDelta)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>Projected Stock &amp; Valuation:</span>
              <div className="text-right">
                <span className="text-sm font-bold text-indigo-600 block">{projectedQty} units</span>
                <span className="text-[11px] font-mono text-slate-500 font-normal">
                  Total: {formatRupees(projectedTotalValuation)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Reference / Invoice / Challan No.
            </label>
            <input
              id="stock-adjust-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivery Challan #DC-BLR-8921 / PO receipt"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-stock-adjust-btn"
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Syncing to PostgreSQL...' : 'Confirm Stock Movement (₹)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
