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
        updateCategory({ id: editing.id, data: { name, description } })
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
          <h2 className="text-3xl font-black">Categories</h2>
          <p className="text-sm text-slate-500">Manage fish categories</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-primary text-white rounded-xl"
        >
          New Category
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((c: any) => (
              <div
                key={c.id}
                className="p-4 border rounded-lg flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-slate-400">
                      {c.fish_count ?? 0} products
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-sm text-slate-600 hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-500">{c.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">
              {editing ? "Edit" : "New"} Category
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary text-white rounded-lg"
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
