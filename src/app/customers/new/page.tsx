"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const customer_name = formData.get("customer_name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    const { error: insertError } = await supabase.from("customers").insert([
      { customer_name, phone, email }
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push("/customers");
      router.refresh();
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add New Customer</h2>
        <p className="text-foreground/70 mt-1">Create a new customer profile.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name *</label>
            <input 
              name="customer_name"
              type="text" 
              required
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input 
              name="phone"
              type="tel" 
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input 
              name="email"
              type="email" 
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm"
              placeholder="john@example.com"
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
              {loading ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
