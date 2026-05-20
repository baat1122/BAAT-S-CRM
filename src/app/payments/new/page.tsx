"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase
        .from("orders")
        .select("id, order_id, customer_price")
        .order("created_at", { ascending: false });
      if (data) setOrders(data);
    }
    fetchOrders();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const order_id = formData.get("order_id") as string;
    const payment_method = formData.get("payment_method") as string;
    const amount_paid = parseFloat(formData.get("amount_paid") as string) || 0;
    
    const invoice_number = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

    const { error: insertError } = await supabase.from("payments").insert([
      { 
        order_id: order_id || null, 
        payment_method, 
        amount_paid,
        invoice_number
      }
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push("/payments");
      router.refresh();
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Record Payment</h2>
        <p className="text-foreground/70 mt-1">Log a new incoming transaction.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Order / Invoice *</label>
            <select 
              name="order_id"
              required
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
            >
              <option value="">Select an order</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.order_id} - Due: ${o.customer_price || 0}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment Method *</label>
            <select 
              name="payment_method"
              required
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Zelle">Zelle</option>
              <option value="CashApp">CashApp</option>
              <option value="Venmo">Venmo</option>
              <option value="PayPal">PayPal</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount Paid ($) *</label>
            <input 
              name="amount_paid"
              type="number" 
              required
              min="0.01"
              step="0.01"
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
              placeholder="100.00"
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-border mt-6">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl border border-border hover:bg-foreground/5 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-neon-blue text-dark-navy font-bold hover:bg-electric-cyan transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 text-sm"
            >
              {loading ? "Processing..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
