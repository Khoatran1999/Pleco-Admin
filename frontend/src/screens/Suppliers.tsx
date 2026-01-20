import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../store/features/supplier/supplierSlice";
import { API_BASE_URL } from "../services/api";

const Suppliers: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: suppliers, loading, error } = useAppSelector((s) => s.supplier);

  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchSuppliers());
  }, [dispatch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setAvatarFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } else {
      setAvatarPreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("contact_person", form.contact_person);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("address", form.address);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    if (editingId) {
      await dispatch(updateSupplier({ id: editingId, data: formData } as any));
    } else {
      await dispatch(createSupplier(formData));
    }
    setForm({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
    });
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview("");
    }
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this supplier?")) {
      dispatch(deleteSupplier(id));
    }
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      name: s.name || "",
      contact_person: s.contact_person || "",
      email: s.email || "",
      phone: s.phone || "",
      address: s.address || "",
    });
    if (s.avatar) {
      setAvatarPreview(s.avatar);
      setAvatarFile(null);
    } else {
      setAvatarPreview(
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          s.name,
        )}&background=E5E7EB&color=111827`,
      );
      setAvatarFile(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
    });
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview("");
    }
    setAvatarFile(null);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-text-primary">Suppliers</h2>
          <p className="text-text-secondary mt-1">
            Manage your suppliers and contacts ({suppliers.length} items).
          </p>
        </div>
      </div>

      <div className="bg-white backdrop-blur-sm rounded-card p-6 shadow-soft border border-slate-200 hover:border-primary-300 hover:shadow-soft-lg transition-all">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-primary-200 bg-background-soft">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center text-text-muted">
                  No
                </span>
              )}
            </div>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-primary-600"
            />
          </div>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Supplier Name"
            className="p-3 rounded-button border border-slate-200 bg-white text-text-primary placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
          />
          <input
            name="contact_person"
            value={form.contact_person}
            onChange={handleChange}
            placeholder="Contact Person"
            className="p-3 rounded-button border border-slate-200 bg-white text-text-primary placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
          />
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="p-3 rounded-button border border-slate-200 bg-white text-text-primary placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
          />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="p-3 rounded-button border border-slate-200 bg-white text-text-primary placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
          />
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
            className="p-3 rounded-button border border-slate-200 bg-white text-text-primary placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all md:col-span-2"
          />
          <div className="flex items-center gap-3 md:col-span-3">
            <button
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-button font-bold hover:shadow-soft-lg transition-all"
              type="submit"
            >
              {editingId ? "Update Supplier" : "Add Supplier"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-3 rounded-button border border-slate-200 text-text-secondary hover:border-primary-400 hover:text-primary-600 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {error && <p className="text-red-500 mt-3">{error}</p>}
      </div>

      <div className="bg-white backdrop-blur-sm rounded-card p-6 shadow-soft-lg border border-slate-200 hover:border-primary-300 hover:shadow-soft-xl transition-all overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-primary-600 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
              <th className="px-4 py-2">Avatar</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-text-primary">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  No suppliers
                </td>
              </tr>
            ) : (
              suppliers.map((s: any) => {
                const backendBase = API_BASE_URL.replace(/\/api$/, "");
                const avatarUrl = (() => {
                  if (s.avatar && s.avatar.length > 0) {
                    // if already absolute URL
                    if (/^https?:\/\//i.test(s.avatar)) return s.avatar;
                    // if starts with slash, join with backend base
                    if (s.avatar.startsWith("/"))
                      return `${backendBase}${s.avatar}`;
                    // otherwise assume relative path
                    return `${backendBase}/${s.avatar}`;
                  }
                  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    s.name,
                  )}&background=E5E7EB&color=111827`;
                })();
                return (
                  <tr
                    key={s.id}
                    className="border-t border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-primary-200">
                        <img
                          src={avatarUrl}
                          alt={s.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-text-primary">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {s.contact_person}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{s.email}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.phone}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {s.address}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-3">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-primary-600 font-bold hover:text-primary-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-500 font-bold hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Suppliers;
