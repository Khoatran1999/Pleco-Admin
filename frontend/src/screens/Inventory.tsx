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
import { recordLoss } from "../store/features/inventory/inventorySlice";

interface InventoryProps {
  onAddItem: () => void;
  onEditItem?: (id: number) => void;
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
  const { data: fishes, loading } = useAppSelector((state) => state.fish);
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
    onEditItem?.(fish.id);
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
          <h2 className="text-3xl font-black text-text-primary tracking-tight">
            Fish Inventory
          </h2>
          <p className="text-text-secondary font-medium mt-1">
            Manage your aquatic stock, update prices, and track availability. (
            {fishes.length} items)
          </p>
        </div>
        <button
          onClick={onAddItem}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:shadow-soft-lg text-white px-6 py-3 rounded-button shadow-soft flex items-center gap-2 font-bold transition-all"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Add New Fish
        </button>
      </div>

      <div className="bg-white backdrop-blur-sm p-4 rounded-card shadow-soft border border-slate-200 hover:border-primary-300 hover:shadow-soft-lg transition-all flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary-600">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none bg-background-soft text-text-primary placeholder:text-text-muted focus:bg-white focus:ring-2 focus:ring-primary-400/30 transition-all text-sm font-medium"
            placeholder="Search by name, scientific name, or SKU..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            className="flex-1 md:min-w-[160px] pl-4 pr-10 py-2.5 rounded-button border border-slate-200 bg-white text-text-primary text-sm font-semibold focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 cursor-pointer appearance-none transition-all"
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
            className="flex-1 md:min-w-[160px] pl-4 pr-10 py-2.5 rounded-button border border-slate-200 bg-white text-text-primary text-sm font-semibold focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 cursor-pointer appearance-none transition-all"
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

      <div className="bg-white backdrop-blur-sm rounded-card shadow-soft border border-slate-200 hover:border-primary-300 hover:shadow-soft-lg transition-all overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-soft border-b border-slate-200 text-primary-700 text-[10px] font-bold uppercase tracking-widest">
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
            <tbody className="text-sm font-medium text-text-primary">
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
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        className="rounded border-slate-300 text-primary focus:ring-primary/30"
                        type="checkbox"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="size-12 rounded-xl bg-background-soft bg-cover bg-center border border-slate-200"
                        style={{
                          backgroundImage: `url(${fish.image || FALLBACK_IMG})`,
                        }}
                      ></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary">
                        {fish.name}
                      </div>
                      <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">
                        {fish.scientific_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-background-soft text-text-secondary">
                        {fish.size || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {fish.category_name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary-600">
                      {formatCurrencyK(Number(fish.retail_price || 0))}
                    </td>
                    <td className="px-6 py-4 font-bold text-secondary-600">
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
                          className="p-2 text-text-secondary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <p className="text-xs font-bold text-primary-700 uppercase tracking-widest">
            Showing {paginatedFishes.length} of {fishes.length} results (Page{" "}
            {currentPage} of {totalPages || 1})
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-text-secondary text-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                      ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-soft"
                      : "border border-slate-200 bg-white text-text-primary hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {totalPages > 5 && (
              <span className="px-2 text-text-muted">...</span>
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white text-text-secondary text-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-card p-6 w-full max-w-md shadow-soft-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary">
                Record Fish Loss
              </h3>
              <button
                onClick={() => setShowLossModal(false)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-primary-700 mb-2">
                  Fish
                </label>
                <div className="p-3 bg-background-soft rounded-lg">
                  <div className="font-bold text-text-primary">
                    {selectedFishForLoss.name}
                  </div>
                  <div className="text-xs text-text-muted">
                    Size: {selectedFishForLoss.size || "N/A"} | Current stock:{" "}
                    {selectedFishForLoss.stock}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-primary-700 mb-2">
                  Quantity Lost <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedFishForLoss.stock}
                  value={lossQuantity}
                  onChange={(e) =>
                    setLossQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-text-primary focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-primary-700 mb-2">
                  Reason for Loss <span className="text-red-600">*</span>
                </label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-button border border-slate-200 bg-white text-text-primary focus:ring-2 focus:ring-accent-400/30 focus:border-accent-400 transition-all"
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
                <label className="block text-sm font-bold text-primary-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={lossNote}
                  onChange={(e) => setLossNote(e.target.value)}
                  placeholder="Optional: Add more details..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-button border border-slate-200 bg-background-soft text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-400/30 focus:border-accent-400 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLossModal(false)}
                className="flex-1 px-4 py-2.5 rounded-button border border-slate-200 text-text-secondary font-semibold hover:bg-background-muted hover:border-slate-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordLoss}
                disabled={!lossReason || lossQuantity < 1}
                className="flex-1 px-4 py-2.5 rounded-button bg-gradient-to-r from-accent-500 to-red-600 text-white font-semibold hover:from-accent-600 hover:to-red-700 hover:shadow-soft-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
