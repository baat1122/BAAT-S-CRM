"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Download, Search, Archive, Trash2 } from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All");

  useEffect(() => {
    async function fetchPayments() {
      const { data } = await supabase
        .from('payments')
        .select('*, orders(order_id, customer_id, customers(customer_name))')
        .eq('is_archived', false)
        .order('payment_date', { ascending: false });
      
      if (data) {
        setPayments(data);
      } else {
        const { data: fallbackData } = await supabase.from('payments').select('*, orders(order_id, customer_id, customers(customer_name))').order('payment_date', { ascending: false });
        setPayments(fallbackData || []);
      }
      setLoading(false);
    }
    fetchPayments();
  }, []);

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from('payments').update({ is_archived: true }).eq('id', id);
    if (!error) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this payment record?")) return;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (!error) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.orders?.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      p.orders?.customers?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sender_name?.toLowerCase().includes(search.toLowerCase());
      
    let matchesDate = true;
    const pDate = new Date(p.payment_date);
    const now = new Date();
    
    if (dateFilter === "Today") {
      matchesDate = pDate.toDateString() === now.toDateString();
    } else if (dateFilter === "This Week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      matchesDate = pDate >= weekAgo;
    } else if (dateFilter === "This Month") {
      matchesDate = pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    }
    
    return matchesSearch && matchesDate;
  });

  const exportCSV = () => {
    const headers = "Invoice/Order,Customer,Sender Name,Date,Method,Amount Paid,Remaining\n";
    const rows = filteredPayments.map(p => {
      const invOrder = `${p.invoice_number || 'N/A'} / ${p.orders?.order_id || ''}`;
      const cust = p.orders?.customers?.customer_name || 'Unknown';
      const sender = p.sender_name || 'N/A';
      const date = new Date(p.payment_date).toLocaleDateString();
      return `"${invOrder}","${cust}","${sender}","${date}","${p.payment_method}",${p.amount_paid},${p.remaining_balance || 0}`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
          <p className="text-foreground/70 mt-1">Track incoming transactions and balances.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-border transition-colors text-sm font-bold text-neon-blue">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <a href="/payments/new" className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-white font-bold rounded-xl hover:bg-electric-cyan transition-colors shadow-[0_0_15px_rgba(0,144,208,0.3)]">
            <Plus size={18} />
            <span>Record Payment</span>
          </a>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-border p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID, customer, or sender..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm transition-all"
            />
          </div>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-foreground/50">Loading payments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-foreground/5">
                  <th className="p-4 font-semibold text-sm">Invoice / Order</th>
                  <th className="p-4 font-semibold text-sm">Customer</th>
                  <th className="p-4 font-semibold text-sm">Date</th>
                  <th className="p-4 font-semibold text-sm">Method</th>
                  <th className="p-4 font-semibold text-sm">Amount Paid</th>
                  <th className="p-4 font-semibold text-sm">Remaining (Sender)</th>
                  <th className="p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/50 hover:bg-foreground/5 transition-colors group">
                      <td className="p-4 text-sm">
                        <div className="font-medium text-neon-blue">{payment.invoice_number || 'N/A'}</div>
                        <div className="text-xs text-foreground/50">Ord: {payment.orders?.order_id}</div>
                      </td>
                      <td className="p-4 text-sm font-medium">{payment.orders?.customers?.customer_name || 'Unknown'}</td>
                      <td className="p-4 text-sm">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-foreground/10 text-xs font-semibold">
                          {payment.payment_method}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-green-500">${payment.amount_paid}</td>
                      <td className="p-4 text-sm">
                        <div className="font-bold text-red-400">${payment.remaining_balance || '0'}</div>
                        {payment.sender_name && <div className="text-xs text-foreground/50">Sender: {payment.sender_name}</div>}
                      </td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => handleArchive(payment.id)} className="p-1.5 bg-background border border-border rounded hover:bg-foreground/10 text-foreground/70 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Archive">
                          <Archive size={14} />
                        </button>
                        <button onClick={() => handleDelete(payment.id)} className="p-1.5 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-foreground/50">
                      No payments found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
