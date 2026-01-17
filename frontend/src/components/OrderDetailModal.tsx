import React from "react";
import formatCurrencyK from "../utils/format";
import { getStatusColor } from "../utils/status";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateSaleOrderDetails } from "../store/features/sale/saleSlice";
import { fetchCustomers } from "../store/features/customer/customerSlice";

export interface OrderItem {
  id: number;
  fish_id: number;
  fish_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  batch_id?: string;
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  type: "sale" | "import";
  order: {
    id?: number;
    order_number: string;
    status: string;
    created_at?: string;
    order_date?: string;
    expected_delivery?: string;
    delivery_date?: string | null;
    customer_id?: number | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    customer_address?: string | null;
    customer_social?: string | null;
    supplier_name?: string;
    subtotal?: number;
    discount_amount?: number;
    total_amount: number;
    payment_method?: string;
    notes?: string;
    items?: OrderItem[];
  } | null;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  loading,
  type,
  order,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [editCustomer, setEditCustomer] = React.useState(
    order?.customer_name || ""
  );
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<
    number | null
  >(order?.customer_id ?? null);
  const [editNotes, setEditNotes] = React.useState(order?.notes || "");
  const dispatch = useAppDispatch();
  const { data: customers } = useAppSelector((s) => s.customer);
  React.useEffect(() => {
    if (isOpen) {
      dispatch(fetchCustomers());
      // initialize fields when opening modal
      setEditCustomer(order?.customer_name || "");
      setSelectedCustomerId(order?.customer_id ?? null);
      setEditNotes(order?.notes || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {type === "sale" ? "Sale Order Details" : "Import Order Details"}
            </h3>
            {order && (
              <p className="text-slate-500 text-sm font-medium mt-1">
                {order.order_number}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !order ? (
            <div className="text-center py-12 text-slate-400">
              Order not found
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold mt-1 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {type === "sale" ? "Customer" : "Supplier"}
                  </p>
                  {!editing ? (
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {type === "sale"
                        ? order.customer_name || "Walk-in"
                        : order.supplier_name}
                    </p>
                  ) : (
                    <div>
                      <input
                        list="customers-list"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold"
                        value={editCustomer}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditCustomer(val);
                          const match = customers.find(
                            (c: any) =>
                              c.name.toLowerCase() === val.toLowerCase()
                          );
                          setSelectedCustomerId(match ? match.id : null);
                        }}
                        placeholder="Search or type customer name (leave empty for Walk-in)"
                      />
                      <datalist id="customers-list">
                        {customers &&
                          customers.map((c: any) => (
                            <option key={c.id} value={c.name} />
                          ))}
                      </datalist>
                    </div>
                  )}
                  {type === "sale" && !editing && (
                    <div className="mt-2 text-sm text-slate-600">
                      {order.customer_phone && (
                        <div className="mb-1">
                          <span className="font-bold">Phone: </span>
                          <span>{order.customer_phone}</span>
                        </div>
                      )}
                      {order.customer_address && (
                        <div className="mb-1">
                          <span className="font-bold">Address: </span>
                          <span>{order.customer_address}</span>
                        </div>
                      )}
                      <div className="mb-1">
                        <span className="font-bold">Social: </span>
                        {order.customer_social ? (
                          <span className="inline-flex items-center gap-2">
                            <a
                              href={
                                String(order.customer_social).startsWith("http")
                                  ? order.customer_social
                                  : `https://${order.customer_social}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                            >
                              {order.customer_social}
                            </a>
                            <button
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    String(order.customer_social)
                                  );
                                  alert("Copied to clipboard");
                                } catch (err) {
                                  alert("Copy failed");
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs"
                            >
                              Copy
                            </button>
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {type === "sale" ? "Order Date" : "Expected Delivery"}
                  </p>
                  <p className="text-sm font-medium text-slate-600 mt-1">
                    {type === "sale"
                      ? order.order_date
                        ? new Date(order.order_date).toLocaleDateString()
                        : "-"
                      : order.expected_delivery || "-"}
                  </p>
                </div>
                {type === "import" && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Delivery Date
                    </p>
                    <p className="text-sm font-medium text-slate-600 mt-1">
                      {order.delivery_date || "-"}
                    </p>
                  </div>
                )}
                {type === "sale" && order.payment_method && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Payment Method
                    </p>
                    <p className="text-sm font-medium text-slate-600 mt-1">
                      {order.payment_method}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Items ({order.items?.length || 0})
                </p>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-t border-slate-50"
                          >
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900">
                                {item.fish_name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.sku}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-600">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-600">
                              {formatCurrencyK(Number(item.unit_price))}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {formatCurrencyK(Number(item.total_price))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-slate-400"
                          >
                            No items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Totals */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                {type === "sale" && order.subtotal !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-700">
                      {formatCurrencyK(Number(order.subtotal))}
                    </span>
                  </div>
                )}
                {type === "sale" &&
                  order.discount_amount !== undefined &&
                  order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Discount</span>
                      <span className="font-medium text-emerald-600">
                        -{formatCurrencyK(Number(order.discount_amount))}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-black text-slate-900">
                    {formatCurrencyK(Number(order.total_amount))}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Notes
                </p>
                {!editing ? (
                  order.notes ? (
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4">
                      {order.notes}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">No notes</p>
                  )
                ) : (
                  <textarea
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold"
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
          <div className="flex gap-3">
            {!editing ? (
              <button
                onClick={() => {
                  setEditing(true);
                  setEditCustomer(order?.customer_name || "");
                  setEditNotes(order?.notes || "");
                }}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Edit Details
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (!order) return;
                  try {
                    // dispatch update
                    const payload: any = { notes: editNotes };
                    if (editCustomer && editCustomer.trim().length > 0) {
                      payload.customer_name = editCustomer.trim();
                    } else {
                      payload.customer_name = "Walk-in Customer";
                    }
                    await dispatch(
                      updateSaleOrderDetails({ id: order.id, data: payload })
                    ).unwrap();
                    setEditing(false);
                  } catch (err) {
                    alert(err?.message || "Failed to update order");
                  }
                }}
                className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-blue-600 shadow-lg transition-all"
              >
                Save
              </button>
            )}

            <button
              onClick={() => {
                setEditing(false);
                onClose();
              }}
              className="flex-1 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
