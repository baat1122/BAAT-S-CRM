"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";

export default function DispatchSheetPDFView({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [order, setOrder] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: orderData } = await supabase
        .from("orders")
        .select(`*, customers (*), carriers (*)`)
        .eq("id", id)
        .single();
      
      if (orderData) setOrder(orderData);
      
      const { data: vehiclesData } = await supabase.from("order_vehicles").select("*").eq("order_id", id);
      if (vehiclesData) setVehicles(vehiclesData);

      setTimeout(() => {
        window.print();
      }, 500);
    }
    fetchData();
  }, [id]);

  if (!order) return <div className="p-8 text-black bg-white">Generating Dispatch Sheet...</div>;

  return (
    <div className="bg-white text-black min-h-screen font-sans absolute inset-0 z-50">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden; }
          #printable-pdf, #printable-pdf * { visibility: visible; }
          #printable-pdf { position: absolute; left: 0; top: 0; width: 100%; padding: 20mm; }
        }
      `}} />

      <div id="printable-pdf" className="max-w-4xl mx-auto p-12 bg-white">
        {/* Header */}
        <div className="border-b-4 border-black pb-4 mb-8">
          <h1 className="text-4xl font-black text-center uppercase tracking-widest">Dispatch Work Order</h1>
          <p className="text-center text-gray-500 font-bold mt-2">Order ID: {order.order_id}</p>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border-2 border-gray-800 p-4">
            <h3 className="font-black bg-gray-800 text-white inline-block px-2 py-1 mb-3 text-sm">BROKER</h3>
            <img src="/logo.jpg" alt="Best American Auto Transport" className="h-10 mb-2 object-contain" />
            <p className="text-xs">5 Great Valley Pkwy, Malvern, PA 19355</p>
            <p className="text-sm font-bold mt-1">Phone: (302) 355-5544</p>
          </div>
          <div className="border-2 border-gray-800 p-4">
            <h3 className="font-black bg-gray-800 text-white inline-block px-2 py-1 mb-3 text-sm">CARRIER</h3>
            <p className="font-bold text-lg">{order.carriers?.company_name || 'TBD (Not Assigned)'}</p>
            <p className="text-sm">MC Number: {order.carriers?.mc_number || 'N/A'}</p>
            <p className="text-sm">Dispatcher: {order.carriers?.dispatcher_phone || 'N/A'}</p>
          </div>
        </div>

        {/* Route Details */}
        <div className="border-2 border-gray-800 mb-8">
          <div className="bg-gray-800 text-white px-4 py-2 font-black">ROUTE INSTRUCTIONS</div>
          <div className="grid grid-cols-2">
            <div className="p-4 border-r-2 border-gray-800">
              <h4 className="text-xs text-gray-500 font-bold uppercase mb-1">Pickup (Origin)</h4>
              <p className="font-bold text-xl mb-2">{order.pickup_location}</p>
              <p className="text-sm"><span className="font-bold">Contact:</span> {order.customers?.customer_name}</p>
              <p className="text-sm"><span className="font-bold">Phone:</span> {order.customers?.phone}</p>
              <p className="text-sm mt-2"><span className="font-bold">Ready Date:</span> {order.est_pickup_date || 'ASAP'}</p>
            </div>
            <div className="p-4">
              <h4 className="text-xs text-gray-500 font-bold uppercase mb-1">Delivery (Destination)</h4>
              <p className="font-bold text-xl mb-2">{order.dropoff_location}</p>
              <p className="text-sm"><span className="font-bold">Contact:</span> {order.customers?.customer_name}</p>
              <p className="text-sm"><span className="font-bold">Phone:</span> {order.customers?.phone}</p>
              <p className="text-sm mt-2"><span className="font-bold">Est. Delivery:</span> {order.est_delivery_date || 'TBD'}</p>
            </div>
          </div>
        </div>

        {/* Cargo */}
        <div className="border-2 border-gray-800 mb-8">
          <div className="bg-gray-800 text-white px-4 py-2 font-black">CARGO (VEHICLES)</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="p-2 text-left">Year Make Model</th>
                <th className="p-2 text-left">VIN</th>
                <th className="p-2 text-center">Condition</th>
                <th className="p-2 text-center">Trailer</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="p-2 font-bold">{v.year} {v.make} {v.model}</td>
                  <td className="p-2 text-gray-600">{v.vin || 'Not Provided'}</td>
                  <td className="p-2 text-center font-bold">{v.operable ? 'Operable' : 'INOPERABLE'}</td>
                  <td className="p-2 text-center">{v.trailer_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Carrier Pay */}
        <div className="border-2 border-black p-6 bg-gray-100 flex justify-between items-center mb-8">
          <div>
            <h4 className="font-black text-lg">TOTAL CARRIER PAY</h4>
            <p className="text-sm text-gray-600">Payment terms: Standard (unless otherwise agreed)</p>
          </div>
          <p className="text-4xl font-black">${order.carrier_price || 0}</p>
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-600 space-y-2">
          <p className="font-bold text-black text-sm mb-1">Dispatch Terms & Conditions:</p>
          <p>1. Carrier is responsible for inspecting vehicles at pickup and delivery. Damage not noted on BOL is the responsibility of the carrier.</p>
          <p>2. Carrier must provide proof of valid insurance naming broker as certificate holder prior to dispatch.</p>
          <p>3. Do not invoice customer directly. Submit all invoices and signed BOLs to Neon Auto Transport.</p>
        </div>
      </div>
    </div>
  );
}
