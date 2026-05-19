"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";

export default function BOLPDFView({ params }: { params: Promise<{ id: string }> }) {
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

  if (!order) return <div className="p-8 text-black bg-white">Generating BOL...</div>;

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
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase">Bill of Lading</h1>
          <div className="text-right border-l-2 border-black pl-4">
            <p className="font-bold text-lg">Order ID: {order.order_id}</p>
            <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Carrier Info */}
        <div className="border border-black mb-6 flex">
          <div className="w-1/2 p-3 border-r border-black">
            <h3 className="font-bold text-sm uppercase mb-1">Carrier Information</h3>
            <p className="font-bold">{order.carriers?.company_name || 'Carrier Name: _______________________'}</p>
            <p className="text-sm">Driver Name: _______________________</p>
            <p className="text-sm">Truck/Trailer Info: ___________________</p>
          </div>
          <div className="w-1/2 p-3">
            <h3 className="font-bold text-sm uppercase mb-1">Broker Information</h3>
            <img src="/logo.jpg" alt="Neon Auto Transport" className="h-8 mb-1 object-contain" />
            <p className="text-xs">2709 Neabsco Common Pl suit#101</p>
            <p className="text-xs">Woodbridge, VA 22191</p>
            <p className="text-sm font-bold mt-1">(571) 576-7711</p>
          </div>
        </div>

        {/* Route Details */}
        <div className="border border-black mb-6">
          <div className="grid grid-cols-2">
            <div className="p-3 border-r border-black">
              <h3 className="font-bold text-sm uppercase mb-2">1. Origin (Pickup)</h3>
              <p className="text-lg font-bold">{order.pickup_location}</p>
              <p className="text-sm mt-2 font-bold text-gray-600">Contact: {order.customers?.customer_name}</p>
              <p className="text-sm text-gray-600">Phone: {order.customers?.phone}</p>
              <div className="mt-4 pt-4 border-t border-dotted border-gray-400">
                <p className="text-sm mb-1">Signature at Pickup:</p>
                <div className="h-10 border-b border-black"></div>
                <p className="text-xs text-gray-500 mt-1">X_______________________________________ Date: ______</p>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm uppercase mb-2">2. Destination (Delivery)</h3>
              <p className="text-lg font-bold">{order.dropoff_location}</p>
              <p className="text-sm mt-2 font-bold text-gray-600">Contact: {order.customers?.customer_name}</p>
              <p className="text-sm text-gray-600">Phone: {order.customers?.phone}</p>
              <div className="mt-4 pt-4 border-t border-dotted border-gray-400">
                <p className="text-sm mb-1">Signature at Delivery (Receiver):</p>
                <div className="h-10 border-b border-black"></div>
                <p className="text-xs text-gray-500 mt-1">X_______________________________________ Date: ______</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="border border-black mb-8">
          <h3 className="bg-gray-200 font-bold text-sm uppercase p-2 border-b border-black">Vehicle Inspection Report</h3>
          {vehicles.map((v, i) => (
            <div key={i} className={`p-3 ${i !== vehicles.length - 1 ? 'border-b border-black' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-lg">{i + 1}. {v.year} {v.make} {v.model}</p>
                <p className="text-sm font-bold border border-black px-2 py-1">{v.operable ? 'Operable' : 'INOPERABLE'}</p>
              </div>
              <p className="text-sm text-gray-600 mb-3"><span className="font-bold">VIN:</span> {v.vin || '___________________________'}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border border-dashed border-gray-400 p-2 text-center h-32 flex flex-col justify-center">
                  <p className="text-xs text-gray-500 mb-2">Pre-Existing Damage (Origin)</p>
                  <p className="text-gray-300">Mark damage on inspection slip</p>
                  <div className="mt-auto border-t border-black pt-1 text-xs text-left">Notes: </div>
                </div>
                <div className="border border-dashed border-gray-400 p-2 text-center h-32 flex flex-col justify-center">
                  <p className="text-xs text-gray-500 mb-2">Delivery Damage (Destination)</p>
                  <p className="text-gray-300">Mark damage on inspection slip</p>
                  <div className="mt-auto border-t border-black pt-1 text-xs text-left">Notes: </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-xs text-justify text-gray-600">
          <p className="font-bold mb-1">Terms & Liability:</p>
          <p>By signing this Bill of Lading, the shipper/receiver acknowledges that the vehicle(s) described above were received in good condition, except as noted. Carrier is not responsible for acts of God, pre-existing damage, or mechanical failures. This document serves as the official receipt of cargo transport.</p>
        </div>
      </div>
    </div>
  );
}
