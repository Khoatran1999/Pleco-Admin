import React, { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import formatCurrencyK from "../utils/format";
import {
  fetchCustomers,
  createCustomer,
} from "../store/features/customer/customerSlice";
import { fetchFishes, Fish } from "../store/features/fish/fishSlice";
import { fetchInventory } from "../store/features/inventory/inventorySlice";
import { createSaleOrder } from "../store/features/sale/saleSlice";

const DRAFT_KEY = "sale_order_draft";

interface NewSaleOrderProps {
  onBack: () => void;
}

interface OrderItem {
  fish_id: number;
  fish_name: string;
  quantity: number;
  unit_price: number;
  available_stock: number;
}

interface DraftData {
  customerId: number;
  saleType: "retail" | "wholesale";
  paymentMethod: string;
  notes: string;
  items: OrderItem[];
  savedAt: string;
}

const NewSaleOrder: React.FC<NewSaleOrderProps> = ({ onBack }) => {
  const dispatch = useAppDispatch();
  const { data: customers } = useAppSelector((state) => state.customer);
  const { selected: selectedCustomer } = useAppSelector(
    (state) => state.customer,
  );
  const { data: fishes } = useAppSelector((state) => state.fish);
  const { data: inventory } = useAppSelector((state) => state.inventory);

  const [customerId, setCustomerId] = useState<number>(0);
  const [saleType, setSaleType] = useState<"retail" | "wholesale">("retail");
  const [orderStatus, setOrderStatus] = useState<
    "pending" | "processing" | "completed" | "cancelled"
  >("pending");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [searchFish, setSearchFish] = useState("");
  const [selectedFishId, setSelectedFishId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Dropdown open states
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showFishDropdown, setShowFishDropdown] = useState(false);

  // Refs for click outside handling
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const fishDropdownRef = useRef<HTMLDivElement>(null);

  // Customer modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerSocial, setNewCustomerSocial] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
      if (
        fishDropdownRef.current &&
        !fishDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFishDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    dispatch(fetchCustomers({}));
    dispatch(fetchFishes({}));
    dispatch(fetchInventory());

    // Load draft from localStorage
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft: DraftData = JSON.parse(savedDraft);
        setCustomerId(draft.customerId);
        setSaleType(draft.saleType || "retail");
        setPaymentMethod(draft.paymentMethod);
        setNotes(draft.notes);
        setItems(draft.items);
        setDraftLoaded(true);
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, [dispatch]);

  // If navigated here with selected customer, prefill
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerId(selectedCustomer.id || 0);
      setCustomerSearch(selectedCustomer.name || "");
    }
  }, [selectedCustomer]);

  const handleSaveDraft = () => {
    const draft: DraftData = {
      customerId,
      saleType,
      // include status in draft for convenience
      // @ts-ignore - DraftData doesn't include status yet, kept simple
      status: orderStatus,
      paymentMethod,
      notes,
      items,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    alert("Draft saved successfully!");
  };

  const handleClearDraft = () => {
    if (window.confirm("Are you sure you want to clear the draft?")) {
      localStorage.removeItem(DRAFT_KEY);
      setCustomerId(0);
      setSaleType("retail");
      setOrderStatus("pending");
      setPaymentMethod("Credit Card");
      setNotes("");
      setItems([]);
      setDraftLoaded(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      alert("Customer name is required");
      return;
    }

    setCreatingCustomer(true);
    try {
      const result = await dispatch(
        createCustomer({
          name: newCustomerName,
          email: newCustomerEmail || undefined,
          phone: newCustomerPhone || undefined,
          address: newCustomerAddress || undefined,
          social: newCustomerSocial || undefined,
        }),
      ).unwrap();

      // Select the new customer
      setCustomerId(result.id);
      setCustomerSearch(result.name);

      // Close modal and reset form
      setShowCustomerModal(false);
      setNewCustomerName("");
      setNewCustomerSocial("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setNewCustomerAddress("");

      // Refresh customers list
      dispatch(fetchCustomers({}));
    } catch (error: any) {
      alert(error || "Failed to create customer");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const getStockForFish = (fishId: number): number => {
    const inv = inventory.find((i) => i.fish_id === fishId);
    return inv ? Number(inv.quantity) : 0;
  };

  const handleAddItem = () => {
    if (!selectedFishId || quantity <= 0 || unitPrice <= 0) {
      alert("Please fill in all item fields");
      return;
    }

    const fish = fishes.find((f) => f.id === selectedFishId);
    if (!fish) return;

    const availableStock = getStockForFish(selectedFishId);
    const existingQty = items
      .filter((i) => i.fish_id === selectedFishId)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (quantity + existingQty > availableStock) {
      alert(
        `Not enough stock! Available: ${availableStock - existingQty} pieces`,
      );
      return;
    }

    const newItem: OrderItem = {
      fish_id: selectedFishId,
      fish_name: fish.name,
      quantity,
      unit_price: unitPrice,
      available_stock: availableStock,
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

  const handleClearAll = () => {
    setItems([]);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setSubmitting(true);
    try {
      // If no existing customer selected, send `customer_name` (typed text or Walk-in Customer)
      const payload: any = {
        status: orderStatus,
        sale_type: saleType,
        payment_method: paymentMethod,
        discount_amount: discountAmount > 0 ? discountAmount : undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          fish_id: item.fish_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      if (customerId && customerId > 0) {
        payload.customer_id = customerId;
      } else {
        // If user typed a name use it, otherwise default to 'Walk-in Customer'
        payload.customer_name = customerSearch?.trim()
          ? customerSearch.trim()
          : "Walk-in Customer";
      }

      await dispatch(createSaleOrder(payload)).unwrap();
      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY);
      alert("Sale order created successfully!");
      onBack();
    } catch (error: any) {
      alert(error || "Failed to create sale order");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const filteredFishes = fishes.filter(
    (f) =>
      f.name.toLowerCase().includes((searchFish || "").toLowerCase()) ||
      String(f.sku || "")
        .toLowerCase()
        .includes((searchFish || "").toLowerCase()),
  );

  const filteredCustomers = customers.filter((c) =>
    String(c.name || "")
      .toLowerCase()
      .includes((customerSearch || "").toLowerCase()),
  );

  const hasLowStock = items.some((item) => item.available_stock < 30);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          <button
            onClick={onBack}
            className="hover:text-primary-600 transition-colors"
          >
            Home
          </button>
          <span className="material-symbols-outlined text-xs">
            chevron_right
          </span>
          <span>Sales</span>
          <span className="material-symbols-outlined text-xs">
            chevron_right
          </span>
          <span className="text-primary-600">New Sale Order</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight font-manrope">
              New Sale Order
            </h1>
            <p className="text-text-secondary font-medium text-sm mt-1">
              Create a new order and manage inventory allocation.
            </p>
          </div>
          <div className="flex gap-3">
            {draftLoaded && (
              <button
                onClick={handleClearDraft}
                className="px-5 py-2.5 rounded-button border border-red-300 text-red-600 font-bold text-sm hover:bg-red-50 transition-all flex items-center gap-2 bg-white"
              >
                <span className="material-symbols-outlined text-[20px]">
                  delete
                </span>
                Clear Draft
              </button>
            )}
            <button
              onClick={handleSaveDraft}
              className="px-5 py-2.5 rounded-button border border-slate-200 text-text-secondary font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 bg-white"
            >
              <span className="material-symbols-outlined text-[20px]">
                save
              </span>
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="px-5 py-2.5 rounded-button bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold text-sm hover:shadow-soft-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">
                check
              </span>
              {submitting ? "Processing..." : "Finalize Order"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white backdrop-blur-sm rounded-card shadow-soft border border-slate-200 hover:border-primary-300 hover:shadow-soft-lg transition-all p-8">
            <h3 className="text-xl font-black text-text-primary mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-600 fill-1">
                receipt_long
              </span>
              Order Details
            </h3>
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Customer
                </label>
                <div className="relative" ref={customerDropdownRef}>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600 z-10">
                    <span className="material-symbols-outlined text-[20px]">
                      person_search
                    </span>
                  </span>
                  <input
                    className="w-full bg-white border border-slate-200 text-text-primary placeholder:text-text-muted rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all outline-none"
                    placeholder="Search customer..."
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
                  {showCustomerDropdown && customerSearch && (
                    <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-card shadow-soft-lg max-h-48 overflow-y-auto">
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm font-medium text-text-primary"
                        onClick={() => {
                          setCustomerId(0);
                          setCustomerSearch("Walk-in Customer");
                          setShowCustomerDropdown(false);
                        }}
                      >
                        Walk-in Customer
                      </button>
                      {filteredCustomers.slice(0, 5).map((customer) => (
                        <button
                          key={customer.id}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm font-medium text-text-primary"
                          onClick={() => {
                            setCustomerId(customer.id);
                            setCustomerSearch(customer.name);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          {customer.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="text-[10px] text-primary-600 font-black uppercase tracking-widest hover:underline flex items-center gap-1 mt-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>{" "}
                  Add New Customer
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Sale Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSaleType("retail")}
                    className={`flex-1 py-3 px-4 rounded-button font-bold text-sm transition-all ${
                      saleType === "retail"
                        ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-soft-lg"
                        : "bg-white text-text-secondary hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    Retail
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleType("wholesale")}
                    className={`flex-1 py-3 px-4 rounded-button font-bold text-sm transition-all ${
                      saleType === "wholesale"
                        ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-soft-lg"
                        : "bg-white text-text-secondary hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    Wholesale
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                    Order Date
                  </label>
                  <input
                    className="w-full bg-white border border-slate-200 text-text-primary rounded-button px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                    Invoice #
                  </label>
                  <input
                    className="w-full bg-background-soft border border-slate-200 rounded-button px-4 py-3 text-sm font-bold text-text-muted cursor-not-allowed"
                    readOnly
                    value={`INV-${Date.now().toString().slice(-6)}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Payment Method
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-white border border-slate-200 text-text-primary rounded-button px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all appearance-none cursor-pointer"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option>Credit Card</option>
                    <option>Bank Transfer</option>
                    <option>Cash on Delivery</option>
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none material-symbols-outlined">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Order Status
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-white border border-slate-200 text-text-primary rounded-button px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all appearance-none cursor-pointer"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as any)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none material-symbols-outlined">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Discount Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600 text-sm font-bold">
                    ₫
                  </span>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white border border-slate-200 text-text-primary placeholder:text-text-muted rounded-button pl-8 pr-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all outline-none"
                    placeholder="0"
                    value={discountAmount || ""}
                    onChange={(e) =>
                      setDiscountAmount(
                        Math.max(0, parseInt(e.target.value) || 0),
                      )
                    }
                  />
                </div>
                {discountAmount > subtotal && (
                  <p className="text-xs text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      warning
                    </span>
                    Discount exceeds subtotal
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Notes
                </label>
                <textarea
                  className="w-full bg-white border border-slate-200 text-text-primary placeholder:text-text-muted rounded-button px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all resize-none min-h-[100px]"
                  placeholder="Add delivery instructions or internal notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-secondary-600 rounded-card shadow-soft-lg p-8 text-white relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="relative z-10">
              <h4 className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1">
                Order Total
              </h4>
              <p className="text-4xl font-black mb-4">
                {formatCurrencyK(grandTotal)}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold bg-white/20 w-fit px-3 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                <span className="material-symbols-outlined text-[16px]">
                  shopping_cart
                </span>
                {items.length} items added
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white backdrop-blur-sm rounded-card shadow-soft-lg border border-slate-200 hover:border-primary-300 hover:shadow-soft-xl transition-all p-8 z-10">
            <h3 className="text-xl font-black text-text-primary mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-600 fill-1">
                shopping_basket
              </span>
              Add Items
            </h3>

            <div className="flex flex-col md:flex-row gap-6 items-end bg-background-soft p-6 rounded-card border border-slate-200">
              <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary-700">
                  Select Fish / Product
                </label>
                <div className="relative group" ref={fishDropdownRef}>
                  <div className="flex items-center w-full bg-white border border-slate-200 rounded-button px-4 py-3 shadow-sm focus-within:ring-4 focus-within:ring-primary-400/30 transition-all">
                    <span className="material-symbols-outlined text-primary-600 mr-3 text-[20px]">
                      set_meal
                    </span>
                    <input
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-text-primary placeholder:text-text-muted focus:ring-0 outline-none"
                      placeholder="Start typing product name..."
                      type="text"
                      value={searchFish}
                      onChange={(e) => {
                        setSearchFish(e.target.value);
                        setShowFishDropdown(true);
                      }}
                      onFocus={() => setShowFishDropdown(true)}
                    />
                    {selectedFishId > 0 &&
                      getStockForFish(selectedFishId) < 30 && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                          Warning: Low Stock
                        </span>
                      )}
                  </div>
                  {showFishDropdown && searchFish && (
                    <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-card shadow-soft-lg max-h-48 overflow-y-auto">
                      {filteredFishes.slice(0, 5).map((fish) => {
                        const stock = getStockForFish(fish.id);
                        const price =
                          saleType === "wholesale"
                            ? Number(fish.wholesale_price || 0)
                            : Number(fish.retail_price || 0);
                        return (
                          <button
                            key={fish.id}
                            disabled={stock <= 0}
                            className={`w-full px-4 py-3 text-left text-sm font-medium text-text-primary flex justify-between items-center ${
                              stock <= 0
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-slate-50"
                            }`}
                            onClick={() => {
                              if (stock <= 0) {
                                alert("This product is out of stock");
                                return;
                              }
                              setSelectedFishId(fish.id);
                              setSearchFish(
                                `${fish.name}${
                                  fish.size ? ` (${fish.size})` : ""
                                }`,
                              );
                              setUnitPrice(price);
                              setShowFishDropdown(false);
                            }}
                          >
                            <span>
                              {fish.name} {fish.size ? `(${fish.size})` : ""}
                              {stock <= 0 && (
                                <span className="ml-2 text-xs text-red-500 font-bold">
                                  (Out of stock)
                                </span>
                              )}
                            </span>
                            <span
                              className={`text-xs ${
                                stock > 30
                                  ? "text-green-500"
                                  : stock > 0
                                    ? "text-amber-500"
                                    : "text-red-500"
                              }`}
                            >
                              {stock} pcs | {formatCurrencyK(price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-32 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary-700">
                  Quantity (pieces)
                </label>
                <input
                  className="w-full bg-white border border-slate-200 text-text-primary rounded-button px-4 py-3 text-sm font-bold text-center focus:ring-4 focus:ring-primary-400/30 transition-all shadow-sm"
                  type="number"
                  value={quantity || ""}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div className="w-full md:w-32 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary-700">
                  Price / piece
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600 text-xs font-bold">
                    K
                  </span>
                  <input
                    className="w-full bg-white border border-slate-200 text-text-primary rounded-button pl-6 pr-3 py-3 text-sm font-bold"
                    type="number"
                    step="0.01"
                    value={unitPrice || ""}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <button
                onClick={handleAddItem}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-black uppercase tracking-widest text-xs rounded-button hover:shadow-soft-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add_shopping_cart
                </span>
                Add
              </button>
            </div>

            {hasLowStock && (
              <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-5 text-amber-800">
                <span className="material-symbols-outlined text-amber-600 mt-0.5">
                  warning
                </span>
                <div>
                  <p className="font-black uppercase tracking-widest text-xs">
                    Low Stock Warning
                  </p>
                  <p className="text-xs font-bold mt-1 text-amber-700/80 leading-relaxed">
                    Some items in your order have low stock levels. Please
                    verify availability.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white backdrop-blur-sm rounded-card shadow-soft-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-background-soft">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary-700">
                Order Items ({items.length})
              </h3>
              <button
                onClick={handleClearAll}
                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 hover:scale-105"
              >
                <span className="material-symbols-outlined text-sm">
                  delete_sweep
                </span>{" "}
                Clear All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-background-soft">
                    <th className="px-6 py-4 text-[10px] font-bold text-primary-700 uppercase tracking-widest w-12 text-center">
                      #
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-primary-700 uppercase tracking-widest">
                      Product
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-primary-700 uppercase tracking-widest text-right">
                      Unit Price
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-primary-700 uppercase tracking-widest text-center">
                      Qty (pieces)
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-primary-700 uppercase tracking-widest text-right">
                      Total
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-primary-700 uppercase tracking-widest text-center w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-bold">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-text-muted"
                      >
                        No items added yet
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-slate-50 transition-colors ${
                          item.available_stock < 30 ? "bg-amber-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-xs text-text-muted text-center">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-card bg-background-soft border border-primary-200 flex items-center justify-center text-xl">
                              🐟
                            </div>
                            <div>
                              <p className="text-sm text-text-primary font-manrope">
                                {item.fish_name}
                              </p>
                              <div
                                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                                  item.available_stock < 30
                                    ? "text-amber-600"
                                    : "text-text-muted"
                                }`}
                              >
                                {item.available_stock < 30 && (
                                  <span className="material-symbols-outlined text-[14px]">
                                    warning
                                  </span>
                                )}
                                Stock: {item.available_stock} pieces
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary text-right">
                          {formatCurrencyK(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-primary text-center font-black">
                          {item.quantity.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-600 text-right font-black">
                          {formatCurrencyK(item.quantity * item.unit_price)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-text-muted hover:text-red-500 transition-colors p-2 rounded-button hover:bg-red-50 hover:scale-105"
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

            <div className="bg-background-soft p-8 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row justify-end items-end gap-12">
                <div className="text-right space-y-3 min-w-[200px]">
                  <div className="flex justify-between text-xs font-bold text-text-secondary uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-text-primary">
                      {formatCurrencyK(subtotal)}
                    </span>
                  </div>
                  {/* Discount */}
                  <div className="flex justify-between text-xs font-black text-emerald-600 uppercase tracking-widest">
                    <span>Discount</span>
                    <span>-{formatCurrencyK(discountAmount)}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-2"></div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black text-text-primary uppercase tracking-widest">
                      Total
                    </span>
                    <span className="text-3xl font-black text-primary-600">
                      {formatCurrencyK(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-card shadow-soft-lg max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-text-primary">
                Add New Customer
              </h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Name *
                </label>
                <input
                  className="w-full bg-white border border-slate-200 text-text-primary placeholder:text-text-muted rounded-button px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all outline-none"
                  placeholder="Customer name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Email
                </label>
                <input
                  className="w-full bg-white border border-slate-200 text-text-primary placeholder:text-text-muted rounded-button px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all outline-none"
                  placeholder="customer@email.com"
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Social
                </label>
                <input
                  className="w-full bg-white border border-slate-200 text-text-primary placeholder:text-text-muted rounded-button px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all outline-none"
                  placeholder="Instagram / Facebook / Zalo"
                  value={newCustomerSocial}
                  onChange={(e) => setNewCustomerSocial(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Phone
                </label>
                <input
                  className="w-full bg-white border border-slate-200 text-text-primary placeholder:text-text-muted rounded-button px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all outline-none"
                  placeholder="+1 234 567 890"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-700">
                  Address
                </label>
                <textarea
                  className="w-full bg-white border border-slate-200 text-text-primary placeholder:text-text-muted rounded-button px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-400/30 transition-all outline-none resize-none"
                  placeholder="Customer address"
                  rows={2}
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 px-6 py-3 rounded-button border border-slate-200 text-text-secondary font-bold text-sm hover:bg-slate-50 hover:text-text-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                disabled={creatingCustomer || !newCustomerName.trim()}
                className="flex-1 px-6 py-3 rounded-button bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold text-sm hover:shadow-soft-lg transition-all disabled:opacity-50"
              >
                {creatingCustomer ? "Creating..." : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSaleOrder;
