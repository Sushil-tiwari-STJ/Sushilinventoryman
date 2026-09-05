import React, { useState, useEffect } from 'react';
import { IndianRupee, Sparkles, X, Calculator, Building2 } from 'lucide-react';
import { InventoryItem, Category } from '../types.ts';
import { formatRupees, GST_SLABS, INDIAN_WAREHOUSES, calculateGST } from '../lib/currency.ts';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: any) => Promise<void>;
  item?: InventoryItem | null;
  categories: Category[];
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  categories,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [minThreshold, setMinThreshold] = useState('5');
  const [unitPrice, setUnitPrice] = useState('1499.00');
  const [gstRate, setGstRate] = useState('18.00');
  const [hsnCode, setHsnCode] = useState('');
  const [location, setLocation] = useState('Bengaluru DC - Bay B2');
  const [supplier, setSupplier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setSku(item.sku);
      setName(item.name);
      setCategory(item.category);
      setDescription(item.description || '');
      setQuantity(String(item.quantity));
      setMinThreshold(String(item.minThreshold));
      setUnitPrice(item.unitPrice || '1499.00');
      setGstRate(item.gstRate || '18.00');
      setHsnCode(item.hsnCode || '');
      setLocation(item.location || 'Bengaluru DC - Bay B2');
      setSupplier(item.supplier || '');
    } else {
      // New item defaults tailored for India
      setSku(`SKU-IN-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setCategory(categories[0]?.name || 'Electronics');
      setCustomCategory('');
      setDescription('');
      setQuantity('25');
      setMinThreshold('5');
      setUnitPrice('1499.00');
      setGstRate('18.00');
      setHsnCode('8542.31');
      setLocation('Bengaluru DC - Bay B2');
      setSupplier('Bharat Electronics Ltd (BEL)');
    }
    setError(null);
  }, [item, isOpen, categories]);

  if (!isOpen) return null;

  const handleGenerateSku = () => {
    const prefix = category ? category.substring(0, 3).toUpperCase() : 'IND';
    const rand = Math.floor(100 + Math.random() * 900);
    setSku(`SKU-${prefix}-${rand}`);
  };

  const parsedPrice = parseFloat(unitPrice || '0') || 0;
  const parsedGst = parseFloat(gstRate || '0') || 0;
  const parsedQty = parseInt(quantity || '0', 10) || 0;
  const taxCalc = calculateGST(parsedPrice, parsedGst, parsedQty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      setError('SKU Identifier and Product Name are required.');
      return;
    }

    const finalCategory = category === 'CUSTOM' ? customCategory.trim() : category;
    if (!finalCategory) {
      setError('Please specify a category.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        sku: sku.trim(),
        name: name.trim(),
        category: finalCategory,
        description: description.trim(),
        quantity: parsedQty,
        minThreshold: parseInt(minThreshold, 10) || 5,
        unitPrice: parsedPrice.toFixed(2),
        gstRate: parsedGst.toFixed(2),
        hsnCode: hsnCode.trim() || undefined,
        location: location.trim(),
        supplier: supplier.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {item ? 'Edit Product (India)' : 'Register Product (India)'}
              </h2>
              <p className="text-xs text-slate-500">
                Indian Rupees (₹), HSN/SAC codes &amp; GST tax calculation
              </p>
            </div>
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
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* SKU & Generator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              SKU Identifier *
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="item-sku-input"
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-ELC-101"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleGenerateSku}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Generate unique SKU"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Product / Item Name *
            </label>
            <input
              id="item-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Microcontroller Board v4.2"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Category & HSN Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Category *
              </label>
              <select
                id="item-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="CUSTOM">+ Add New Category...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                HSN / SAC Code (India GST)
              </label>
              <input
                id="item-hsn-input"
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="e.g. 8542.31, 7604.29"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {category === 'CUSTOM' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                New Category Name *
              </label>
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Electrical Components"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          )}

          {/* Unit Price (Rupees) & GST Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Unit Price (₹ INR) *</span>
                <span className="text-[10px] text-indigo-600 lowercase font-normal">excl. GST</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-semibold text-xs">
                  ₹
                </span>
                <input
                  id="item-price-input"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                GST Rate Slab (India)
              </label>
              <select
                id="item-gst-select"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              >
                {GST_SLABS.map((slab) => (
                  <option key={slab.rate} value={slab.rate.toFixed(2)}>
                    {slab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic GST & Rupee Computation Card */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-900 font-semibold mb-2">
              <Calculator className="h-3.5 w-3.5 text-indigo-600" />
              <span>Tax &amp; Rupee Breakdown (GST {parsedGst}%)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700">
              <div>
                <span className="text-slate-500 block">Base Price / Unit</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatRupees(parsedPrice)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">GST ({parsedGst}%)</span>
                <span className="font-semibold text-indigo-700 font-mono">
                  +{formatRupees((parsedPrice * parsedGst) / 100)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Gross Price (Incl. GST)</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatRupees(taxCalc.effectiveUnitCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {item ? 'Quantity in Stock' : 'Initial Units'}
              </label>
              <input
                id="item-quantity-input"
                type="number"
                min="0"
                value={quantity}
                disabled={!!item}
                onChange={(e) => setQuantity(e.target.value)}
                className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                  item ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                }`}
              />
              {item && (
                <span className="text-[10px] text-slate-400">
                  Use "Adjust" button on table to record stock movements
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Low Stock Threshold
              </label>
              <input
                id="item-threshold-input"
                type="number"
                min="1"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Warehouse Location (Indian Hubs) & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Warehouse Hub (India)</span>
              </label>
              <input
                id="item-location-input"
                type="text"
                list="indian-warehouses-list"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru DC - Bay B2"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
              <datalist id="indian-warehouses-list">
                {INDIAN_WAREHOUSES.map((hub) => (
                  <option key={hub} value={hub} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Supplier / Vendor (India)
              </label>
              <input
                id="item-supplier-input"
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Bharat Electronics Ltd (BEL)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Description / Notes
            </label>
            <textarea
              id="item-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specifications, packaging unit, warranty terms..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-item-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving to PostgreSQL...'
                : item
                ? 'Update Product (₹)'
                : 'Register Product (₹)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
