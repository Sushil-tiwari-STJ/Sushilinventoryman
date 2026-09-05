import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Copy,
  Database,
  Edit3,
  Filter,
  IndianRupee,
  MapPin,
  Package,
  Plus,
  SlidersHorizontal,
  Trash2,
  Zap,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { MetricsCards } from './components/MetricsCards.tsx';
import { ItemModal } from './components/ItemModal.tsx';
import { StockAdjustModal } from './components/StockAdjustModal.tsx';
import { TransactionsDrawer } from './components/TransactionsDrawer.tsx';
import { Category, InventoryItem, InventoryMetrics, StockTransaction } from './types.ts';
import { formatRupees } from './lib/currency.ts';

function InventoryApp() {
  const { user, signIn, getValidToken } = useAuth();

  // Inventory state
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: '0.00',
    lowStockCount: 0,
  });
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsRefreshing(true);
    try {
      const [itemsRes, catsRes, metricsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/categories'),
        fetch('/api/metrics'),
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }
      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(catsData);
      }
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  // Real-time synchronization via Server-Sent Events (SSE)
  useEffect(() => {
    fetchData();

    // Connect to SSE stream
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setIsLiveConnected(true);
    };

    eventSource.addEventListener('connected', () => {
      setIsLiveConnected(true);
    });

    eventSource.addEventListener('inventory_updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        fetchData(true);
        if (isHistoryOpen) fetchTransactions();

        // Brief notification banner
        let actionLabel = 'Inventory updated';
        if (data.action === 'create') actionLabel = `New product added: ${data.item?.name || 'SKU'}`;
        else if (data.action === 'stock_adjusted') actionLabel = `Stock updated: ${data.item?.name || 'Item'}`;
        else if (data.action === 'delete') actionLabel = 'Item removed from database';

        setRealtimeNotification(actionLabel);
        setTimeout(() => setRealtimeNotification(null), 3500);
      } catch (err) {
        console.error('Error handling SSE payload:', err);
      }
    });

    eventSource.addEventListener('category_created', () => {
      fetchData(true);
    });

    eventSource.onerror = () => {
      setIsLiveConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [fetchData, fetchTransactions, isHistoryOpen]);

  // Copy SKU helper
  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Item Create or Edit submission
  const handleSaveItem = async (itemData: any) => {
    let token = await getValidToken();
    if (!token && !user) {
      // Prompt user to sign in
      await signIn();
      token = await getValidToken();
      if (!token) throw new Error('Please sign in to modify inventory items');
    }

    if (editingItem) {
      // Update
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update item');
      }
    } else {
      // Create
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create item');
      }
    }

    await fetchData(true);
  };

  // Stock adjustment submission
  const handleAdjustStock = async (
    itemId: number,
    change: number,
    type: 'RESTOCK' | 'DISPATCH' | 'ADJUSTMENT',
    notes: string
  ) => {
    let token = await getValidToken();
    if (!token && !user) {
      await signIn();
      token = await getValidToken();
      if (!token) throw new Error('Please sign in to adjust stock');
    }

    const res = await fetch(`/api/items/${itemId}/stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ change, type, notes }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to adjust stock');
    }

    await fetchData(true);
  };

  // Delete item submission
  const handleDeleteItem = async (id: number) => {
    let token = await getValidToken();
    if (!token && !user) {
      await signIn();
      token = await getValidToken();
      if (!token) return;
    }

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to delete item');
        return;
      }
      setDeleteConfirmId(null);
      await fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Error deleting item');
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.hsnCode && item.hsnCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      // Low stock
      const matchesLowStock = !filterLowStockOnly || item.quantity <= item.minThreshold;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [items, searchQuery, selectedCategory, filterLowStockOnly]);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Real-time Broadcast Toast */}
      {realtimeNotification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 shadow-lg">
          <Zap className="h-4 w-4 text-emerald-600 fill-emerald-500 animate-pulse" />
          <span>{realtimeNotification}</span>
        </div>
      )}

      {/* Sleek Dark Sidebar */}
      <Sidebar
        currentTab={filterLowStockOnly ? 'low-stock' : 'all'}
        onSelectTab={(tab) => setFilterLowStockOnly(tab === 'low-stock')}
        onOpenHistory={() => {
          fetchTransactions();
          setIsHistoryOpen(true);
        }}
        onAddItem={() => {
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
        lowStockCount={metrics.lowStockCount}
        totalItemsCount={metrics.totalItems}
        isLiveConnected={isLiveConnected}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content View */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Sleek Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => fetchData(false)}
          isRefreshing={isRefreshing}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Scrollable Dashboard View */}
        <section className="p-6 sm:p-8 flex-1 flex flex-col space-y-6 overflow-y-auto">
          {/* Guest Read-Only Banner */}
          {!user && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-950 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>PostgreSQL Database Connected:</strong> Real-time replication is live. Sign in with Google to create new items, record shipments, or adjust stock levels.
                </span>
              </div>
              <button
                type="button"
                onClick={signIn}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-1.5 font-medium text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                Sign In with Google
              </button>
            </div>
          )}

          {/* Metrics Grid */}
          <MetricsCards
            metrics={metrics}
            isFilterLowStock={filterLowStockOnly}
            onToggleLowStock={() => setFilterLowStockOnly((prev) => !prev)}
          />

          {/* Inventory Table Container */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Card Header with Title, Category Chips, and Add Button */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Inventory Movements
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronized with Cloud SQL PostgreSQL instance
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 pr-1">
                    <Filter className="h-3 w-3" />
                    Category:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('All')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === 'All'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({items.length})
                  </button>
                  {categories.map((c) => {
                    const count = items.filter((i) => i.category === c.name).length;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c.name)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                          selectedCategory === c.name
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c.name} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Primary Add Button */}
                <button
                  id="add-new-product-btn"
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsItemModalOpen(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add New Product</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Product &amp; HSN</th>
                    <th className="px-4 py-3 font-semibold">SKU Code</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Indian Hub</th>
                    <th className="px-4 py-3 font-semibold">Stock Level</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Unit Rate (₹)</th>
                    <th className="px-4 py-3 font-semibold">Valuation (₹)</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Loading live records from PostgreSQL...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="font-medium text-slate-700">No matching inventory items found</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {searchQuery || selectedCategory !== 'All' || filterLowStockOnly
                            ? 'Try clearing search keywords, HSN codes or active filters'
                            : 'Click "+ Add Product (₹)" to register your first Indian SKU'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLow = item.quantity <= item.minThreshold;
                      const isOut = item.quantity === 0;
                      const itemValuation = item.quantity * parseFloat(item.unitPrice || '0');

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Product Name & HSN */}
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900">{item.name}</span>
                              {item.hsnCode && (
                                <span className="inline-flex items-center rounded bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 text-[10px] font-mono font-medium text-indigo-700">
                                  HSN {item.hsnCode}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <div className="text-xs text-slate-400 line-clamp-1 max-w-xs font-normal mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </td>

                          {/* SKU Code */}
                          <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                            <div className="flex items-center gap-1.5">
                              <span>{item.sku}</span>
                              <button
                                type="button"
                                onClick={() => handleCopySku(item.sku)}
                                title="Copy SKU"
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                {copiedSku === item.sku ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3.5 text-slate-600 text-xs">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 text-[11px] font-medium">
                              {item.category}
                            </span>
                          </td>

                          {/* Indian Hub / Location */}
                          <td className="px-4 py-3.5 text-slate-600 text-xs">
                            <div className="flex items-center gap-1 text-slate-600 text-xs">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[140px]" title={item.location || 'Central Depot'}>
                                {item.location || 'Central Depot'}
                              </span>
                            </div>
                            {item.supplier && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={item.supplier}>
                                {item.supplier}
                              </div>
                            )}
                          </td>

                          {/* Stock Level */}
                          <td
                            className={`px-4 py-3.5 text-xs ${
                              isOut || isLow
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-900 font-medium'
                            }`}
                          >
                            <span className="font-mono text-sm">{item.quantity.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-slate-400 ml-1">Units</span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3.5">
                            {isOut ? (
                              <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[11px] font-semibold inline-block">
                                Stock Out
                              </span>
                            ) : isLow ? (
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-semibold inline-block">
                                Reorder
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold inline-block">
                                In Stock
                              </span>
                            )}
                          </td>

                          {/* Unit Rate (₹) */}
                          <td className="px-4 py-3.5 text-slate-800 text-xs">
                            <div className="font-semibold font-mono text-slate-900">
                              {formatRupees(item.unitPrice)}
                            </div>
                            <div className="text-[10px] text-indigo-600">
                              +{item.gstRate || '18'}% GST
                            </div>
                          </td>

                          {/* Total Valuation (₹) */}
                          <td className="px-4 py-3.5 text-slate-900 font-semibold font-mono text-xs">
                            {formatRupees(itemValuation)}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Stock Adjust button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjustingItem(item);
                                  setIsAdjustModalOpen(true);
                                }}
                                className="text-slate-600 hover:text-indigo-600 text-xs font-medium inline-flex items-center gap-1 border border-slate-200 rounded-md px-2 py-1 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                                title="Record stock movement"
                              >
                                <SlidersHorizontal className="h-3 w-3" />
                                <span>Adjust</span>
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsItemModalOpen(true);
                                }}
                                className="text-slate-400 hover:text-indigo-600 text-xs font-medium transition-colors p-1"
                                title="Edit product"
                              >
                                Edit
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="text-slate-400 hover:text-rose-600 text-xs font-medium transition-colors p-1"
                                title="Delete product"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with India & Rupee Valuation summary */}
            <footer className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-700">
                  Showing {filteredItems.length} of {items.length} products
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">
                  Total Valuation: <strong className="text-slate-900 font-mono">{formatRupees(filteredItems.reduce((acc, it) => acc + (it.quantity * (parseFloat(it.unitPrice) || 0)), 0))}</strong>
                  {' '}({formatRupees(filteredItems.reduce((acc, it) => acc + (it.quantity * (parseFloat(it.unitPrice) || 0)), 0), { compact: true })})
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  🇮🇳 INR (₹)
                </span>
                <div className="flex items-center gap-1 text-slate-500">
                  <Database className="h-3 w-3 text-emerald-600" />
                  <span>Cloud SQL PostgreSQL • Live Sync</span>
                </div>
              </div>
            </footer>
          </div>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Delete Product from Database?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This action will permanently remove the record from PostgreSQL.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(deleteConfirmId)}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal (Create / Edit) */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        item={editingItem}
        categories={categories}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustModal
        isOpen={isAdjustModalOpen}
        item={adjustingItem}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAdjustingItem(null);
        }}
        onSubmit={handleAdjustStock}
      />

      {/* Audit & Transaction History Drawer */}
      <TransactionsDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transactions={transactions}
        isLoading={isHistoryLoading}
        onRefresh={fetchTransactions}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InventoryApp />
    </AuthProvider>
  );
}
