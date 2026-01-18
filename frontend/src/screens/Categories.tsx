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
          <h2 className="text-3xl font-black text-white">Categories</h2>
          <p className="text-sm text-cyan-300">
            Manage fish categories ({categories.length} items)
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-2xl hover:shadow-cyan-500/30 transition-all"
        >
          New Category
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-sm border border-cyan-500/20 p-4 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((c: any) => (
              <div
                key={c.id}
                className="p-4 border border-slate-700/50 bg-slate-800/50 rounded-lg flex flex-col gap-2 hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-xs text-cyan-400">
                      {c.fish_count ?? 0} products
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-sm text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-400">{c.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-cyan-500/20">
            <h3 className="text-xl font-bold mb-4 text-white">
              {editing ? "Edit" : "New"} Category
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-cyan-400">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700/50 bg-slate-800/50 text-slate-100 rounded-lg focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-cyan-400">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700/50 bg-slate-800/50 text-slate-100 rounded-lg focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-700/50 text-slate-300 rounded-lg hover:border-cyan-500/50 hover:text-cyan-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-2xl hover:shadow-cyan-500/30 transition-all"
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
