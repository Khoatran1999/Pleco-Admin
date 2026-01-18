import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../store/features/customer/customerSlice";

const Customers: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: customers, loading } = useAppSelector((s) => s.customer);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [social, setSocial] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomers({}));
  }, [dispatch]);

  useEffect(() => {
    if (!showModal) {
      setEditing(null);
      setName("");
      setEmail("");
      setPhone("");
      setSocial("");
      setAddress("");
    }
  }, [showModal]);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setName(c.name || "");
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setSocial(c.social || "");
    setAddress(c.address || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert("Name is required");
    setSaving(true);
    try {
      if (editing) {
        await dispatch(
          updateCustomer({
            id: editing.id,
            data: { name, email, phone, social, address },
          }),
        ).unwrap();
      } else {
        await dispatch(
          createCustomer({
            name,
            email: email || undefined,
            phone: phone || undefined,
            social: social || undefined,
            address: address || undefined,
          }),
        ).unwrap();
      }
      setShowModal(false);
      dispatch(fetchCustomers({}));
    } catch (err: any) {
      alert(err?.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await dispatch(deleteCustomer(id)).unwrap();
      dispatch(fetchCustomers({}));
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    }
  };

  const filtered = customers.filter((c: any) =>
    String(c.name || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Customers</h2>
          <p className="text-slate-500">
            Manage customer records ({customers.length} items).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2 text-sm focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-cyan-500/30 transition-all"
          >
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-sm border border-purple-500/20 hover:border-purple-400/40 hover:shadow-2xl hover:shadow-purple-500/20 transition-all overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800/50">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Social</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-t border-slate-800/30 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-white">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {c.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {c.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {c.social || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="px-3 py-1 text-sm bg-slate-800/50 text-cyan-400 rounded hover:bg-slate-700/50 hover:text-cyan-300 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 hover:text-red-300 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800/50">
              <h3 className="text-xl font-bold text-white">
                {editing ? "Edit Customer" : "Add Customer"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-cyan-400">
                  Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-cyan-400">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-cyan-400">
                  Social
                </label>
                <input
                  value={social}
                  onChange={(e) => setSocial(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-cyan-400">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-cyan-400">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800/50 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-700/50 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-cyan-500/30 transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
