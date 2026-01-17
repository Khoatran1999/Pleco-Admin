import React, { useEffect, useState } from "react";
import { formatCurrencyK } from "../utils/format";
import { getStatusColor } from "../utils/status";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchImportOrders,
  fetchImportOrderById,
  updateImportOrderStatus,
  deleteImportOrder,
} from "../store/features/import/importSlice";
import OrderDetailModal from "../components/OrderDetailModal";

interface ImportsProps {
  onNewImport?: () => void;
}

const Imports: React.FC<ImportsProps> = ({ onNewImport }) => {
  const dispatch = useAppDispatch();
  const {
    data: imports,
    selected: selectedImport,
    loading,
  } = useAppSelector((s) => s.import);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [editingTotal, setEditingTotal] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const handleViewImport = async (id: number) => {
    setModalOpen(true);
    setModalLoading(true);
    try {
      await dispatch(fetchImportOrderById(id)).unwrap();
    } catch (err) {
      console.error("Failed to fetch import order details", err);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchImportOrders());
  }, [dispatch]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this import order?")) return;
    try {
      await dispatch(deleteImportOrder(id)).unwrap();
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Imports
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage import/orders from suppliers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNewImport}
            className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 font-bold transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            New Import
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Expected</th>
                <th className="px-6 py-4">Delivered</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-600">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : imports.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No import orders
                  </td>
                </tr>
              ) : (
                imports.map((imp: any) => (
                  <tr
                    key={imp.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {imp.order_number}
                    </td>
                    <td className="px-6 py-4">{imp.supplier_name}</td>
                    <td className="px-6 py-4">{imp.expected_delivery}</td>
                    <td className="px-6 py-4">{imp.delivery_date || "-"}</td>
                    <td className="px-6 py-4">{imp.item_count}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrencyK(Number(imp.total_amount))}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === imp.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="pl-2 pr-4 py-1 rounded-lg border border-slate-200 text-sm"
                            value={editingStatus}
                            onChange={(e) => setEditingStatus(e.target.value)}
                          >
                            <option value="pending">pending</option>
                            <option value="confirmed">confirmed</option>
                            <option value="delivered">delivered</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                          <button
                            className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold"
                            onClick={async () => {
                              try {
                                setSavingId(imp.id);
                                await dispatch(
                                  updateImportOrderStatus({
                                    id: imp.id,
                                    status: editingStatus,
                                    total_amount: editingTotal ?? undefined,
                                  })
                                ).unwrap();
                                setEditingId(null);
                              } catch (err: any) {
                                alert(
                                  err?.message || "Failed to update status"
                                );
                              } finally {
                                setSavingId(null);
                              }
                            }}
                          >
                            {savingId === imp.id ? "Saving..." : "Save"}
                          </button>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400">
                              Total
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-28 px-2 rounded-lg border"
                              value={editingTotal ?? Number(imp.total_amount)}
                              onChange={(e) =>
                                setEditingTotal(parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <button
                            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(
                            imp.status
                          )}`}
                        >
                          {imp.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => handleViewImport(imp.id)}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            visibility
                          </span>
                        </button>
                        <button
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          onClick={() => {
                            setEditingId(imp.id);
                            setEditingStatus(imp.status);
                            setEditingTotal(Number(imp.total_amount));
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>
                        <button
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => handleDelete(imp.id)}
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
      </div>

      <OrderDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        loading={modalLoading}
        type="import"
        order={selectedImport}
      />
    </div>
  );
};

export default Imports;
