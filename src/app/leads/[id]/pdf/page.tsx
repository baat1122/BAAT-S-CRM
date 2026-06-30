"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";

export default function QuotePDFView({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [quote, setQuote] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [jsPdfLoaded, setJsPdfLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const { data: quoteData } = await supabase.from("leads").select("*").eq("id", id).single();
      if (quoteData) setQuote(quoteData);
      
      const { data: vehiclesData } = await supabase.from("quote_vehicles").select("*").eq("lead_id", id);
      if (vehiclesData) setVehicles(vehiclesData);
    }
    fetchData();

    // Load jsPDF from CDN
    if (!(window as any).jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => setJsPdfLoaded(true);
      document.body.appendChild(script);
    } else {
      setJsPdfLoaded(true);
    }
  }, [id, refreshKey]);

  const generatePDF = async () => {
    setIsDownloading(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({ format: 'letter', unit: 'pt' });

      // ── Load logo as base64 + get natural dimensions ─────────
      let logoBase64: string | null = null;
      let logoW = 120;
      let logoH = 90;
      try {
        const res = await fetch('/logo.jpg');
        const blob = await res.blob();
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        // Measure natural dimensions to preserve aspect ratio
        const dims = await new Promise<{w: number; h: number}>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.src = logoBase64!;
        });
        // Fit inside a 140×100 box while preserving ratio
        const maxW = 140, maxH = 100;
        const ratio = Math.min(maxW / dims.w, maxH / dims.h);
        logoW = dims.w * ratio;
        logoH = dims.h * ratio;
      } catch (e) {
        console.warn('Logo could not be loaded:', e);
      }

      // ── Header ───────────────────────────────────────────────
      if (logoBase64) {
        doc.addImage(logoBase64, 'JPEG', 40, 25, logoW, logoH);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(17, 24, 39);
        doc.text("BEST AMERICAN AUTO TRANSPORT", 40, 60);
      }

      const textStartY = 25 + logoH + 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text("5 Great Valley Pkwy", 40, textStartY);
      doc.text("Malvern, Pennsylvania 19355", 40, textStartY + 13);
      doc.setFont("helvetica", "bold");
      doc.text("Phone: (302) 355-5544", 40, textStartY + 26);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("MC: 1662088  |  DOT: 4277211", 40, textStartY + 39);

      // Separator line position depends on logo height
      const separatorY = Math.max(textStartY + 55, 155);

      const quoteLabel = quote.custom_order_id
        ? quote.custom_order_id
        : `${quote.id.split('-')[0].toUpperCase()}`;

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("TRANSPORT QUOTE", 570, 45, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, 570, 62, { align: "right" });
      doc.text(`Quote ID: ${quoteLabel}`, 570, 77, { align: "right" });

      // ── Blue separator line ───────────────────────────────────
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.line(40, separatorY, 570, separatorY);

      // ── Customer Details ──────────────────────────────────────
      const detailsStartY = separatorY + 38;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text("CUSTOMER DETAILS", 40, detailsStartY);

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(16);
      const nameLines = doc.splitTextToSize(quote.customer_name || "Unknown", 220);
      doc.text(nameLines, 40, detailsStartY + 23);
      let customerY = detailsStartY + 23 + (nameLines.length * 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99);
      doc.text(quote.email || "No email provided", 40, customerY);
      customerY += 16;
      doc.text(quote.phone || "No phone provided", 40, customerY);
      customerY += 16;

      // ── Routing ───────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text("ROUTING", 310, detailsStartY);

      let routingY = detailsStartY + 23;
      const addRoutingLine = (label: string, value: string, isBold = false) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128);
        doc.text(label, 310, routingY);

        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(17, 24, 39);
        const lines = doc.splitTextToSize(value || "TBD", 210);
        doc.text(lines, 390, routingY);
        routingY += (lines.length * 16) + 4;
      };

      addRoutingLine("Origin:", quote.pickup_location, true);
      addRoutingLine("Destination:", quote.dropoff_location, true);
      addRoutingLine("Est. Pickup:", quote.est_pickup_date);
      addRoutingLine("Est. Delivery:", quote.est_delivery_date);

      // ── Vehicles ──────────────────────────────────────────────
      let yPos = Math.max(customerY, routingY) + 40;
      if (yPos < 340) yPos = 340;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text("VEHICLES INCLUDED", 40, yPos - 15);

      vehicles.forEach((v) => {
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(1);
        doc.roundedRect(40, yPos, 532, 56, 4, 4, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text(`${v.year} ${v.make} ${v.model}`, 55, yPos + 24);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text(`VIN: ${v.vin || 'Pending'}`, 55, yPos + 42);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(55, 65, 81);
        doc.text(v.operable ? "Operable" : "Inoperable", 555, yPos + 24, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text(`Trailer: ${v.trailer_type}`, 555, yPos + 42, { align: "right" });

        yPos += 70;
      });

      // ── Price Box (vibrant blue) ───────────────────────────────
      yPos += 15;
      // Gradient simulation: draw two overlapping rects
      doc.setFillColor(29, 78, 216); // blue-700
      doc.roundedRect(40, yPos, 532, 80, 6, 6, 'F');
      doc.setFillColor(37, 99, 235); // blue-600 overlay
      doc.roundedRect(40, yPos, 300, 80, 6, 6, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(219, 234, 254); // blue-100
      doc.text("Estimated Total Price", 60, yPos + 35);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(147, 197, 253); // blue-300
      doc.text("Valid for 7 days from generation.", 60, yPos + 55);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.setTextColor(255, 255, 255);
      doc.text(`$${quote.estimated_price}`, 550, yPos + 52, { align: "right" });

      // ── Footer ────────────────────────────────────────────────
      yPos += 140;
      if (yPos < 680) yPos = 700;

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(1);
      doc.line(40, yPos, 572, yPos);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text("Thank you for choosing Best American Auto Transport.", 306, yPos + 30, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text("Call us at (302) 355-5544 to book your transport today.", 306, yPos + 50, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("MC: 1662088  |  DOT: 4277211", 306, yPos + 68, { align: "center" });

      doc.save(`Quote-${quoteLabel}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Falling back to print dialog.");
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  if (!quote) return <div className="p-8">Generating PDF...</div>;

  const displayQuoteId = quote.custom_order_id
    ? quote.custom_order_id
    : quote.id.split('-')[0].toUpperCase();

  return (
    <div className="bg-gray-100 text-black min-h-screen font-sans absolute inset-0 z-50 overflow-auto">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm print:hidden">
        <p className="text-sm text-gray-500 font-medium">Previewing Quote for {quote.customer_name}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setQuote(null); setRefreshKey(k => k + 1); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
            title="Reload data from database (use after editing Order ID)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Refresh Data
          </button>
          <button 
            onClick={generatePDF}
            disabled={!jsPdfLoaded || isDownloading}
            className="px-6 py-2 bg-neon-blue text-white font-bold rounded-lg shadow hover:bg-electric-cyan transition-colors flex items-center gap-2 disabled:opacity-50"
          >
          {isDownloading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating PDF...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download PDF
            </span>
          )}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden; }
          #printable-pdf, #printable-pdf * { visibility: visible; }
          #printable-pdf { position: absolute; left: 0; top: 0; width: 100%; padding: 20mm; }
        }
      `}} />

      <div className="py-8">
        <div id="printable-pdf" className="max-w-4xl mx-auto p-12 bg-white shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-[#8b102b] pb-6 mb-8">
            <div>
              {/* Logo — naturally proportioned */}
              <img
                src="/logo.jpg"
                alt="BEST AMERICAN AUTO TRANSPORT"
                style={{ maxHeight: '90px', maxWidth: '180px', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block', marginBottom: '8px' }}
              />
              <div className="text-xs text-gray-600 space-y-0.5">
                <p>5 Great Valley Pkwy</p>
                <p>Malvern, Pennsylvania 19355</p>
                <p className="font-bold mt-1">Phone: (302) 355-5544</p>
                <p className="text-gray-500 font-medium">MC: 1662088 &nbsp;|&nbsp; DOT: 4277211</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900">TRANSPORT QUOTE</h2>
              <p className="text-gray-500">Date: {new Date(quote.created_at).toLocaleDateString()}</p>
              <p className="text-gray-500">Quote ID: {displayQuoteId}</p>
            </div>
          </div>

          {/* Customer + Routing */}
          <div className="grid grid-cols-2 gap-12 mb-10">
            <div>
              <h3 className="text-sm font-bold text-[#8b102b] uppercase tracking-wider mb-3">Customer Details</h3>
              <p className="font-bold text-gray-900 text-lg">{quote.customer_name}</p>
              <p className="text-gray-600">{quote.email || 'No email provided'}</p>
              <p className="text-gray-600">{quote.phone || 'No phone provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#8b102b] uppercase tracking-wider mb-3">Routing</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Origin:</span>
                  <span className="font-bold text-gray-900">{quote.pickup_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Destination:</span>
                  <span className="font-bold text-gray-900">{quote.dropoff_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Est. Pickup:</span>
                  <span className="text-gray-900">{quote.est_pickup_date || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Est. Delivery:</span>
                  <span className="text-gray-900">{quote.est_delivery_date || 'TBD'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles */}
          <div className="mb-12">
            <h3 className="text-sm font-bold text-[#8b102b] uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Vehicles Included</h3>
            <div className="space-y-4">
              {vehicles.map((v, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{v.year} {v.make} {v.model}</p>
                    <p className="text-gray-500 text-sm">VIN: {v.vin || 'Pending'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-700">{v.operable ? 'Operable' : 'Inoperable'}</p>
                    <p className="text-gray-500 text-sm">Trailer: {v.trailer_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Estimated Price Bar (vibrant burgundy gradient) ── */}
          <div className="rounded-xl p-8 flex justify-between items-center text-white"
               style={{ background: 'linear-gradient(135deg, #590014 0%, #8b102b 50%, #a31c3b 100%)' }}>
            <div>
              <p className="text-red-100 font-medium">Estimated Total Price</p>
              <p className="text-sm text-red-200 mt-1">Valid for 7 days from generation.</p>
            </div>
            <p className="text-4xl font-black text-white drop-shadow-lg">${quote.estimated_price}</p>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-gray-500 text-sm border-t border-gray-200 pt-8">
            <p>Thank you for choosing Best American Auto Transport.</p>
            <p className="font-bold mt-1 text-gray-900">Call us at (302) 355-5544 to book your transport today.</p>
            <p className="text-gray-400 mt-1 text-xs">MC: 1662088 &nbsp;|&nbsp; DOT: 4277211</p>
          </div>
        </div>
      </div>
    </div>
  );
}
