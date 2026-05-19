"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ReceiptPDFView({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: orderData } = await supabase
        .from("orders")
        .select(`*, customers (*)`)
        .eq("id", id)
        .single();
      
      if (orderData) setOrder(orderData);
      
      setTimeout(() => {
        window.print();
      }, 500);
    }
    fetchData();
  }, [id]);

  if (!order) return <div className="p-8 text-black bg-white">Generating Receipt...</div>;

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

      <div id="printable-pdf" className="max-w-2xl mx-auto p-12 bg-white border-2 border-gray-100 mt-10 shadow-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">PAYMENT RECEIPT</h1>
          <p className="text-gray-500 mt-1">Thank you for your business</p>
        </div>

        <div className="border-t border-b border-gray-200 py-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Receipt Number</p>
              <p className="font-medium text-gray-900">{order.order_id}-REC</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Date Paid</p>
              <p className="font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Received From</h3>
            <p className="font-bold text-gray-900">{order.customers?.customer_name || 'Customer'}</p>
            <p className="text-gray-600">{order.customers?.email}</p>
            <p className="text-gray-600">{order.customers?.phone}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Paid To</h3>
            <img src="/logo.jpg" alt="Neon Auto Transport" className="h-10 mb-2 object-contain" />
            <p className="text-xs text-gray-600">2709 Neabsco Common Pl suit#101</p>
            <p className="text-xs text-gray-600">Woodbridge, VA 22191</p>
            <p className="text-sm font-bold text-gray-900 mt-1">(571) 576-7711</p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Transport Order:</span>
            <span className="font-bold text-gray-900">{order.order_id}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Route:</span>
            <span className="font-bold text-gray-900 truncate max-wxs text-right text-sm">{order.pickup_location} → {order.dropoff_location}</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600">Vehicles:</span>
            <span className="font-bold text-gray-900 truncate max-wxs text-right text-sm">{order.vehicle_name}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-6 mt-6 flex justify-between items-center">
            <span className="text-xl text-gray-900 font-bold">Total Amount Paid</span>
            <span className="text-3xl text-green-600 font-black">${order.customer_price}</span>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>This is a valid receipt for the transaction mentioned above.</p>
          <p className="mt-1">If you have any questions, contact us at (571) 576-7711.</p>
        </div>
      </div>
    </div>
  );
}
