"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowRight, Car, MapPin, Download, Edit, Plus, Trash2 } from "lucide-react";
import { VehicleFormList, VehicleFormType } from "@/components/forms/VehicleFormList";

const editLeadSchema = z.object({
  customer_name: z.string().min(1, "Customer Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").or(z.literal("")).optional().nullable(),
  pickup_location: z.string().min(1, "Pickup Location is required"),
  dropoff_location: z.string().min(1, "Dropoff Location is required"),
  estimated_price: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().min(0, "Estimated Price must be a valid positive number")
  ),
  custom_order_id: z.string().optional().nullable()
});

type EditLeadFormValues = z.infer<typeof editLeadSchema>;

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [quote, setQuote] = useState<any>(null);
  const [vehicles, setVehicles] = useState<VehicleFormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm<EditLeadFormValues>({
    resolver: zodResolver(editLeadSchema),
  });
  const [editVehicles, setEditVehicles] = useState<VehicleFormType[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [finalPrice, setFinalPrice] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data: quoteData } = await supabase.from("leads").select("*").eq("id", id).single();
      if (quoteData) {
        setQuote(quoteData);
        reset(quoteData);
        setFinalPrice(quoteData.estimated_price?.toString() || "");
      }
      
      const { data: vehiclesData } = await supabase.from("quote_vehicles").select("*").eq("lead_id", id);
      if (vehiclesData) {
        setVehicles(vehiclesData);
        setEditVehicles(vehiclesData);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    // Reset state if cancelling
    if (isEditing && quote) {
      reset(quote);
      setEditVehicles(vehicles);
    }
  };

  const saveEdits = async (data: EditLeadFormValues) => {
    setSaving(true);
    const vehicleNameStr = editVehicles.map(v => `${v.year} ${v.make} ${v.model}`).join(', ');

    // Update Lead
    const { error: updateError } = await supabase.from("leads").update({
      customer_name: data.customer_name,
      phone: data.phone,
      email: data.email,
      vehicle_name: vehicleNameStr,
      pickup_location: data.pickup_location,
      dropoff_location: data.dropoff_location,
      estimated_price: data.estimated_price,
      custom_order_id: data.custom_order_id?.trim() || null,
    }).eq("id", quote.id);

    if (updateError) {
      alert(`Save failed: ${updateError.message}\n\nIf this mentions "custom_order_id", please run the phase7_schema.sql migration in your Supabase SQL Editor.`);
      setSaving(false);
      return;
    }

    // Update Vehicles (simplest way: delete old and insert new)
    await supabase.from("quote_vehicles").delete().eq("lead_id", quote.id);
    
    if (editVehicles.length > 0) {
      const vehiclesToInsert = editVehicles.map(v => ({
        lead_id: quote.id,
        year: v.year,
        make: v.make,
        model: v.model,
        vin: v.vin,
        operable: v.operable,
        trailer_type: v.trailer_type
      }));
      await supabase.from("quote_vehicles").insert(vehiclesToInsert);
    }

    // Refresh Data
    setQuote({...quote, ...data, vehicle_name: vehicleNameStr, custom_order_id: data.custom_order_id?.trim() || null});
    setVehicles(editVehicles);
    setIsEditing(false);
    setSaving(false);
  };

  const deleteQuote = async () => {
    if (confirm("Are you sure you want to delete this quote? This cannot be undone.")) {
      setSaving(true);
      await supabase.from("leads").delete().eq("id", id);
      router.push("/leads");
    }
  };

  const convertToOrder = async () => {
    setConverting(true);
    
    try {
      // 1. Ensure Customer exists
      const { data: customerData, error: customerError } = await supabase.from("customers").insert([
        { customer_name: quote.customer_name, email: quote.email || null, phone: quote.phone || null }
      ]).select().single();

      if (customerError) throw new Error("Failed to create customer: " + customerError.message);

      const vehicleNameStr = vehicles.map(v => `${v.year} ${v.make} ${v.model}`).join(', ');

      // 2. Generate new Order
      const order_id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: orderData, error: orderError } = await supabase.from("orders").insert([
        {
          order_id,
          customer_id: customerData?.id || null,
          vehicle_name: vehicleNameStr, 
          pickup_location: quote.pickup_location,
          dropoff_location: quote.dropoff_location,
          est_pickup_date: quote.est_pickup_date || null,
          est_delivery_date: quote.est_delivery_date || null,
          customer_price: parseFloat(finalPrice),
          status: "Posted"
        }
      ]).select().single();

      if (orderError) throw new Error("Failed to create order: " + orderError.message);

      // 3. Transfer Vehicles
      if (orderData && vehicles.length > 0) {
        const orderVehicles = vehicles.map(v => ({
          order_id: orderData.id,
          year: v.year,
          make: v.make,
          model: v.model,
          vin: v.vin,
          operable: v.operable,
          trailer_type: v.trailer_type
        }));
        const { error: vehicleError } = await supabase.from("order_vehicles").insert(orderVehicles);
        if (vehicleError) throw new Error("Failed to link vehicles: " + vehicleError.message);
      }

      // 4. Update Lead Status
      await supabase.from("leads").update({ status: "Converted" }).eq("id", quote.id);

      if (orderData) {
        router.push(`/orders/${orderData.id}`);
      }
    } catch (err: any) {
      alert(err.message);
      setConverting(false);
    }
  };

  if (loading) return <div className="p-8">Loading quote details...</div>;
  if (!quote) return <div className="p-8 text-red-500">Quote not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end pb-4 border-b border-border/50">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Quote" : "Quote Details"}</h2>
          <p className="text-foreground/70 mt-1">For {quote.customer_name}</p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <>
              <button 
                onClick={deleteQuote}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors text-sm font-medium"
              >
                <Trash2 size={16} /> Delete
              </button>
              <button 
                onClick={toggleEdit}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-foreground/5 transition-colors text-sm font-medium"
              >
                <Edit size={16} /> Edit
              </button>
              <a 
                href={`/leads/${id}/pdf`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-foreground/5 transition-colors text-sm font-medium"
              >
                <Download size={16} /> Print/Save PDF
              </a>

              {quote.status !== "Converted" && (
                <button 
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-dark-navy font-bold rounded-xl hover:bg-electric-cyan transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)] text-sm"
                >
                  Convert to Order <ArrowRight size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                onClick={toggleEdit}
                className="px-4 py-2 border border-border rounded-xl hover:bg-foreground/5 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit(saveEdits)}
                disabled={saving}
                className="px-6 py-2 bg-neon-blue text-dark-navy font-bold rounded-xl hover:bg-electric-cyan transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)] text-sm"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-6 glass-panel p-6 rounded-2xl border border-border">
          {/* Edit Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <h3 className="md:col-span-3 text-lg font-bold text-neon-blue border-b border-border/50 pb-2">Customer Info</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <input {...register("customer_name")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input {...register("phone")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <h3 className="md:col-span-3 text-lg font-bold text-neon-blue border-b border-border/50 pb-2 mt-4">Routing</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Pickup Location</label>
              <input {...register("pickup_location")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
              {errors.pickup_location && <p className="text-red-500 text-xs mt-1">{errors.pickup_location.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dropoff Location</label>
              <input {...register("dropoff_location")} className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm" />
              {errors.dropoff_location && <p className="text-red-500 text-xs mt-1">{errors.dropoff_location.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Price ($)</label>
              <input type="number" step="0.01" {...register("estimated_price")} className="w-full max-w-[200px] px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm font-bold" />
              {errors.estimated_price && <p className="text-red-500 text-xs mt-1">{errors.estimated_price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Custom Quote / Order ID <span className="text-foreground/50 font-normal">(optional — put anything)</span></label>
              <input
                {...register("custom_order_id")}
                className="w-full max-w-xs px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue/50 text-sm font-mono"
                placeholder="e.g. NAT-001, Q-2024-05..."
              />
              {errors.custom_order_id && <p className="text-red-500 text-xs mt-1">{errors.custom_order_id.message}</p>}
            </div>

            {/* Editable Vehicles */}
            <div className="md:col-span-3 mt-4">
              <VehicleFormList 
                vehicles={editVehicles} 
                onChange={setEditVehicles} 
                maxVehicles={5} 
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Read Only View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
              <h3 className="font-bold text-lg text-neon-blue flex items-center gap-2"><MapPin size={18} /> Route</h3>
              <div className="pl-6 space-y-4 border-l-2 border-border/50 ml-2">
                <div className="relative">
                  <div className="absolute w-3 h-3 bg-neon-blue rounded-full -left-[31px] top-1"></div>
                  <p className="text-xs text-foreground/50 uppercase">Origin</p>
                  <p className="font-medium">{quote.pickup_location}</p>
                  <p className="text-xs text-foreground/50">Est: {quote.est_pickup_date || 'TBD'}</p>
                </div>
                <div className="relative">
                  <div className="absolute w-3 h-3 bg-electric-cyan rounded-full -left-[31px] top-1"></div>
                  <p className="text-xs text-foreground/50 uppercase">Destination</p>
                  <p className="font-medium">{quote.dropoff_location}</p>
                  <p className="text-xs text-foreground/50">Est: {quote.est_delivery_date || 'TBD'}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-border bg-gradient-to-br from-surface to-dark-navy/50">
              <h3 className="font-bold text-lg text-green-500 mb-4">Estimated Pricing</h3>
              <p className="text-4xl font-bold text-neon-blue">${quote.estimated_price}</p>
              {quote.custom_order_id && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
                  <span className="text-xs text-foreground/60 font-medium">Order ID:</span>
                  <span className="text-sm font-mono font-bold text-neon-blue">{quote.custom_order_id}</span>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm font-medium">Customer: {quote.customer_name}</p>
                <p className="text-xs text-foreground/70">{quote.phone} • {quote.email}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-border">
            <h3 className="font-bold text-lg text-neon-blue flex items-center gap-2 mb-4"><Car size={18} /> Vehicles ({vehicles.length})</h3>
            <div className="space-y-3">
              {vehicles.map((v, i) => (
                <div key={v.id || i} className="p-4 bg-foreground/5 rounded-xl border border-border/50 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{v.year} {v.make} {v.model}</p>
                    <p className="text-xs text-foreground/50">VIN: {v.vin || 'Not provided'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold mr-2 ${v.operable ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {v.operable ? 'Operable' : 'Inoperable'}
                    </span>
                    <span className="px-2 py-1 rounded bg-foreground/10 text-xs font-semibold">
                      Trailer: {v.trailer_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Convert to Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-neon-blue">Convert Quote to Live Order</h3>
            <p className="text-sm text-foreground/70 mb-6">Confirm the final exact price with the customer before converting.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Final Agreed Price ($)</label>
                <input 
                  type="number" 
                  value={finalPrice} 
                  onChange={(e) => setFinalPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-neon-blue text-lg font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-border hover:bg-foreground/5 font-medium text-sm">
                Cancel
              </button>
              <button 
                onClick={convertToOrder} 
                disabled={converting}
                className="px-6 py-2 rounded-xl bg-neon-blue text-dark-navy font-bold hover:bg-electric-cyan transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {converting ? "Processing..." : "Confirm & Convert"} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
