"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ company_name: "", mc_number: "", dot_number: "", dispatcher_name: "", dispatcher_phone: "", dispatcher_email: "", status: "Active" });
  const [saving, setSaving] = useState(false);

  const fetchCarriers = async () => {
    setLoading(true);
    const { data } = await supabase.from('carriers').select('*').order('created_at', { ascending: false });
    if (data) setCarriers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const filteredCarriers = carriers.filter(c => 
    c.company_name?.toLowerCase().includes(search.toLowerCase()) || 
    c.mc_number?.includes(search) ||
    c.dispatcher_phone?.includes(search)
  );

  const openModal = (carrier?: any) => {
    if (carrier) {
      setEditingId(carrier.id);
      setForm(carrier);
    } else {
      setEditingId(null);
      setForm({ company_name: "", mc_number: "", dot_number: "", dispatcher_name: "", dispatcher_phone: "", dispatcher_email: "", status: "Active" });
    }
    setShowModal(true);
  };

  const saveCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editingId) {
      await supabase.from("carriers").update(form).eq("id", editingId);
    } else {
      await supabase.from("carriers").insert([form]);
    }
    await fetchCarriers();
    setShowModal(false);
    setSaving(false);
  };

  const deleteCarrier = async (id: string) => {
    if (confirm("Are you sure you want to delete this carrier?")) {
      await supabase.from("carriers").delete().eq("id", id);
      fetchCarriers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Carriers Network</h2>
          <p className="text-foreground/70 mt-1">Manage and vet your network of transport carriers.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-dark-navy font-bold rounded-xl hover:bg-electric-cyan transition-colors shadow-[0_0_15px_rgba(0,144,208,0.3)]">
          <Plus size={18} />
          <span>Add Carrier</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-border p-6">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
          <input 
            type="text" 
            placeholder="Search carriers by name, MC#, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm transition-all"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-foreground/50">Loading carriers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-foreground/5">
                  <th className="p-4 font-semibold text-sm">Company Name</th>
                  <th className="p-4 font-semibold text-sm">MC / DOT</th>
                  <th className="p-4 font-semibold text-sm">Dispatcher</th>
                  <th className="p-4 font-semibold text-sm">Contact</th>
                  <th className="p-4 font-semibold text-sm">Routes</th>
                  <th className="p-4 font-semibold text-sm">Status</th>
                  <th className="p-4 font-semibold text-sm w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarriers.length > 0 ? (
                  filteredCarriers.map((carrier) => (
                    <tr key={carrier.id} className="border-b border-border/50 hover:bg-foreground/5 transition-colors">
                      <td className="p-4 font-bold text-sm text-neon-blue">{carrier.company_name}</td>
                      <td className="p-4 text-sm">
                        <div className="font-medium">MC: {carrier.mc_number || 'N/A'}</div>
                        <div className="text-xs text-foreground/50">DOT: {carrier.dot_number || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-sm">{carrier.dispatcher_name || 'N/A'}</td>
                      <td className="p-4 text-sm">
                        <div>{carrier.dispatcher_phone}</div>
                        <div className="text-xs text-foreground/50">{carrier.dispatcher_email}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-electric-cyan max-w-[150px] truncate">
                        {carrier.routes || 'Any'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${carrier.status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {carrier.status}
                        </span>
                      </td>
                      <td className="p-4 flex gap-3 text-foreground/50">
                        <button onClick={() => openModal(carrier)} className="hover:text-neon-blue"><Edit size={16} /></button>
                        <button onClick={() => deleteCarrier(carrier.id)} className="hover:text-red-500"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-foreground/50">
                      No carriers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-neon-blue">{editingId ? "Edit Carrier" : "Add New Carrier"}</h3>
            <form onSubmit={saveCarrier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">MC Number</label>
                  <input value={form.mc_number} onChange={e => setForm({...form, mc_number: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">DOT Number</label>
                  <input value={form.dot_number} onChange={e => setForm({...form, dot_number: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Dispatcher Name</label>
                  <input value={form.dispatcher_name} onChange={e => setForm({...form, dispatcher_name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input required value={form.dispatcher_phone} onChange={e => setForm({...form, dispatcher_phone: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={form.dispatcher_email} onChange={e => setForm({...form, dispatcher_email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Routes (Lanes)</label>
                  <input value={form.routes || ''} onChange={e => setForm({...form, routes: e.target.value})} placeholder="e.g. FL -> NY, TX -> CA" className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm">
                    <option value="Active">Active</option>
                    <option value="Do Not Use">Do Not Use</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-border hover:bg-foreground/5 font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl bg-neon-blue text-white font-bold hover:bg-electric-cyan text-sm">{saving ? "Saving..." : "Save Carrier"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
