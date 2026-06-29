"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";

export default function InvoicePDFView({ params }: { params: Promise<{ id: string }> }) {
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

  if (!order) return <div className="p-8 text-black bg-white">Generating Invoice...</div>;

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
        <div className="flex justify-between items-start border-b border-gray-300 pb-8 mb-8">
          <div>
            <img src="/logo.jpg" alt="BEST AMERICAN AUTO TRANSPORT" className="h-16 mb-2 object-contain" />
            <div className="mt-4 text-xs text-gray-600 space-y-0.5">
              <p>5 Great Valley Pkwy</p>
              <p>Malvern, Pennsylvania 19355</p>
              <p className="font-bold mt-1">Phone: (302) 355-5544</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-gray-500">Invoice No:</span>
              <span className="font-bold text-gray-900">{order.order_id}-INV</span>
              <span className="text-gray-500">Date:</span>
              <span className="font-bold text-gray-900">{new Date().toLocaleDateString()}</span>
              <span className="text-gray-500">Due Date:</span>
              <span className="font-bold text-gray-900">Due on Receipt</span>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
          <p className="font-bold text-gray-900 text-lg">{order.customers?.customer_name || 'N/A'}</p>
          <p className="text-gray-600">{order.customers?.email}</p>
          <p className="text-gray-600">{order.customers?.phone}</p>
        </div>

        {/* Route Info */}
        <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Origin</p>
            <p className="font-bold text-gray-900">{order.pickup_location}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Destination</p>
            <p className="font-bold text-gray-900">{order.dropoff_location}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-3 px-2 font-bold text-gray-900 text-sm">Description (Vehicles)</th>
                <th className="py-3 px-2 font-bold text-gray-900 text-sm">Condition</th>
                <th className="py-3 px-2 font-bold text-gray-900 text-sm text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-4 px-2">
                    <p className="font-bold text-gray-900">{v.year} {v.make} {v.model}</p>
                    <p className="text-xs text-gray-500">VIN: {v.vin || 'Not Provided'}</p>
                  </td>
                  <td className="py-4 px-2 text-sm text-gray-600">{v.operable ? 'Operable' : 'Inoperable'}</td>
                  <td className="py-4 px-2 text-right font-bold text-gray-900">
                    {/* Splitting price roughly equally among vehicles for display purposes */}
                    ${(order.customer_price / vehicles.length).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-16">
          <div className="w-1/2">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="text-gray-900 font-bold">${order.customer_price}</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-xl text-gray-900 font-black">Total Amount Due</span>
              <span className="text-2xl text-blue-600 font-black">${order.customer_price}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
          <p className="font-bold text-gray-900 mb-2">Payment Terms</p>
          <p>Please remit payment immediately upon receipt of this invoice.</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
