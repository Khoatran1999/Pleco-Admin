import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createFish,
  updateFish,
  Fish,
  setSelected,
} from "../store/features/fish/fishSlice";
import { fetchCategories } from "../store/features/category/categorySlice";

interface NewFishProps {
  onBack: () => void;
  editMode?: boolean;
}

const NewFish: React.FC<NewFishProps> = ({ onBack, editMode = false }) => {
  const dispatch = useAppDispatch();
  const { selected: editingFish } = useAppSelector((state) => state.fish);
  const { data: categories } = useAppSelector((state) => state.category);

  const [form, setForm] = useState({
    sku: "",
    name: "",
    scientific_name: "",
    size: "",
    category_id: 0,
    description: "",
    stock: 0,
    retail_price: 0,
    wholesale_price: 0,
    cost_price: 0,
    unit: "pieces",
    image: "",
    min_stock: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (editMode && editingFish) {
      setForm({
        sku: editingFish.sku || "",
        name: editingFish.name || "",
        scientific_name: editingFish.scientific_name || "",
        size: editingFish.size || "",
        category_id: editingFish.category_id || 0,
        stock: editingFish.stock || 0,
        description: editingFish.description || "",
        retail_price: editingFish.retail_price || 0,
        wholesale_price: editingFish.wholesale_price || 0,
        cost_price: editingFish.cost_price || 0,
        unit: editingFish.unit || "pieces",
        image: editingFish.image || "",
        min_stock: editingFish.min_stock || 10,
      });
    }
  }, [editMode, editingFish]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category_id) {
      alert("Please fill in Name and Category");
      return;
    }

    setSubmitting(true);
    try {
      if (editMode && editingFish) {
        await dispatch(updateFish({ id: editingFish.id, data: form })).unwrap();
        alert("Fish updated successfully!");
      } else {
        const created = await dispatch(createFish(form)).unwrap();
        if ((!form.sku || form.sku.trim() === "") && created?.sku) {
          alert(`Fish created successfully! Generated SKU: ${created.sku}`);
        } else {
          alert("Fish created successfully!");
        }
      }
      dispatch(setSelected(null));
      onBack();
    } catch (error: any) {
      alert(error || "Failed to save fish");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    dispatch(setSelected(null));
    onBack();
  };

  const handleDuplicate = async () => {
    if (!form.name || !form.category_id) {
      alert("Name and Category are required to duplicate.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, sku: "" } as any;
      // Remove id if present
      delete payload.id;

      const created = await dispatch(createFish(payload)).unwrap();
      if (created?.sku) {
        alert(`Duplicated fish created. SKU: ${created.sku}`);
      } else {
        alert("Duplicated fish created.");
      }
      dispatch(setSelected(null));
      onBack();
    } catch (err: any) {
      alert(err?.message || "Failed to duplicate fish");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col gap-4">
        <nav className="flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <button
            onClick={handleCancel}
            className="hover:text-primary transition-colors"
          >
            Inventory
          </button>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-800">
            {editMode ? "Edit Fish" : "New Fish"}
          </span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {editMode ? "Edit Fish" : "Add New Fish"}
          </h2>
          {editMode && (
            <button
              onClick={handleDuplicate}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all"
            >
              Duplicate
            </button>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
            <span className="material-symbols-outlined text-primary text-2xl fill-1">
              set_meal
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Basic Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                SKU
              </label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="e.g. SKU-001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="e.g. Clownfish"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Scientific Name
              </label>
              <input
                name="scientific_name"
                value={form.scientific_name}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="e.g. Amphiprion ocellaris"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Size *
              </label>
              <input
                name="size"
                value={form.size}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="e.g. S, M, L, XL or 5cm, 10cm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Category *
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                required
              >
                <option value={0}>Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all resize-none min-h-[100px]"
                placeholder="Describe the fish..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Image URL
              </label>
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Unit
              </label>
              <input
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="e.g. pieces"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
            <span className="material-symbols-outlined text-primary text-2xl fill-1">
              payments
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Pricing & Stock
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Retail Price ($) *
              </label>
              <input
                name="retail_price"
                type="number"
                step="0.01"
                value={form.retail_price || ""}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Wholesale Price ($) *
              </label>
              <input
                name="wholesale_price"
                type="number"
                step="0.01"
                value={form.wholesale_price || ""}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Cost Price ($)
              </label>
              <input
                name="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={form.cost_price || ""}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Stock Quantity
              </label>
              <input
                name="stock"
                type="number"
                step="1"
                min="0"
                value={form.stock || ""}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Min Stock Alert
              </label>
              <input
                name="min_stock"
                type="number"
                value={form.min_stock || ""}
                onChange={handleChange}
                className="w-full rounded-xl border-none bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-8 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : editMode
              ? "Update Fish"
              : "Create Fish"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewFish;
