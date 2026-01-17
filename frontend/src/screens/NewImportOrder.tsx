import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import formatCurrencyK from "../utils/format";
import {
  fetchSuppliers,
  createSupplier,
} from "../store/features/supplier/supplierSlice";
import {
  fetchFishes,
  Fish,
  createFish,
} from "../store/features/fish/fishSlice";
import { createImportOrder } from "../store/features/import/importSlice";

const DRAFT_KEY = "import_order_draft";

interface NewImportOrderProps {
  onBack: () => void;
}

interface OrderItem {
  fish_id: number;
  fish_name: string;
  quantity: number;
  unit_price: number;
  batch_id: string;
}

interface DraftData {
  supplierId: number;
  expectedDelivery: string;
  referenceNumber: string;
  items: OrderItem[];
  savedAt: string;
}

const NewImportOrder: React.FC<NewImportOrderProps> = ({ onBack }) => {
  const dispatch = useAppDispatch();
  const { data: suppliers } = useAppSelector((state) => state.supplier);
  const { data: fishes } = useAppSelector((state) => state.fish);

  const [supplierId, setSupplierId] = useState<number>(0);
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [searchFish, setSearchFish] = useState("");
  const [selectedFishId, setSelectedFishId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [extraCosts, setExtraCosts] = useState<number>(0);
  const [adjustedTotal, setAdjustedTotal] = useState<number | null>(null);
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [showCreateFish, setShowCreateFish] = useState(false);
  const [newFishName, setNewFishName] = useState("");
  const [newFishSku, setNewFishSku] = useState("");
  const [newFishSize, setNewFishSize] = useState("");
  const [newFishCost, setNewFishCost] = useState<number | "">("");
  const [creatingFish, setCreatingFish] = useState(false);

  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchFishes({}));

    // Load draft from localStorage
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft: DraftData = JSON.parse(savedDraft);
        setSupplierId(draft.supplierId);
        setExpectedDelivery(draft.expectedDelivery);
        setReferenceNumber(draft.referenceNumber);
        setItems(draft.items);
        setDraftLoaded(true);
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, [dispatch]);

  const handleSaveDraft = () => {
    const draft: DraftData = {
      supplierId,
      expectedDelivery,
      referenceNumber,
      items,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    alert("Draft saved successfully!");
  };

  const handleClearDraft = () => {
    if (window.confirm("Are you sure you want to clear the draft?")) {
      localStorage.removeItem(DRAFT_KEY);
      setSupplierId(0);
      setExpectedDelivery("");
      setReferenceNumber("");
      setItems([]);
      setDraftLoaded(false);
    }
  };

  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchFishes({}));
  }, [dispatch]);

  const handleAddItem = () => {
    if (!selectedFishId || quantity <= 0 || unitPrice < 0) {
      alert("Please fill in all item fields (Price can be 0 for free imports)");
      return;
    }

    const fish = fishes.find((f) => f.id === selectedFishId);
    if (!fish) return;

    const newItem: OrderItem = {
      fish_id: selectedFishId,
      fish_name: fish.name,
      quantity,
      unit_price: unitPrice,
      batch_id: `B-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 4)
        .toUpperCase()}`,
    };

    setItems([...items, newItem]);
    setSelectedFishId(0);
    setQuantity(0);
    setUnitPrice(0);
    setSearchFish("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      alert("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplier_id: supplierId,
        expected_delivery: expectedDelivery || undefined,
        notes: referenceNumber || undefined,
        items: items.map((item) => ({
          fish_id: item.fish_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };
      console.debug("Creating import order payload:", payload);

      await dispatch(createImportOrder(payload)).unwrap();
      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY);
      alert("Import order created successfully!");
      onBack();
    } catch (error: any) {
      console.error("Create import order error:", error);
      const message =
        error?.message ||
        error?.toString?.() ||
        "Failed to create import order";
      // If axios error object, try to extract server message
      if (error?.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) {
      alert("Supplier name is required");
      return;
    }

    setCreatingSupplier(true);
    try {
      const payload = {
        name: newSupplierName,
        phone: newSupplierPhone || undefined,
        email: newSupplierEmail || undefined,
        address: newSupplierAddress || undefined,
      };

      const result = await dispatch(createSupplier(payload)).unwrap();
      // refresh suppliers list (optional)
      dispatch(fetchSuppliers());
      // select newly created supplier
      setSupplierId(result.id);
      setShowCreateSupplier(false);
      // clear form
      setNewSupplierName("");
      setNewSupplierPhone("");
      setNewSupplierEmail("");
      setNewSupplierAddress("");
    } catch (err: any) {
      console.error("Create supplier failed", err);
      alert(err?.message || "Failed to create supplier");
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleCreateFish = async () => {
    if (!newFishName.trim()) {
      alert("Fish name is required");
      return;
    }

    setCreatingFish(true);
    try {
      const payload: Partial<Fish> = {
        name: newFishName,
        sku: newFishSku || undefined,
        size: newFishSize || undefined,
        cost_price: typeof newFishCost === "number" ? newFishCost : undefined,
      };

      const result = await dispatch(createFish(payload)).unwrap();
      dispatch(fetchFishes({}));
      setSelectedFishId(result.id);
      setSearchFish(result.name || "");
      setUnitPrice(Number(result.cost_price) || 0);
      setShowCreateFish(false);
      setNewFishName("");
      setNewFishSku("");
      setNewFishSize("");
      setNewFishCost("");
    } catch (err: any) {
      console.error("Create fish failed", err);
      alert(err?.message || "Failed to create fish");
    } finally {
      setCreatingFish(false);
    }
  };

  const totalItems = items.length;
  const totalWeight = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const computedTotal = subtotal + Number(extraCosts || 0);
  const grandTotal = adjustedTotal !== null ? adjustedTotal : computedTotal;

  const filteredFishes = fishes.filter(
    (f) =>
      String(f.name || "")
        .toLowerCase()
        .includes((searchFish || "").toLowerCase()) ||
      String(f.sku || "")
        .toLowerCase()
        .includes((searchFish || "").toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col gap-4">
        <nav className="flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <button
            onClick={onBack}
            className="hover:text-primary transition-colors"
          >
            Inventory
          </button>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-800">New Import Order</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            New Import Order
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            {draftLoaded && (
              <button
                onClick={handleClearDraft}
                className="px-6 py-2.5 text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all"
              >
                Clear Draft
              </button>
            )}
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2.5 text-sm font-bold text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all"
            >
              Save Draft
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
            <span className="material-symbols-outlined text-primary text-2xl fill-1">
              description
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Import Details
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Supplier *
              </label>
              <div className="flex gap-2">
                <select
                  className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                  value={supplierId}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                >
                  <option value={0}>Select a supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateSupplier(true)}
                  className="px-3 py-2 text-sm font-bold text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Create Supplier Modal */}
            {showCreateSupplier && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="w-full max-w-md bg-white rounded-2xl p-6">
                  <h4 className="text-lg font-bold mb-4">Create Supplier</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-400">
                        Name *
                      </label>
                      <input
                        className="w-full rounded-xl border-none bg-slate-50 py-2 px-3 mt-1"
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-400">
                        Phone
                      </label>
                      <input
                        className="w-full rounded-xl border-none bg-slate-50 py-2 px-3 mt-1"
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-400">
                        Email
                      </label>
                      <input
                        className="w-full rounded-xl border-none bg-slate-50 py-2 px-3 mt-1"
                        value={newSupplierEmail}
                        onChange={(e) => setNewSupplierEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-400">
                        Address
                      </label>
                      <input
                        className="w-full rounded-xl border-none bg-slate-50 py-2 px-3 mt-1"
                        value={newSupplierAddress}
                        onChange={(e) => setNewSupplierAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowCreateSupplier(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSupplier}
                      disabled={creatingSupplier}
                      className="px-4 py-2 rounded-xl bg-primary text-white font-bold"
                    >
                      {creatingSupplier ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Expected Delivery *
              </label>
              <input
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Reference / Invoice #
              </label>
              <input
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300"
                placeholder="e.g. INV-2023-001"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
            <span className="material-symbols-outlined text-primary text-2xl fill-1">
              add_shopping_cart
            </span>
            <h3 className="text-xl font-black text-slate-900">Add Items</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
            <div className="flex-[2] w-full space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Fish Species
              </span>
              <div className="relative flex">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                  search
                </span>
                <input
                  className="w-full pl-11 rounded-xl border-none bg-white py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                  placeholder="Search product..."
                  type="text"
                  value={searchFish}
                  onChange={(e) => setSearchFish(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCreateFish(true)}
                  className="flex-none mx-2 px-3 py-2 text-sm font-bold text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all"
                >
                  Add Fish
                </button>
                {searchFish && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 max-h-48 overflow-y-auto">
                    {filteredFishes.slice(0, 5).map((fish) => (
                      <button
                        key={fish.id}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm font-medium"
                        onClick={() => {
                          setSelectedFishId(fish.id);
                          setSearchFish(
                            `${fish.name}${fish.size ? ` (${fish.size})` : ""}`
                          );
                          setUnitPrice(Number(fish.cost_price) || 0);
                        }}
                      >
                        {fish.name} {fish.size ? `(${fish.size})` : ""} -{" "}
                        {fish.sku}
                      </button>
                    ))}
                  </div>
                )}
                {/* Create Fish Modal */}
                {showCreateFish && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md bg-white rounded-2xl p-6">
                      <h4 className="text-lg font-bold mb-4">Add Fish</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold uppercase text-slate-400">
                            Name *
                          </label>
                          <input
                            className="w-full rounded-xl border-none bg-slate-50 py-2 px-3 mt-1"
                            value={newFishName}
                            onChange={(e) => setNewFishName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase text-slate-400">
                            SKU
                          </label>
                          <input
                            className="w-full rounded-xl border-none bg-slate-50 py-2 px-3 mt-1"
                            value={newFishSku}
                            onChange={(e) => setNewFishSku(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase text-slate-400">
                            Size
                          </label>
                          <input
                            className="w-full rounded-xl border-none bg-slate-50 py-2 px-3 mt-1"
                            value={newFishSize}
                            onChange={(e) => setNewFishSize(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase text-slate-400">
                            Cost Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-xl border-none bg-slate-50 py-2 px-3 mt-1"
                            value={newFishCost}
                            onChange={(e) =>
                              setNewFishCost(
                                e.target.value === ""
                                  ? ""
                                  : parseFloat(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          onClick={() => setShowCreateFish(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateFish}
                          disabled={creatingFish}
                          className="px-4 py-2 rounded-xl bg-primary text-white font-bold"
                        >
                          {creatingFish ? "Creating..." : "Create"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 w-full space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Quantity (pieces)
              </span>
              <input
                className="w-full rounded-xl border-none bg-white py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                placeholder="0"
                type="number"
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="flex-1 w-full space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Unit Cost (K)
              </span>
              <input
                className="w-full rounded-xl border-none bg-white py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                placeholder="0.00"
                type="number"
                step="0.01"
                value={unitPrice || ""}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
              />
            </div>
            <button
              onClick={handleAddItem}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/30 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-5">Product Details</th>
                  <th className="px-6 py-5">Batch ID</th>
                  <th className="px-6 py-5 text-right">Quantity (pieces)</th>
                  <th className="px-6 py-5 text-right">Unit Price</th>
                  <th className="px-6 py-5 text-right">Line Total</th>
                  <th className="px-6 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      No items added
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                            🐟
                          </div>
                          <div>
                            <p className="text-sm text-slate-900">
                              {item.fish_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-500 font-mono">
                          {item.batch_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 text-right">
                        {formatCurrencyK(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-primary text-right">
                        {formatCurrencyK(item.quantity * item.unit_price)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 justify-end">
          <div className="w-full md:w-1/3 bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              Order Summary
            </h4>
            <div className="space-y-4 pb-6 border-b border-slate-50">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-400">Total Items</span>
                <span className="text-slate-900">{totalItems}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-400">Total Weight</span>
                <span className="text-slate-900">
                  {totalWeight.toFixed(1)} pieces
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-900">
                  {formatCurrencyK(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <label className="text-slate-400">Extra Costs</label>
                <input
                  type="number"
                  step="0.01"
                  value={extraCosts}
                  onChange={(e) =>
                    setExtraCosts(parseFloat(e.target.value) || 0)
                  }
                  className="w-28 text-right px-2 bg-transparent"
                />
              </div>
              <div className="flex justify-between text-sm font-bold">
                <label className="text-slate-400">
                  Adjusted Total (editable)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={grandTotal}
                  onChange={(e) =>
                    setAdjustedTotal(parseFloat(e.target.value) || 0)
                  }
                  className="w-28 text-right px-2 bg-transparent"
                />
              </div>
              {/* Tax removed */}
            </div>
            <div className="pt-6 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-900">
                  Grand Total
                </span>
                <span className="text-3xl font-black text-primary">
                  {formatCurrencyK(grandTotal)}
                </span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                check_circle
              </span>
              {submitting ? "Submitting..." : "Submit Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewImportOrder;
