import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../store/features/category/categorySlice";

const Categories: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: categories, loading } = useAppSelector((s) => s.category);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const openNew = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setShowModal(true);
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert("Name is required");
    if (editing) {
      await dispatch(
        updateCategory({ id: editing.id, data: { name, description } }),
      );
    } else {
      await dispatch(createCategory({ name, description }));
    }
    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this category?")) return;
    await dispatch(deleteCategory(id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-text-primary">Categories</h2>
          <p className="text-sm text-text-secondary">
            Manage fish categories ({categories.length} items)
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-button hover:shadow-soft-lg transition-all"
        >
          New Category
        </button>
      </div>

      <div className="bg-white backdrop-blur-sm rounded-card shadow-soft border border-slate-200 p-4 hover:border-primary-300 hover:shadow-soft-lg transition-all">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((c: any) => (
              <div
                key={c.id}
                className="p-4 border border-slate-200 bg-white rounded-card flex flex-col gap-2 hover:border-primary-300 hover:shadow-soft transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-text-primary">{c.name}</div>
                    <div className="text-xs text-primary-600 font-medium">
                      {c.fish_count ?? 0} products
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-xs text-text-muted">{c.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-card p-6 w-full max-w-lg shadow-soft-xl">
            <h3 className="text-xl font-bold mb-4 text-text-primary">
              {editing ? "Edit" : "New"} Category
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-text-primary">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-background-soft text-text-primary rounded-button focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-primary">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-background-soft text-text-primary rounded-button focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-text-secondary rounded-button hover:border-slate-300 hover:bg-background-muted transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-button hover:from-primary-600 hover:to-secondary-600 hover:shadow-soft-lg transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
