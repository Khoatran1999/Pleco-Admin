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
          })
        ).unwrap();
      } else {
        await dispatch(
          createCustomer({
            name,
            email: email || undefined,
            phone: phone || undefined,
            social: social || undefined,
            address: address || undefined,
          })
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
      .includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Customers</h2>
          <p className="text-slate-500">Manage customer records.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm"
          />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-xl font-bold"
          >
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Social</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-t border-slate-50">
                  <td className="px-4 py-3 font-bold">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.social || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="px-3 py-1 text-sm bg-slate-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">
                {editing ? "Edit Customer" : "Add Customer"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Social
                </label>
                <input
                  value={social}
                  onChange={(e) => setSocial(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-xl bg-primary text-white"
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
