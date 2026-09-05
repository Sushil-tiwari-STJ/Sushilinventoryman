/**
 * Currency and Number Formatting Utilities tailored for India (INR - ₹)
 * Supports Indian Numbering System:
 * - 1,00,000 = 1 Lakh (L)
 * - 1,00,00,000 = 1 Crore (Cr)
 * - 1,000 = 1 Thousand (k)
 */

export interface RupeeFormatOptions {
  compact?: boolean;
  showSymbol?: boolean;
  decimals?: number;
  useIndianWords?: boolean;
}

/**
 * Format a number or numeric string into Indian Rupee representation.
 * Example: 145000 -> "₹1,45,000.00" or "₹1.45 L" (compact)
 */
export function formatRupees(
  amount: number | string | null | undefined,
  options: RupeeFormatOptions = {}
): string {
  const { compact = false, showSymbol = true, decimals = 2 } = options;
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0');

  if (isNaN(num)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const symbol = showSymbol ? '₹' : '';

  if (compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 10000000) {
      // 1 Crore = 10,000,000 (100 Lakhs)
      return `${sign}${symbol}${(abs / 10000000).toFixed(decimals)} Cr`;
    }
    if (abs >= 100000) {
      // 1 Lakh = 100,000
      return `${sign}${symbol}${(abs / 100000).toFixed(decimals)} L`;
    }
    if (abs >= 1000) {
      // 1 Thousand = 1,000
      return `${sign}${symbol}${(abs / 1000).toFixed(1)} k`;
    }
    return `${sign}${symbol}${abs.toFixed(decimals)}`;
  }

  // Standard Indian Numbering Format with commas (e.g. 12,34,567.89)
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  return `${symbol}${formatted}`;
}

/**
 * Format a compact summary label (e.g. "₹3.82 Lakh" or "₹1.25 Crore")
 */
export function formatRupeeDenomination(amount: number | string): {
  short: string;
  label: string;
} {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  if (isNaN(num)) return { short: '₹0.00', label: 'Zero Rupees' };

  if (Math.abs(num) >= 10000000) {
    return {
      short: `₹${(num / 10000000).toFixed(2)} Cr`,
      label: 'Crores',
    };
  }
  if (Math.abs(num) >= 100000) {
    return {
      short: `₹${(num / 100000).toFixed(2)} Lakh`,
      label: 'Lakhs',
    };
  }
  return {
    short: formatRupees(num),
    label: 'Standard',
  };
}

/**
 * Standard Indian GST Slabs
 */
export const GST_SLABS = [
  { rate: 0, label: '0% (Exempt / Nil Rated)' },
  { rate: 5, label: '5% (Essential Goods)' },
  { rate: 12, label: '12% (Standard Low)' },
  { rate: 18, label: '18% (Standard General)' },
  { rate: 28, label: '28% (Luxury & Specialized)' },
];

/**
 * Calculate GST breakdown for an item
 */
export function calculateGST(unitPrice: number, gstRatePercent: number, quantity: number = 1) {
  const baseSubtotal = unitPrice * quantity;
  const gstAmount = (baseSubtotal * gstRatePercent) / 100;
  const totalWithGST = baseSubtotal + gstAmount;

  return {
    baseSubtotal,
    gstAmount,
    totalWithGST,
    effectiveUnitCost: totalWithGST / (quantity || 1),
  };
}

/**
 * Common Indian Logistics Hubs
 */
export const INDIAN_WAREHOUSES = [
  'Bengaluru DC - Whitefield',
  'Mumbai Fulfillment Hub - Bhiwandi',
  'Delhi NCR Logistics - Gurugram',
  'Chennai Port Hub - Sriperumbudur',
  'Pune Industrial Bay - Chakan',
  'Hyderabad Logistics Depot - Shamshabad',
  'Ahmedabad Logistics Hub - Sanand',
  'Kolkata Eastern Hub - Dankuni',
];
