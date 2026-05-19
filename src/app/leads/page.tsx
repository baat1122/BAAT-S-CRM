"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Search, FileText, Archive, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

import { Database } from "@/lib/database.types";

type Lead = Database['public']['Tables']['leads']['Row'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,vehicle_name.ilike.%${search}%`);
      }

      const { data, count, error } = await query;

      if (error && error.code === '42P01') {
        setHasError(true);
      } else if (data) {
        setLeads(data);
        if (count !== null) setTotalCount(count);
      } else {
        // Fallback if is_archived doesn't exist
        const { data: fallbackData } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).range(from, to);
        setLeads(fallbackData || []);
      }
      setLoading(false);
    }
    
    // Debounce search slightly
    const timeoutId = setTimeout(() => {
      fetchLeads();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [page, search]);

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from('leads').update({ is_archived: true }).eq('id', id);
    if (!error) {
      setLeads(leads.filter(l => l.id !== id));
    }
  };

  const handleDeleteClick = (id: string) => {
    setLeadToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    const { error } = await supabase.from('leads').delete().eq('id', leadToDelete);
    if (!error) {
      setLeads(leads.filter(l => l.id !== leadToDelete));
      setTotalCount(c => c - 1);
    }
    setLeadToDelete(null);
  };

  // Client side filter removed because we do it server-side now
  const filteredLeads = leads;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leads (Quotes)</h2>
          <p className="text-foreground/70 mt-1">Manage incoming transport quotes before they become orders.</p>
        </div>
        <a href="/leads/new" className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-dark-navy font-bold rounded-xl hover:bg-electric-cyan transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          <Plus size={18} />
          <span>New Quote</span>
        </a>
      </div>

      {hasError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-2">Database Setup Required</h3>
          <p>The `leads` table does not exist in your Supabase database yet. Please run the schema scripts in your Supabase SQL Editor.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-border p-6">
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
            <input 
              type="text" 
              placeholder="Search leads by customer, vehicle, or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm transition-all"
            />
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-foreground/50">Loading leads...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-foreground/5">
                    <th className="p-4 font-semibold text-sm">Customer</th>
                    <th className="p-4 font-semibold text-sm">Vehicle</th>
                    <th className="p-4 font-semibold text-sm">Route</th>
                    <th className="p-4 font-semibold text-sm">Quoted Price</th>
                    <th className="p-4 font-semibold text-sm">Status</th>
                    <th className="p-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border/50 hover:bg-foreground/5 transition-colors">
                        <td className="p-4 text-sm">
                          <div className="font-medium text-neon-blue">{lead.customer_name}</div>
                          <div className="text-xs text-foreground/50">{lead.phone || lead.email}</div>
                        </td>
                        <td className="p-4 text-sm font-medium">{lead.vehicle_name}</td>
                        <td className="p-4 text-sm">
                          <div className="text-xs text-foreground/70">From: <span className="font-medium text-foreground">{lead.pickup_location}</span></div>
                          <div className="text-xs text-foreground/70">To: <span className="font-medium text-foreground">{lead.dropoff_location}</span></div>
                        </td>
                        <td className="p-4 text-sm font-bold text-green-500">${lead.estimated_price || '0'}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 text-xs font-semibold border border-yellow-500/30">
                            {lead.status || 'New'}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2">
                          <a href={`/leads/${lead.id}`} className="p-1.5 bg-background border border-border rounded hover:bg-foreground/10 text-electric-cyan" title="View">
                            <FileText size={14} />
                          </a>
                          <button onClick={() => handleArchive(lead.id)} className="p-1.5 bg-background border border-border rounded hover:bg-foreground/10 text-foreground/70 hover:text-foreground" title="Archive">
                            <Archive size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(lead.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-foreground/50">
                        No leads found matching "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-sm text-foreground/70">
              Showing {leads.length === 0 ? 0 : page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} leads
            </div>
            <div className="flex gap-2">
              <button 
                disabled={page === 0} 
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-foreground/5 hover:bg-foreground/10 rounded-md disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={(page + 1) * PAGE_SIZE >= totalCount}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-foreground/5 hover:bg-foreground/10 rounded-md disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setLeadToDelete(null); }}
        onConfirm={confirmDelete}
        title="Delete Lead"
        message="Are you sure you want to permanently delete this lead? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
