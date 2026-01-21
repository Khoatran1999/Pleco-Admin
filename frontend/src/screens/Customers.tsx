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
  const { data: customers } = useAppSelector((s) => s.customer);

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
          <h2 className="text-3xl font-black text-text-primary">Customers</h2>
          <p className="text-text-secondary">
            Manage customer records ({customers.length} items).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border border-slate-200 text-text-primary placeholder:text-text-muted rounded-xl px-4 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
          />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-button font-bold hover:shadow-soft-lg transition-all"
          >
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white backdrop-blur-sm rounded-card shadow-soft border border-slate-200 hover:border-primary-300 hover:shadow-soft-lg transition-all overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background-soft text-[10px] font-bold text-primary-700 uppercase tracking-wider border-b border-slate-200">
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
                  className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-text-primary">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {c.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {c.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {c.social || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="px-3 py-1 text-sm bg-primary-50 text-primary-600 rounded hover:bg-primary-100 hover:text-primary-700 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 hover:text-red-700 transition-all"
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-primary-500/20 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-text-primary">
                {editing ? "Edit Customer" : "Add Customer"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-primary-700">
                  Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background-soft border border-slate-200 text-text-primary rounded-xl px-4 py-3 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-primary-700">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background-soft border border-slate-200 text-text-primary rounded-xl px-4 py-3 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-primary-700">
                  Social
                </label>
                <input
                  value={social}
                  onChange={(e) => setSocial(e.target.value)}
                  className="w-full bg-background-soft border border-slate-200 text-text-primary rounded-xl px-4 py-3 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-primary-700">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background-soft border border-slate-200 text-text-primary rounded-xl px-4 py-3 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-primary-700">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-background-soft border border-slate-200 text-text-primary rounded-xl px-4 py-3 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-2xl hover:shadow-primary-500/30 transition-all disabled:opacity-50"
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
