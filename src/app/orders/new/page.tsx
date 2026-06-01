"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { User, MapPin, DollarSign, Truck, ChevronLeft, ChevronRight } from "lucide-react";

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
    let customer_id = formData.get("customer_id") as string;
    const new_customer_name = formData.get("new_customer_name") as string;
    const new_customer_email = formData.get("new_customer_email") as string;
    const new_customer_phone = formData.get("new_customer_phone") as string;

    const vehicle_name = formData.get("vehicle_name") as string;
    const pickup_location = formData.get("pickup_location") as string;
    const dropoff_location = formData.get("dropoff_location") as string;
    const customer_price = parseFloat(formData.get("customer_price") as string) || 0;
    const carrier_price = parseFloat(formData.get("carrier_price") as string) || 0;
    const profit = customer_price - carrier_price;
    const payment_method = formData.get("payment_method") as string;
    const payment_timing = formData.get("payment_timing") as string;
    
    // Auto-create customer if manual details are provided and no existing customer was selected
    if (!customer_id && new_customer_name) {
      const { data: newCustomer, error: custError } = await (supabase.from("customers") as any).insert([{
        customer_name: new_customer_name,
        email: new_customer_email || null,
        phone: new_customer_phone || null
      }]).select("id").single();
      
      if (!custError && newCustomer) {
        customer_id = newCustomer.id;
      }
    }
    
    const order_id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error: insertError } = await (supabase.from("orders") as any).insert([
      { 
        order_id,
        customer_id: customer_id || null, 
        vehicle_name, 
        pickup_location, 
        dropoff_location,
        customer_price,
        carrier_price,
        profit,
        status: "Posted",
        payment_method: payment_method || null,
        payment_timing: payment_timing || null
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
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Title Header */}
      <div className="bg-surface -mx-8 -mt-8 px-8 py-10 mb-8 border-b border-border flex justify-between items-start">
        <div>
          <button onClick={() => router.back()} className="text-foreground/60 hover:text-neon-blue flex items-center gap-1 text-sm font-medium mb-4 transition-colors">
            <ChevronLeft size={16} /> Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Create New Order</h1>
          <p className="text-foreground/70">Enter shipment details to dispatch a new transport order.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-foreground/50 uppercase tracking-wider font-semibold mb-1">Status</div>
          <div className="inline-block bg-neon-blue/20 text-neon-blue px-3 py-1 rounded-full text-sm font-bold">
            Draft
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm border border-red-500/20 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-8 items-start flex-col xl:flex-row">
        
        {/* Left Column: Form Fields */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Customer & Vehicle */}
          <div className="bg-background p-8 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
              <User className="text-neon-blue" size={20} />
              <h2 className="text-lg font-bold text-foreground">Client & Cargo</h2>
            </div>
            
            <div className="space-y-5">
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-background px-1 text-[11px] font-medium text-foreground/60 uppercase tracking-wider">Customer</label>
                <select 
                  name="customer_id"
                  className="w-full border border-border p-3.5 rounded-lg text-[15px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                >
                  <option value="">Select Existing (Or Enter New Below)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customer_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface/50 p-4 rounded-lg border border-border/50">
                <div className="col-span-1 md:col-span-2">
                  <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2 block">Or Create New Customer</span>
                  <input 
                    name="new_customer_name"
                    type="text" 
                    className="w-full border border-border p-3 rounded-lg text-[14px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                    placeholder="Full Name (if not selected above)"
                  />
                </div>
                <div>
                  <input 
                    name="new_customer_phone"
                    type="tel" 
                    className="w-full border border-border p-3 rounded-lg text-[14px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                    placeholder="Phone"
                  />
                </div>
                <div>
                  <input 
                    name="new_customer_email"
                    type="email" 
                    className="w-full border border-border p-3 rounded-lg text-[14px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                    placeholder="Email"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-3 bg-background px-1 text-[11px] font-medium text-foreground/60 uppercase tracking-wider">Vehicle Details *</label>
                <input 
                  name="vehicle_name"
                  type="text" 
                  required
                  className="w-full border border-border p-3.5 rounded-lg text-[15px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                  placeholder="e.g. 2024 Tesla Model 3"
                />
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="bg-background p-8 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
              <MapPin className="text-neon-blue" size={20} />
              <h2 className="text-lg font-bold text-foreground">Transport Route</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-background px-1 text-[11px] font-medium text-foreground/60 uppercase tracking-wider">Pickup Location *</label>
                <input 
                  name="pickup_location"
                  type="text" 
                  required
                  className="w-full border border-border p-3.5 rounded-lg text-[15px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                  placeholder="City, State Zip"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-3 bg-background px-1 text-[11px] font-medium text-foreground/60 uppercase tracking-wider">Dropoff Location *</label>
                <input 
                  name="dropoff_location"
                  type="text" 
                  required
                  className="w-full border border-border p-3.5 rounded-lg text-[15px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                  placeholder="City, State Zip"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Pricing & Submit */}
        <div className="w-full xl:w-[380px] shrink-0 space-y-6">
          
          <div className="bg-surface p-6 rounded-xl border-t-4 border-neon-blue border-x border-b border-border shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="text-neon-blue" size={20} />
              <h2 className="text-lg font-bold text-foreground uppercase">Pricing</h2>
            </div>
            
            <div className="space-y-5">
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[11px] font-medium text-foreground/60 uppercase tracking-wider">Customer Price ($)</label>
                <input 
                  name="customer_price"
                  type="number" 
                  className="w-full border border-border p-3.5 rounded-lg text-[15px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                  placeholder="1200"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[11px] font-medium text-foreground/60 uppercase tracking-wider">Carrier Price ($)</label>
                <input 
                  name="carrier_price"
                  type="number" 
                  className="w-full border border-border p-3.5 rounded-lg text-[15px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                  placeholder="900"
                />
              </div>

              <div className="relative mt-4">
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[11px] font-medium text-foreground/60 uppercase tracking-wider">Payment Method</label>
                <select 
                  name="payment_method"
                  className="w-full border border-border p-3.5 rounded-lg text-[15px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                >
                  <option value="">Select Method</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Zelle">Zelle</option>
                  <option value="CashApp">CashApp</option>
                  <option value="Venmo">Venmo</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[11px] font-medium text-foreground/60 uppercase tracking-wider">Payment Timing</label>
                <select 
                  name="payment_timing"
                  className="w-full border border-border p-3.5 rounded-lg text-[15px] focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all bg-background text-foreground"
                >
                  <option value="">Select Timing</option>
                  <option value="At Pickup">At Pickup</option>
                  <option value="At Dropoff">At Dropoff</option>
                  <option value="COD">COD</option>
                  <option value="Pre-Paid">Pre-Paid</option>
                </select>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-neon-blue text-dark-navy font-bold py-4 rounded-lg hover:bg-electric-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Create Order"} <ChevronRight size={18} />
              </button>
              <button 
                type="button" 
                onClick={() => router.back()}
                className="w-full mt-3 flex items-center justify-center gap-2 text-foreground/70 font-medium py-3 rounded-lg hover:bg-foreground/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          
        </div>
      </form>
    </div>
  );
}
