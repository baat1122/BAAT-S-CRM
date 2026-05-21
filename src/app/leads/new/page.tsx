"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { VehicleFormList, VehicleFormType } from "@/components/forms/VehicleFormList";

const leadSchema = z.object({
  customerName: z.string().min(1, "Customer Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")),
  pickupLocation: z.string().min(1, "Pickup Location is required"),
  dropoffLocation: z.string().min(1, "Dropoff Location is required"),
  estPickupDate: z.string().optional(),
  estDeliveryDate: z.string().optional(),
  estimatedPrice: z.string().min(1, "Estimated Price is required").refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
  source: z.string().default("Website"),
  customOrderId: z.string().optional()
});

type LeadFormValues = z.infer<typeof leadSchema>;

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      customerName: "", phone: "", email: "", pickupLocation: "", dropoffLocation: "",
      estPickupDate: "", estDeliveryDate: "", estimatedPrice: "", source: "Website", customOrderId: ""
    }
  });

  const [vehicles, setVehicles] = useState<VehicleFormType[]>([
    { year: "", make: "", model: "", vin: "", operable: true, trailer_type: "Open" }
  ]);

  const onSubmit = async (data: LeadFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const vehicleNameStr = vehicles.map(v => `${v.year} ${v.make} ${v.model}`).join(', ');

      // 0. Auto-save to Customers list if not already there
      if (data.customerName) {
        const { data: existing } = await supabase.from("customers")
          .select("id")
          .eq("customer_name", data.customerName)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("customers").insert([{
            customer_name: data.customerName,
            email: data.email || null,
            phone: data.phone || null,
            status: 'Active'
          }]);
        }
      }

      // 1. Insert the Lead (Quote)
      const { data: leadData, error: leadError } = await supabase.from("leads").insert([
        {
          customer_name: data.customerName,
          phone: data.phone || null,
          email: data.email || null,
          vehicle_name: vehicleNameStr,
          pickup_location: data.pickupLocation,
          dropoff_location: data.dropoffLocation,
          est_pickup_date: data.estPickupDate || null,
          est_delivery_date: data.estDeliveryDate || null,
          estimated_price: parseFloat(data.estimatedPrice) || 0,
          source: data.source,
          status: "New",
          custom_order_id: data.customOrderId?.trim() || null,
        }
      ]).select().single();

      if (leadError) throw leadError;

      // 2. Insert the Vehicles relationally
      if (leadData && vehicles.length > 0) {
        const vehiclesToInsert = vehicles.map(v => ({
          lead_id: leadData.id,
          year: v.year,
          make: v.make,
          model: v.model,
          vin: v.vin,
          operable: v.operable,
          trailer_type: v.trailer_type
        }));

        const { error: vehiclesError } = await supabase.from("quote_vehicles").insert(vehiclesToInsert);
        if (vehiclesError) throw vehiclesError;
      }

      router.push("/leads");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the quote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Generate Quote</h2>
        <p className="text-foreground/70 mt-1">Create a multi-vehicle quote.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-bold text-neon-blue mb-4 border-b border-border/50 pb-2">Customer Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name *</label>
                <input {...register("customerName")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input {...register("phone")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" {...register("email")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lead Source</label>
                <select {...register("source")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm">
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Repeat">Repeat</option>
                  <option value="Dealer">Dealer</option>
                  <option value="GMB">GMB</option>
                  <option value="Lead">Lead</option>
                  <option value="Social Media">Social Media</option>
                </select>
                {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source.message}</p>}
              </div>
            </div>
          </div>

          {/* Custom Order ID */}
          <div>
            <h3 className="text-lg font-bold text-neon-blue mb-4 border-b border-border/50 pb-2">Custom Quote / Order ID</h3>
            <div className="max-w-xs">
              <label className="block text-sm font-medium mb-1">Custom ID <span className="text-foreground/50 font-normal">(optional — put anything you want)</span></label>
              <input
                {...register("customOrderId")}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm font-mono"
                placeholder="e.g. NAT-001, Q-2024-05, MY-REF..."
              />
              {errors.customOrderId && <p className="text-red-500 text-xs mt-1">{errors.customOrderId.message}</p>}
            </div>
          </div>

          {/* Routing & Dates */}
          <div>
            <h3 className="text-lg font-bold text-neon-blue mb-4 border-b border-border/50 pb-2">Routing & Logistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pickup Location *</label>
                <input {...register("pickupLocation")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" placeholder="City, State" />
                {errors.pickupLocation && <p className="text-red-500 text-xs mt-1">{errors.pickupLocation.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dropoff Location *</label>
                <input {...register("dropoffLocation")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" placeholder="City, State" />
                {errors.dropoffLocation && <p className="text-red-500 text-xs mt-1">{errors.dropoffLocation.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Est. Pickup Date</label>
                <input type="date" {...register("estPickupDate")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
                {errors.estPickupDate && <p className="text-red-500 text-xs mt-1">{errors.estPickupDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Est. Delivery Date</label>
                <input type="date" {...register("estDeliveryDate")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
                {errors.estDeliveryDate && <p className="text-red-500 text-xs mt-1">{errors.estDeliveryDate.message}</p>}
              </div>
            </div>
          </div>

          {/* Vehicles */}
          <VehicleFormList 
            vehicles={vehicles} 
            onChange={setVehicles} 
            maxVehicles={5} 
          />

          {/* Pricing */}
          <div className="p-6 bg-neon-blue/5 border border-neon-blue/20 rounded-xl">
            <label className="block text-sm font-bold mb-1 text-electric-cyan">Estimated Quoted Price ($)</label>
            <p className="text-xs text-foreground/60 mb-2">The total customer price for this transport.</p>
            <input type="number" step="0.01" {...register("estimatedPrice")} className="w-full max-w-xs px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue text-lg font-bold" placeholder="1500" />
            {errors.estimatedPrice && <p className="text-red-500 text-xs mt-1">{errors.estimatedPrice.message}</p>}
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-3 justify-end border-t border-border mt-6">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-xl border border-border hover:bg-foreground/5 font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 rounded-xl bg-neon-blue text-dark-navy font-bold hover:bg-electric-cyan transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 text-sm">
              {loading ? "Saving Quote..." : "Save Quote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
