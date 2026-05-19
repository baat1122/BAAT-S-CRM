"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCustomers() {
      const { data } = await supabase.from("customers").select("id, customer_name").order("customer_name");
      if (data) setCustomers(data);
    }
    fetchCustomers();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const customer_id = formData.get("customer_id") as string;
    const vehicle_name = formData.get("vehicle_name") as string;
    const pickup_location = formData.get("pickup_location") as string;
    const dropoff_location = formData.get("dropoff_location") as string;
    const customer_price = parseFloat(formData.get("customer_price") as string) || 0;
    const carrier_price = parseFloat(formData.get("carrier_price") as string) || 0;
    const profit = customer_price - carrier_price;
    
    // Generate a random Order ID
    const order_id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error: insertError } = await supabase.from("orders").insert([
      { 
        order_id,
        customer_id: customer_id || null, 
        vehicle_name, 
        pickup_location, 
        dropoff_location,
        customer_price,
        carrier_price,
        profit,
        status: "Posted"
      }
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push("/orders");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Order</h2>
        <p className="text-foreground/70 mt-1">Enter shipment details for a new transport.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Customer</label>
              <select 
                name="customer_id"
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
              >
                <option value="">Select a customer (Optional)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customer_name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Vehicle Details *</label>
              <input 
                name="vehicle_name"
                type="text" 
                required
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
                placeholder="2024 Tesla Model 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pickup Location *</label>
              <input 
                name="pickup_location"
                type="text" 
                required
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
                placeholder="Miami, FL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dropoff Location *</label>
              <input 
                name="dropoff_location"
                type="text" 
                required
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
                placeholder="Dallas, TX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Customer Price ($)</label>
              <input 
                name="customer_price"
                type="number" 
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
                placeholder="1200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Carrier Price ($)</label>
              <input 
                name="carrier_price"
                type="number" 
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
                placeholder="900"
              />
            </div>
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
              {loading ? "Saving..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
