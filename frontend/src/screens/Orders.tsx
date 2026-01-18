import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrencyK } from "../utils/format";
import { getStatusColor } from "../utils/status";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchSaleOrders,
  fetchSaleOrderById,
  updateSaleOrderStatus,
} from "../store/features/sale/saleSlice";
// social click now shows a small popover; no navigation import needed
import OrderDetailModal from "../components/OrderDetailModal";

interface OrdersProps {
  onAddOrder?: () => void;
}

const Orders: React.FC<OrdersProps> = ({ onAddOrder }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const {
    data: orders,
    selected: selectedOrder,
    loading,
  } = useAppSelector((s) => s.sale);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [openSocialId, setOpenSocialId] = useState<number | null>(null);

  const handleViewOrder = async (id: number) => {
    setModalOpen(true);
    setModalLoading(true);
    try {
      await dispatch(fetchSaleOrderById(id)).unwrap();
    } catch (err) {
      console.error("Failed to fetch order details", err);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    dispatch(
      fetchSaleOrders({
        status: statusFilter || undefined,
      }),
    );
  }, [dispatch, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Orders
          </h2>
          <p className="text-cyan-300/70 font-medium mt-1">
            View and manage customer orders ({orders.length} items).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onAddOrder) onAddOrder();
              else navigate("/orders/new");
            }}
            className="cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 flex items-center gap-2 font-bold transition-all active:scale-95 hover:scale-105"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            New Order
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl p-4 rounded-2xl border border-cyan-500/20 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/50 focus:bg-slate-800/80 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-sm font-medium text-slate-100 placeholder-slate-500"
            placeholder="Search order number or customer..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            className="cursor-pointer flex-1 md:min-w-[160px] pl-4 pr-10 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/50 text-cyan-300 text-sm font-bold focus:ring-2 focus:ring-cyan-500/50 appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Social</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-300">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((o: any) => (
                  <tr
                    key={o.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-white">
                      {o.order_number}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {o.customer_name || "Walk-in"}
                    </td>
                    <td className="px-6 py-4 relative">
                      {o.customer_name ? (
                        <div className="inline-block">
                          <button
                            className="cursor-pointer p-1 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-colors"
                            onClick={() =>
                              setOpenSocialId(
                                openSocialId === o.id ? null : o.id,
                              )
                            }
                            aria-expanded={openSocialId === o.id}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              info
                            </span>
                          </button>
                          {openSocialId === o.id && (
                            <div className="absolute z-20 left-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl shadow-black/50 p-3 text-sm">
                              <div className="mb-2 break-words">
                                {o.customer_social ? (
                                  <a
                                    href={
                                      String(o.customer_social).startsWith(
                                        "http",
                                      )
                                        ? o.customer_social
                                        : `https://${o.customer_social}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-cyan-400 underline hover:text-cyan-300"
                                  >
                                    {o.customer_social}
                                  </a>
                                ) : (
                                  <span className="text-slate-400">
                                    No social info
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={async () => {
                                    const text = o.customer_social || "";
                                    try {
                                      await navigator.clipboard.writeText(text);
                                      // small feedback
                                      alert("Copied to clipboard");
                                    } catch (err) {
                                      alert("Copy failed");
                                    }
                                  }}
                                  className="cursor-pointer px-3 py-1 rounded-lg bg-slate-700/50 text-cyan-300 text-xs hover:bg-slate-700 transition-colors"
                                >
                                  Copy
                                </button>
                                <button
                                  onClick={() => setOpenSocialId(null)}
                                  className="cursor-pointer px-3 py-1 rounded-lg bg-slate-600/50 text-slate-300 text-xs hover:bg-slate-600 transition-colors"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(o.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{o.item_count}</td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatCurrencyK(Number(o.total_amount))}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === o.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="cursor-pointer pl-2 pr-4 py-1 rounded-lg border border-slate-700/50 bg-slate-800/50 text-slate-200 text-sm focus:ring-2 focus:ring-cyan-500/50"
                            value={editingStatus}
                            onChange={(e) => setEditingStatus(e.target.value)}
                          >
                            <option value="pending">pending</option>
                            <option value="processing">processing</option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                          <button
                            className="cursor-pointer px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30"
                            onClick={async () => {
                              try {
                                setSavingId(o.id);
                                await dispatch(
                                  updateSaleOrderStatus({
                                    id: o.id,
                                    status: editingStatus,
                                  }),
                                ).unwrap();
                                setEditingId(null);
                              } catch (err: any) {
                                alert(
                                  err?.message || "Failed to update status",
                                );
                              } finally {
                                setSavingId(null);
                              }
                            }}
                            disabled={savingId === o.id}
                          >
                            {savingId === o.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="cursor-pointer px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(
                              o.status,
                            )}`}
                          >
                            {o.status}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          className="cursor-pointer p-2 text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors"
                          onClick={() => handleViewOrder(o.id)}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            visibility
                          </span>
                        </button>
                        <button
                          className="cursor-pointer p-2 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                          onClick={() => {
                            setEditingId(o.id);
                            setEditingStatus(o.status);
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
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
      </div>

      <OrderDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        loading={modalLoading}
        type="sale"
        order={selectedOrder}
      />
    </div>
  );
};

export default Orders;
