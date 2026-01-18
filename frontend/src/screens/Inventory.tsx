import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchFishes,
  deleteFish,
  Fish,
  setSelected,
} from "../store/features/fish/fishSlice";
import formatCurrencyK from "../utils/format";
import { getStatusDotColor, getStatusTextColor } from "../utils/status";
import { fetchCategories } from "../store/features/category/categorySlice";
import {
  recordLoss,
  fetchLossLogs,
} from "../store/features/inventory/inventorySlice";

interface InventoryProps {
  onAddItem: () => void;
  onEditItem?: () => void;
}

const ITEMS_PER_PAGE = 10;

const FALLBACK_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'>No Image</text></svg>";

const Inventory: React.FC<InventoryProps> = ({ onAddItem, onEditItem }) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showLossModal, setShowLossModal] = useState(false);
  const [selectedFishForLoss, setSelectedFishForLoss] = useState<Fish | null>(
    null,
  );
  const [lossQuantity, setLossQuantity] = useState(1);
  const [lossReason, setLossReason] = useState("");
  const [lossNote, setLossNote] = useState("");

  const dispatch = useAppDispatch();
  const {
    data: fishes,
    loading,
    total,
  } = useAppSelector((state) => state.fish);
  const { data: categories } = useAppSelector((state) => state.category);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchFishes({
        search,
        category_id: categoryFilter || undefined,
        status: statusFilter,
      }),
    );
    setCurrentPage(1);
  }, [dispatch, search, categoryFilter, statusFilter]);

  // Client-side pagination
  const totalPages = Math.ceil(fishes.length / ITEMS_PER_PAGE);
  const paginatedFishes = fishes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleEdit = (fish: Fish) => {
    dispatch(setSelected(fish));
    onEditItem?.();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this fish?")) {
      await dispatch(deleteFish(id));
    }
  };

  const handleOpenLossModal = (fish: Fish) => {
    setSelectedFishForLoss(fish);
    setLossQuantity(1);
    setLossReason("");
    setLossNote("");
    setShowLossModal(true);
  };

  const handleRecordLoss = async () => {
    if (!selectedFishForLoss || !lossReason) return;
    await dispatch(
      recordLoss({
        fish_id: selectedFishForLoss.id,
        quantity: lossQuantity,
        loss_reason: lossReason,
        note: lossNote,
      }),
    );
    setShowLossModal(false);
    dispatch(
      fetchFishes({
        search,
        category_id: categoryFilter || undefined,
        status: statusFilter,
      }),
    );
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Fish Inventory
          </h2>
          <p className="text-cyan-300 font-medium mt-1">
            Manage your aquatic stock, update prices, and track availability. (
            {fishes.length} items)
          </p>
        </div>
        <button
          onClick={onAddItem}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-2xl hover:shadow-cyan-500/30 text-white px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 font-bold transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Add New Fish
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:bg-slate-800/70 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm font-medium"
            placeholder="Search by name, scientific name, or SKU..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            className="flex-1 md:min-w-[160px] pl-4 pr-10 py-2.5 rounded-xl border-none bg-slate-800/50 text-cyan-300 text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 cursor-pointer appearance-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            className="flex-1 md:min-w-[160px] pl-4 pr-10 py-2.5 rounded-xl border-none bg-slate-800/50 text-cyan-300 text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 cursor-pointer appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-sm border border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800/50 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    className="rounded border-slate-300 text-primary focus:ring-primary/30"
                    type="checkbox"
                  />
                </th>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Fish Name</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Retail Price</th>
                <th className="px-6 py-4">Wholesale Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-300">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : paginatedFishes.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No fish found
                  </td>
                </tr>
              ) : (
                paginatedFishes.map((fish: Fish) => (
                  <tr
                    key={fish.id}
                    className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        className="rounded border-slate-300 text-primary focus:ring-primary/30"
                        type="checkbox"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="size-12 rounded-xl bg-slate-800/50 bg-cover bg-center border border-slate-700/50"
                        style={{
                          backgroundImage: `url(${fish.image || FALLBACK_IMG})`,
                        }}
                      ></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{fish.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {fish.scientific_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800/50 text-slate-300">
                        {fish.size || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {fish.category_name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-cyan-400">
                      {formatCurrencyK(Number(fish.retail_price || 0))}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {formatCurrencyK(Number(fish.wholesale_price || 0))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-1.5 rounded-full ${getStatusDotColor(
                            fish.status || "",
                          )}`}
                        ></div>
                        <span className={getStatusTextColor(fish.status || "")}>
                          {fish.stock} in stock
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEdit(fish)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleOpenLossModal(fish)}
                          className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors"
                          title="Record Loss"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            warning
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(fish.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-800/50 flex items-center justify-between bg-slate-800/30">
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
            Showing {paginatedFishes.length} of {fishes.length} results (Page{" "}
            {currentPage} of {totalPages || 1})
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-slate-400 text-sm hover:bg-slate-700/50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold ${
                    currentPage === page
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                      : "border border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-2 text-slate-400">...</span>}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-slate-300 text-sm hover:bg-slate-700/50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Loss Recording Modal */}
      {showLossModal && selectedFishForLoss && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-orange-500/20 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-orange-500/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Record Fish Loss</h3>
              <button
                onClick={() => setShowLossModal(false)}
                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-cyan-400 mb-2">
                  Fish
                </label>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="font-bold text-white">
                    {selectedFishForLoss.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Size: {selectedFishForLoss.size || "N/A"} | Current stock:{" "}
                    {selectedFishForLoss.stock}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-cyan-400 mb-2">
                  Quantity Lost <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedFishForLoss.stock}
                  value={lossQuantity}
                  onChange={(e) =>
                    setLossQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-cyan-400 mb-2">
                  Reason for Loss <span className="text-red-400">*</span>
                </label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all"
                >
                  <option value="">Select reason...</option>
                  <option value="death">Death</option>
                  <option value="disease">Disease</option>
                  <option value="damaged">Damaged</option>
                  <option value="escaped">Escaped</option>
                  <option value="theft">Theft</option>
                  <option value="expired">Expired</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-cyan-400 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={lossNote}
                  onChange={(e) => setLossNote(e.target.value)}
                  placeholder="Optional: Add more details..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLossModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700/50 text-slate-300 font-bold hover:bg-slate-800/50 hover:border-orange-500/50 hover:text-orange-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordLoss}
                disabled={!lossReason || lossQuantity < 1}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-2xl hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Record Loss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
