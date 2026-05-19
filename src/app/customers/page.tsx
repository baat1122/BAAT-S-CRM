"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Search, Mail, Phone, Archive, Trash2 } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('is_archived', false) // Only show non-archived
      .order('created_at', { ascending: false });
    
    // If the column doesn't exist yet, it will fail gracefully and we fetch all
    if (!data) {
      const { data: fallbackData } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      setCustomers(fallbackData || []);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  }

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from('customers').update({ is_archived: true }).eq('id', id);
    if (!error) {
      setCustomers(customers.filter(c => c.id !== id));
    } else {
      alert("Please run the Phase 6 SQL script to enable archiving.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this customer? This cannot be undone.")) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    customer.email?.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-foreground/70 mt-1">Manage your customer relationships and contact info.</p>
        </div>
        <a href="/customers/new" className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-white font-bold rounded-xl hover:bg-electric-cyan transition-colors shadow-[0_0_15px_rgba(0,144,208,0.3)]">
          <Plus size={18} />
          <span>Add Customer</span>
        </a>
      </div>

      <div className="glass-panel rounded-2xl border border-border p-6">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
          <input 
            type="text" 
            placeholder="Search customers by name, email, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm transition-all"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-foreground/50">Loading customers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-4 rounded-xl border border-border/50 bg-background/50 hover:border-neon-blue/50 transition-colors group relative">
                  
                  {/* Actions Dropdown / Icons */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleArchive(customer.id)} className="p-1.5 bg-background border border-border rounded hover:bg-foreground/10 text-foreground/70 hover:text-foreground" title="Archive">
                      <Archive size={14} />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="p-1.5 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 text-red-500" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-3 pr-16">
                    <div className="w-10 h-10 rounded-full bg-neon-blue/20 text-neon-blue flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {customer.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <h3 className="font-semibold text-sm group-hover:text-neon-blue transition-colors truncate">{customer.customer_name}</h3>
                      <p className="text-xs text-foreground/50">Customer</p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4 text-sm text-foreground/70">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-foreground/40 flex-shrink-0" />
                      <span className="truncate">{customer.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-foreground/40 flex-shrink-0" />
                      <span className="truncate">{customer.email || 'No email'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-foreground/50 border-2 border-dashed border-border rounded-xl">
                No customers found matching "{search}".
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
