"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Filter, MoreHorizontal, Search, FileText, Archive, Trash2 } from "lucide-react";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

import { Database } from "@/lib/database.types";

type Order = Database['public']['Tables']['orders']['Row'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,order_id.ilike.%${search}%,vehicle_name.ilike.%${search}%`);
      }
      
      if (statusFilter !== "All") {
        query = query.eq('status', statusFilter);
      }

      const { data, count } = await query;
      
      if (data) {
        setOrders(data);
        if (count !== null) setTotalCount(count);
      } else {
        const { data: fallbackData } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).range(from, to);
        setOrders(fallbackData || []);
      }
      setLoading(false);
    }
    
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [page, search, statusFilter]);

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from('orders').update({ is_archived: true }).eq('id', id);
    if (!error) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    const { error } = await supabase.from('orders').delete().eq('id', orderToDelete);
    if (!error) {
      setOrders(orders.filter(o => o.id !== orderToDelete));
      setTotalCount(c => c - 1);
    }
    setOrderToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'posted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'dispatched': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'picked up': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'refunded': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-foreground/10 text-foreground border-border';
    }
  };

  // Client-side filtering removed because we handle it server-side
  const filteredOrders = orders;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
          <p className="text-foreground/70 mt-1">View and manage all active vehicle transports.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/orders/new" className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-white font-bold rounded-xl hover:bg-electric-cyan transition-colors shadow-[0_0_15px_rgba(0,144,208,0.3)]">
            <Plus size={18} />
            <span>New Order</span>
          </a>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-border p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID, location, or vehicle..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Posted">Posted</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Picked Up">Picked Up</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-foreground/50">Loading orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-foreground/5">
                  <th className="p-4 font-semibold text-sm">Order ID</th>
                  <th className="p-4 font-semibold text-sm">Vehicle</th>
                  <th className="p-4 font-semibold text-sm">Route</th>
                  <th className="p-4 font-semibold text-sm">Status</th>
                  <th className="p-4 font-semibold text-sm">Agent</th>
                  <th className="p-4 font-semibold text-sm">Profit</th>
                  <th className="p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-foreground/5 transition-colors group">
                      <td className="p-4 font-medium text-sm">
                        <Link href={`/orders/${order.id}`} className="text-neon-blue hover:text-electric-cyan hover:underline transition-colors font-bold">
                          {order.order_id}
                        </Link>
                      </td>
                      <td className="p-4 text-sm">{order.vehicle_name}</td>
                      <td className="p-4 text-sm">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[200px]">{order.pickup_location}</span>
                          <span className="text-foreground/50 text-xs">to {order.dropoff_location}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {order.status || 'Posted'}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{order.agent_name || 'Unassigned'}</td>
                      <td className="p-4 text-sm font-medium text-green-500">${order.profit || '0'}</td>
                      <td className="p-4 flex gap-2">
                        <Link href={`/orders/${order.id}`} className="p-1.5 bg-background border border-border rounded hover:bg-foreground/10 text-electric-cyan" title="View">
                          <FileText size={14} />
                        </Link>
                        <button onClick={() => handleArchive(order.id)} className="p-1.5 bg-background border border-border rounded hover:bg-foreground/10 text-foreground/70 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Archive">
                          <Archive size={14} />
                        </button>
                        <button onClick={() => handleDeleteClick(order.id)} className="p-1.5 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-foreground/50">
                      No orders found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-foreground/70">
                Showing {orders.length === 0 ? 0 : page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} orders
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
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setOrderToDelete(null); }}
        onConfirm={confirmDelete}
        title="Delete Order"
        message="Are you sure you want to permanently delete this order? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
