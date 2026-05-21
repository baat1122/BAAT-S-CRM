"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Truck, MapPin, DollarSign, FileText, Link as LinkIcon, Edit, Download, FileSignature, RefreshCcw, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { generatePDF } from "@/lib/pdfGenerator";

export default function OrderLoadSheet({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [order, setOrder] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editVehicles, setEditVehicles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: orderData } = await supabase
        .from("orders")
        .select(`*, customers (customer_name, phone, email), carriers (company_name, mc_number, dispatcher_phone)`)
        .eq("id", id)
        .single();
        
      if (orderData) {
        setOrder(orderData);
        setEditForm(orderData);
      }

      const { data: vehiclesData } = await supabase.from("order_vehicles").select("*").eq("order_id", id);
      if (vehiclesData) setVehicles(vehiclesData);

      setLoading(false);
    }
    fetchData();
  }, [id]);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing && order) {
      setEditForm(order); // reset
      setEditVehicles(JSON.parse(JSON.stringify(vehicles))); // deep copy
    }
  };

  const saveEdits = async () => {
    setSaving(true);
    const { error: updateError } = await supabase.from("orders").update({
      order_id: editForm.order_id,
      source: editForm.source,
      pickup_location: editForm.pickup_location,
      dropoff_location: editForm.dropoff_location,
      est_pickup_date: editForm.est_pickup_date || null,
      est_delivery_date: editForm.est_delivery_date || null,
      customer_price: parseFloat(editForm.customer_price) || 0,
      carrier_price: parseFloat(editForm.carrier_price) || 0,
      profit: (parseFloat(editForm.customer_price) || 0) - (parseFloat(editForm.carrier_price) || 0),
      status: editForm.status,
      payment_method: editForm.payment_method,
      payment_timing: editForm.payment_timing
    }).eq("id", order.id);

    if (updateError) {
      alert(`Error saving order: ${updateError.message}\n\nIf it says a column does not exist, you need to run the SQL migration in Supabase!`);
    }

    // Save Vehicles (Delete existing and insert new to simplify, or update if id exists)
    // For simplicity, we can delete all vehicles for this order and insert the editVehicles array
    await supabase.from("order_vehicles").delete().eq("order_id", order.id);
    if (editVehicles.length > 0) {
      const vehiclesToInsert = editVehicles.map(v => ({
        order_id: order.id,
        year: v.year,
        make: v.make,
        model: v.model,
        vin: v.vin,
        operable: v.operable,
        trailer_type: v.trailer_type
      }));
      await supabase.from("order_vehicles").insert(vehiclesToInsert);
    }

    // Refresh
    const { data: refreshed } = await supabase.from("orders").select(`*, customers (*), carriers (*)`).eq("id", order.id).single();
    if (refreshed) {
      setOrder(refreshed);
      setEditForm(refreshed);
    }
    const { data: refreshedVehicles } = await supabase.from("order_vehicles").select("*").eq("order_id", id);
    if (refreshedVehicles) setVehicles(refreshedVehicles);
    
    setIsEditing(false);
    setSaving(false);
  };

  const requestNewSignature = async () => {
    if (!confirm("Are you sure you want to request a new signature? This will clear the current signature data and change the status back to Pending.")) return;
    
    await supabase.from("orders").update({
      form_submitted: false,
      customer_signature: null,
      signed_at: null,
      terms_accepted: false
    }).eq("id", order.id);
    
    // Refresh
    const { data: refreshed } = await supabase.from("orders").select(`*, customers (*), carriers (*)`).eq("id", order.id).single();
    if (refreshed) setOrder(refreshed);
  };

  if (loading) return <div className="p-8">Loading order details...</div>;
  if (!order) return <div className="p-8 text-red-500">Order not found.</div>;

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-end pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-neon-blue">{order.order_id}</h2>
            <span className="px-3 py-1 rounded bg-foreground/10 text-xs font-semibold uppercase tracking-wider">
              {order.status}
            </span>
          </div>
          <p className="text-foreground/70 text-sm">Created on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button 
                onClick={toggleEdit}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-foreground/5 transition-colors text-sm font-medium"
              >
                <Edit size={16} /> Edit Order
              </button>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/order-form/${order.id}`);
                  alert("Link copied to clipboard! Send this to the customer.");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-foreground/10 text-foreground font-bold rounded-xl hover:bg-foreground/20 transition-colors text-sm"
              >
                <LinkIcon size={16} /> Send to Customer
              </button>

              <div className="group relative">
                <button className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-dark-navy font-bold rounded-xl hover:bg-electric-cyan transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)] text-sm">
                  <Download size={16} /> Generate PDFs
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <a href={`/orders/${id}/pdf/invoice`} target="_blank" className="block w-full text-left px-4 py-3 text-sm hover:bg-foreground/5 border-b border-border/50">Invoice</a>
                  <a href={`/orders/${id}/pdf/dispatch`} target="_blank" className="block w-full text-left px-4 py-3 text-sm hover:bg-foreground/5 border-b border-border/50">Dispatch Sheet</a>
                  <a href={`/orders/${id}/pdf/bol`} target="_blank" className="block w-full text-left px-4 py-3 text-sm hover:bg-foreground/5 border-b border-border/50">Bill of Lading</a>
                  <a href={`/orders/${id}/pdf/receipt`} target="_blank" className="block w-full text-left px-4 py-3 text-sm hover:bg-foreground/5">Customer Receipt</a>
                </div>
              </div>
            </>
          ) : (
            <>
              <button onClick={toggleEdit} className="px-4 py-2 border border-border rounded-xl hover:bg-foreground/5 text-sm font-medium">Cancel</button>
              <button onClick={saveEdits} disabled={saving} className="px-6 py-2 bg-neon-blue text-dark-navy font-bold rounded-xl hover:bg-electric-cyan text-sm">{saving ? "Saving..." : "Save Order"}</button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="glass-panel p-6 rounded-2xl border border-border space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order ID</label>
              <input value={editForm.order_id} onChange={e => setEditForm({...editForm, order_id: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm font-bold text-neon-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm">
                <option value="Posted">Posted</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Picked Up">Picked Up</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <select value={editForm.source || 'Website'} onChange={e => setEditForm({...editForm, source: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm">
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Repeat">Repeat</option>
                <option value="Dealer">Dealer</option>
                <option value="GMB">GMB</option>
                <option value="Lead">Lead</option>
                <option value="Social Media">Social Media</option>
              </select>
            </div>
            <div></div>
            <div>
              <label className="block text-sm font-medium mb-1">Pickup Location</label>
              <input value={editForm.pickup_location} onChange={e => setEditForm({...editForm, pickup_location: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dropoff Location</label>
              <input value={editForm.dropoff_location} onChange={e => setEditForm({...editForm, dropoff_location: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Price ($)</label>
              <input type="number" value={editForm.customer_price || 0} onChange={e => setEditForm({...editForm, customer_price: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm font-bold text-neon-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Carrier Pay ($)</label>
              <input type="number" value={editForm.carrier_price || 0} onChange={e => setEditForm({...editForm, carrier_price: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm font-bold text-red-400" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select value={editForm.payment_method || ''} onChange={e => setEditForm({...editForm, payment_method: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm">
                <option value="">Select Method</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Zelle">Zelle</option>
                <option value="CashApp">CashApp</option>
                <option value="Venmo">Venmo</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Timing</label>
              <select value={editForm.payment_timing || ''} onChange={e => setEditForm({...editForm, payment_timing: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm">
                <option value="">Select Timing</option>
                <option value="At Pickup">At Pickup</option>
                <option value="At Dropoff">At Dropoff</option>
                <option value="COD">COD</option>
                <option value="Pre-Paid">Pre-Paid</option>
              </select>
            </div>
            
            {/* Edit Vehicles Section */}
            <div className="md:col-span-2 pt-4 mt-4 border-t border-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-neon-blue">Vehicles</h3>
                <button 
                  onClick={() => setEditVehicles([...editVehicles, { year: '', make: '', model: '', vin: '', operable: true, trailer_type: 'Open' }])}
                  className="flex items-center gap-1 text-xs font-bold bg-foreground/10 px-3 py-1.5 rounded-lg hover:bg-foreground/20"
                >
                  <Plus size={14} /> Add Vehicle
                </button>
              </div>
              <div className="space-y-4">
                {editVehicles.map((v, i) => (
                  <div key={i} className="p-4 bg-foreground/5 rounded-xl border border-border relative">
                    <button 
                      onClick={() => setEditVehicles(editVehicles.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 text-red-500 hover:bg-red-500/10 p-1.5 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Year</label>
                        <input value={v.year} onChange={e => { const newV = [...editVehicles]; newV[i].year = e.target.value; setEditVehicles(newV); }} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Make</label>
                        <input value={v.make} onChange={e => { const newV = [...editVehicles]; newV[i].make = e.target.value; setEditVehicles(newV); }} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Model</label>
                        <input value={v.model} onChange={e => { const newV = [...editVehicles]; newV[i].model = e.target.value; setEditVehicles(newV); }} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">VIN</label>
                        <input value={v.vin || ''} onChange={e => { const newV = [...editVehicles]; newV[i].vin = e.target.value; setEditVehicles(newV); }} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1">Operable</label>
                        <select value={v.operable ? 'true' : 'false'} onChange={e => { const newV = [...editVehicles]; newV[i].operable = e.target.value === 'true'; setEditVehicles(newV); }} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
                          <option value="true">Operable</option>
                          <option value="false">Inoperable</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1">Trailer Type</label>
                        <select value={v.trailer_type || 'Open'} onChange={e => { const newV = [...editVehicles]; newV[i].trailer_type = e.target.value; setEditVehicles(newV); }} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
                          <option value="Open">Open</option>
                          <option value="Enclosed">Enclosed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {editVehicles.length === 0 && <p className="text-sm text-foreground/50">No vehicles added.</p>}
              </div>
            </div>

            <div className="md:col-span-2 p-4 bg-foreground/5 rounded-xl border border-border mt-2">
              <p className="text-sm">Carrier & Customer Database relationships are managed from their respective tabs. To assign a carrier, use the Dispatch Board.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Route Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-4 text-neon-blue border-b border-border/50 pb-2">
              <MapPin size={20} />
              <h3 className="font-bold text-lg">Routing</h3>
            </div>
            <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:w-[2px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:bg-border/50">
              <div className="relative">
                <div className="absolute w-4 h-4 bg-neon-blue rounded-full -left-[27px] top-1 shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
                <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider">Origin</p>
                <p className="font-medium text-lg">{order.pickup_location}</p>
                <p className="text-xs text-foreground/70 mt-1">Est: {order.est_pickup_date || 'TBD'}</p>
              </div>
              <div className="relative">
                <div className="absolute w-4 h-4 bg-electric-cyan rounded-full -left-[27px] top-1"></div>
                <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider">Destination</p>
                <p className="font-medium text-lg">{order.dropoff_location}</p>
                <p className="text-xs text-foreground/70 mt-1">Est: {order.est_delivery_date || 'TBD'}</p>
              </div>
            </div>
          </div>

          {/* Financials Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-border bg-gradient-to-br from-surface to-dark-navy/50">
            <div className="flex items-center gap-2 mb-4 text-green-500 border-b border-border/50 pb-2">
              <DollarSign size={20} />
              <h3 className="font-bold text-lg text-foreground">Financials</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground/70">Total Tariff (Customer Price)</span>
                <span className="font-bold">${order.customer_price || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/70">Carrier Pay</span>
                <span className="font-bold text-red-400">-${order.carrier_price || 0}</span>
              </div>
              <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                <span className="font-bold text-lg text-neon-blue">Broker Profit</span>
                <span className="font-bold text-xl text-green-500">${order.profit || 0}</span>
              </div>
              {(order.payment_method || order.payment_timing) && (
                <div className="pt-4 border-t border-border/50 bg-foreground/5 p-3 rounded-xl">
                  <p className="text-xs text-foreground/50 font-bold uppercase mb-2">Customer Payment Method</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold">{order.payment_method || 'Not Specified'}</span>
                    <span className="px-2 py-1 bg-foreground/10 rounded">{order.payment_timing || 'Timing Not Set'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicles Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-border md:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-neon-blue border-b border-border/50 pb-2">
              <Truck size={20} />
              <h3 className="font-bold text-lg text-foreground">Vehicles on Load</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((v, i) => (
                <div key={i} className="p-4 bg-foreground/5 rounded-xl border border-border/50 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{v.year} {v.make} {v.model}</p>
                    <p className="text-xs text-foreground/50">VIN: {v.vin || 'Not provided'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold mr-2 ${v.operable ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {v.operable ? 'Operable' : 'Inoperable'}
                    </span>
                    <span className="px-2 py-1 rounded bg-foreground/10 text-xs font-semibold">
                      {v.trailer_type}
                    </span>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && <p className="text-sm text-foreground/50 p-4">No vehicles documented natively.</p>}
            </div>
          </div>

          {/* Customer Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-4 text-neon-blue border-b border-border/50 pb-2">
              <User size={20} />
              <h3 className="font-bold text-lg text-foreground">Customer Details</h3>
            </div>
            {order.customers ? (
              <div className="space-y-2">
                <p className="font-bold text-lg">{order.customers.customer_name}</p>
                <p className="text-sm text-foreground/70 flex items-center gap-2"><LinkIcon size={14} /> {order.customers.phone || 'No phone'}</p>
                <p className="text-sm text-foreground/70 flex items-center gap-2"><FileText size={14} /> {order.customers.email || 'No email'}</p>
              </div>
            ) : (
              <p className="text-sm text-foreground/50">No customer linked to this order.</p>
            )}
          </div>

          {/* Customer Agreement Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-border md:col-span-2">
            <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-neon-blue">
                <FileSignature size={20} />
                <h3 className="font-bold text-lg text-foreground">Customer Agreement</h3>
              </div>
              {order.form_submitted && (
                <button 
                  onClick={requestNewSignature}
                  className="flex items-center gap-1 px-3 py-1 bg-foreground/10 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-xs font-semibold transition-colors"
                >
                  <RefreshCcw size={12} /> Request New Signature
                </button>
              )}
            </div>
            {order.form_submitted ? (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 text-xs font-bold uppercase tracking-wider">Signed</span>
                    <span className="text-sm text-foreground/70">on {new Date(order.signed_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-medium mt-2">{order.customer_signature?.split(" | ")[2] || "Electronic Signature provided."}</p>
                  <p className="text-xs text-foreground/50">{order.customer_signature?.split(" | ")[0]} | {order.customer_signature?.split(" | ")[1]}</p>
                </div>
                <button
                  onClick={() => {
                    // Extract fields from saved signature if possible
                    const sigParts = order.customer_signature ? order.customer_signature.split(" | ") : [];
                    const ipPart = sigParts.find((p: string) => p.startsWith("IP: ")) || "";
                    const datePart = sigParts.find((p: string) => p.startsWith("Date: ")) || "";
                    const namePart = sigParts.find((p: string) => p.startsWith("Signed: ")) || "";

                    const pickupParts = (order.pickup_location || "").split(", ");
                    const dropoffParts = (order.dropoff_location || "").split(", ");

                    generatePDF({
                      order,
                      vehicles,
                      fullName: order.customers?.customer_name || "",
                      email: order.customers?.email || "",
                      phone: order.customers?.phone || "",
                      pickupDate: order.est_pickup_date || "",
                      originAddress: pickupParts.slice(0, -2).join(", ") || order.pickup_location,
                      originCity: pickupParts.length > 1 ? pickupParts.slice(-2).join(", ") : "",
                      originContactName: order.pickup_contact_name || "",
                      originContactEmail: "",
                      originContactPhone: order.pickup_contact_phone || "",
                      destinationAddress: dropoffParts.slice(0, -2).join(", ") || order.dropoff_location,
                      destinationCity: dropoffParts.length > 1 ? dropoffParts.slice(-2).join(", ") : "",
                      destinationContactName: order.dropoff_contact_name || "",
                      destinationContactEmail: "",
                      destinationContactPhone: order.dropoff_contact_phone || "",
                      electronicSignature: namePart.replace("Signed: ", ""),
                      ipAddress: ipPart.replace("IP: ", ""),
                      agreedDate: datePart.replace("Date: ", "")
                    });
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-neon-blue text-dark-navy font-bold rounded-xl hover:bg-electric-cyan transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)] text-sm"
                >
                  <Download size={18} />
                  Download Signed PDF
                </button>
              </div>
            ) : (
              <div className="flex flex-col justify-center text-center p-4">
                <span className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider mx-auto mb-3">Pending</span>
                <p className="text-sm text-foreground/70">The customer has not yet signed the agreement.</p>
              </div>
            )}
          </div>

          {/* Carrier Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-4 text-neon-blue border-b border-border/50 pb-2">
              <Truck size={20} />
              <h3 className="font-bold text-lg text-foreground">Assigned Carrier</h3>
            </div>
            {order.carriers ? (
              <div className="space-y-2">
                <p className="font-bold text-lg text-electric-cyan">{order.carriers.company_name}</p>
                <p className="text-sm text-foreground/70">MC: {order.carriers.mc_number}</p>
                <p className="text-sm text-foreground/70">Dispatch: {order.carriers.dispatcher_phone}</p>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center text-center">
                <p className="text-sm text-foreground/50 mb-3">No carrier assigned yet.</p>
                <Link href="/carriers" className="text-xs font-bold text-neon-blue hover:underline">Find a Carrier</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
