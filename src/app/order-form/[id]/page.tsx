"use client";

import { useState, useEffect, useRef, use } from "react";
import { supabase } from "@/lib/supabase/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  CheckCircle,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  PenLine,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign,
  Car,
  ShieldCheck,
  ChevronLeft
} from "lucide-react";

const TERMS = `NEON AUTO TRANSPORT — VEHICLE TRANSPORT AGREEMENT

1. CARRIER AUTHORITY: Neon Auto Transport operates as a licensed motor carrier / freight broker. Transport services are provided by DOT-registered carriers.

2. VEHICLE CONDITION: The customer acknowledges the vehicle(s) listed are in the described condition (operable/inoperable). Any pre-existing damage should be noted on the Bill of Lading at pickup.

3. PAYMENT: The agreed tariff is due upon delivery unless alternative arrangements have been confirmed in writing. Accepted methods: Zelle, Cash, Certified Check.

4. INSURANCE: All vehicles are covered by the assigned carrier's cargo insurance policy during transport. The customer is encouraged to maintain their personal vehicle insurance during transit.

5. PICK UP & DELIVERY WINDOWS: Pickup and delivery dates provided are estimates. Neon Auto Transport is not liable for delays caused by weather, mechanical issues, or other circumstances beyond our control.

6. CANCELLATION POLICY: Orders cancelled after dispatch has been confirmed are subject to a cancellation fee. Please contact us immediately if plans change.

7. VEHICLE KEYS: The customer agrees to provide a working set of keys to the driver at pickup. The driver is authorized to operate the vehicle solely for the purpose of loading and unloading.

8. MODIFICATIONS & PERSONAL ITEMS: Neon Auto Transport is not responsible for personal items left inside the vehicle or aftermarket modifications. Personal items are transported at the owner's risk.

9. DISPUTE RESOLUTION: Any disputes shall be resolved through binding arbitration in accordance with the laws of the State of Virginia.

10. AGREEMENT: By signing below, the customer confirms they have read, understood, and agree to these Terms & Conditions and authorize Neon Auto Transport to arrange the shipment of the listed vehicle(s).`;

export default function OrderFormPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [order, setOrder] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Security Gate
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [authErrorMsg, setAuthErrorMsg] = useState("");

  // Editable customer fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [pickupFullAddress, setPickupFullAddress] = useState("");
  const [pickupContactName, setPickupContactName] = useState("");
  const [pickupContactPhone, setPickupContactPhone] = useState("");
  const [dropoffFullAddress, setDropoffFullAddress] = useState("");
  const [dropoffContactName, setDropoffContactName] = useState("");
  const [dropoffContactPhone, setDropoffContactPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [vehicleVins, setVehicleVins] = useState<Record<string, string>>({});

  // Signature & PDF
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: orderData } = await supabase
        .from("orders")
        .select(\`*, customers (customer_name, phone, email)\`)
        .eq("id", id)
        .single() as { data: any };

      if (orderData) {
        setOrder(orderData);
        setCustomerName(orderData.customers?.customer_name || "");
        setCustomerPhone(orderData.customers?.phone || "");
        setCustomerEmail(orderData.customers?.email || "");
        setPickupFullAddress(orderData.pickup_location || "");
        setDropoffFullAddress(orderData.dropoff_location || "");
        setPickupContactName(orderData.pickup_contact_name || "");
        setPickupContactPhone(orderData.pickup_contact_phone || "");
        setDropoffContactName(orderData.dropoff_contact_name || "");
        setDropoffContactPhone(orderData.dropoff_contact_phone || "");
        if (orderData.form_submitted) setSubmitted(true);
      }

      const { data: vehiclesData } = await supabase
        .from("order_vehicles")
        .select("*")
        .eq("order_id", id) as { data: any[] | null };

      if (vehiclesData) {
        setVehicles(vehiclesData);
        const vins: Record<string, string> = {};
        vehiclesData.forEach((v) => { vins[v.id] = v.vin || ""; });
        setVehicleVins(vins);
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  // Signature drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setHasSigned(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#00f0ff"; // Neon Cyan Signature!
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#00f0ff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
    }
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError("Please enter your name."); return; }
    if (!termsAccepted) { setError("Please accept the Terms & Conditions."); return; }
    if (!hasSigned) { setError("Please provide your digital signature."); return; }

    setError(null);
    setSubmitting(true);

    const signatureData = canvasRef.current?.toDataURL("image/png") || "";

    await supabase.from("orders").update({
      pickup_location: pickupFullAddress,
      dropoff_location: dropoffFullAddress,
      pickup_contact_name: pickupContactName,
      pickup_contact_phone: pickupContactPhone,
      dropoff_contact_name: dropoffContactName,
      dropoff_contact_phone: dropoffContactPhone,
      customer_signature: signatureData,
      signed_at: new Date().toISOString(),
      terms_accepted: true,
      form_submitted: true,
    }).eq("id", id);

    if (order?.customer_id) {
      await supabase.from("customers").update({
        customer_name: customerName,
        phone: customerPhone,
        email: customerEmail,
      }).eq("id", order.customer_id);
    }

    for (const [vehicleId, vin] of Object.entries(vehicleVins)) {
      if (vin) await supabase.from("order_vehicles").update({ vin }).eq("id", vehicleId);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  const handlePrint = async () => {
    if (!pdfRef.current) return;
    setIsGeneratingPdf(true);
    try {
      // Temporarily show the hidden div to capture it, but keep it out of viewport
      pdfRef.current.style.display = 'block';
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
      pdfRef.current.style.display = 'none';

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(\`Order_Agreement_\${order.order_id}.pdf\`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = authInput.trim().toLowerCase();
    const orderEmail = (order?.customers?.email || "").toLowerCase().trim();
    
    const cleanPhoneInput = authInput.replace(/\\D/g,'');
    const orderPhone = (order?.customers?.phone || "").replace(/\\D/g,'');

    if (
      (orderEmail && cleanInput === orderEmail) || 
      (orderPhone && cleanPhoneInput === orderPhone && cleanPhoneInput.length > 5)
    ) {
      setIsAuthenticated(true);
    } else {
      setAuthErrorMsg("The email or phone number does not match our records for this order.");
    }
  };

  // ── UI Theme Globals ──
  const themeBg = "linear-gradient(145deg, #020617 0%, #0a1024 100%)";
  const panelBg = "rgba(15, 23, 42, 0.6)";
  const glassBorder = "1px solid rgba(0, 240, 255, 0.15)";
  const glassShadow = "0 8px 32px 0 rgba(0, 240, 255, 0.05)";
  const neonCyan = "#00f0ff";
  const neonBlue = "#0ea5e9";
  const textPrimary = "#f8fafc";
  const textSecondary = "#94a3b8";

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: themeBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: neonCyan, display: "flex", alignItems: "center", gap: "12px", fontSize: "18px", textShadow: \`0 0 10px \${neonCyan}\` }}>
          <Loader2 className="animate-spin" size={28} />
          Loading Secure Portal…
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: themeBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#ef4444", fontSize: "18px", textShadow: "0 0 10px rgba(239,68,68,0.5)" }}>Order not found. Please check your link.</div>
      </div>
    );
  }

  // ── Security Gate Screen ──
  if (!isAuthenticated && !submitted) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: themeBg, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div className="fade-in glass-panel" style={{ width: "100%", maxWidth: "440px", background: panelBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: glassBorder, borderRadius: "24px", padding: "48px 32px", boxShadow: glassShadow }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: \`linear-gradient(135deg, \${neonCyan}, \${neonBlue})\`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: \`0 0 30px \${neonBlue}40\` }}>
              <ShieldCheck size={32} color="#020617" />
            </div>
            <h1 style={{ color: textPrimary, fontSize: "28px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.5px" }}>Secure Access</h1>
            <p style={{ color: textSecondary, fontSize: "15px", lineHeight: "1.6" }}>
              Verify your identity to view order <strong style={{color: neonCyan}}>{order.order_id}</strong>
            </p>
          </div>
          
          {authErrorMsg && (
            <div className="fade-in" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "14px 16px", marginBottom: "24px", color: "#ef4444", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle size={18} /> {authErrorMsg}
            </div>
          )}

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", color: textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Email or Phone Number</label>
              <input 
                type="text" 
                value={authInput}
                onChange={(e) => setAuthInput(e.target.value)}
                placeholder="Enter email or phone" 
                required
                className="neon-input"
                style={{ width: "100%", padding: "16px", background: "rgba(2, 6, 23, 0.7)", border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: "14px", color: textPrimary, fontSize: "16px", outline: "none", transition: "all 0.3s ease" }}
              />
            </div>
            <button 
              type="submit"
              className="neon-btn hover-glow"
              style={{ width: "100%", padding: "18px", background: \`linear-gradient(135deg, \${neonCyan}, \${neonBlue})\`, color: "#020617", border: "none", borderRadius: "14px", fontWeight: 800, fontSize: "16px", cursor: "pointer", transition: "all 0.3s ease", boxShadow: \`0 0 20px \${neonCyan}40\` }}
            >
              Access My Order
            </button>
          </form>
          <div style={{ textAlign: "center", color: textSecondary, fontSize: "13px", marginTop: "32px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <span style={{width:"8px", height:"8px", borderRadius:"50%", background:neonCyan, boxShadow:\`0 0 8px \${neonCyan}\`}}></span> Protected by Neon Auto Transport
          </div>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
          .fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
          .neon-input:focus { border-color: ${neonCyan} !important; box-shadow: 0 0 0 4px ${neonCyan}20, inset 0 0 10px ${neonCyan}10 !important; }
          .hover-glow:hover { transform: translateY(-2px); box-shadow: 0 10px 25px ${neonCyan}60 !important; }
        `}</style>
      </div>
    );
  }

  // ── Success Screen ──
  if (submitted) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: themeBg, padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <style>{`
          @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .slide-up { animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
          .hover-scale:hover { transform: scale(1.02); }
        `}</style>

        {/* HIDDEN PDF TEMPLATE (Strictly White/Black for proper printing) */}
        <div ref={pdfRef} style={{ display: 'none', position: 'absolute', top: '-9999px', left: 0, width: '800px', background: 'white', color: 'black', padding: '40px', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "20px", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "24px", margin: "0 0 10px 0" }}>NEON AUTO TRANSPORT</h1>
            <p style={{ margin: 0, color: "#444" }}>Licensed & Insured Auto Carrier · (571) 576-7711</p>
          </div>
          <h2 style={{ textAlign: "center", fontSize: "20px", marginBottom: "30px" }}>VEHICLE TRANSPORT AGREEMENT - ORDER #{order.order_id}</h2>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
            <div style={{ width: "48%" }}>
              <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "5px", marginBottom: "10px" }}>Customer Details</h3>
              <p style={{ margin: "5px 0" }}><strong>Name:</strong> {customerName}</p>
              <p style={{ margin: "5px 0" }}><strong>Phone:</strong> {customerPhone}</p>
              <p style={{ margin: "5px 0" }}><strong>Email:</strong> {customerEmail}</p>
              <p style={{ margin: "5px 0" }}><strong>Price:</strong> \${order.customer_price || 0}</p>
            </div>
            <div style={{ width: "48%" }}>
              <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "5px", marginBottom: "10px" }}>Route</h3>
              <p style={{ margin: "5px 0" }}><strong>Pickup:</strong> {pickupFullAddress}</p>
              <p style={{ margin: "5px 0" }}><strong>Dropoff:</strong> {dropoffFullAddress}</p>
            </div>
          </div>

          <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "5px", marginBottom: "10px" }}>Vehicles</h3>
          <ul style={{ marginBottom: "30px" }}>
            {vehicles.map((v, i) => (
              <li key={i} style={{ margin: "5px 0" }}>{v.year} {v.make} {v.model} {v.is_operable ? "(Operable)" : "(Inoperable)"} - VIN: {v.vin || "Not Provided"}</li>
            ))}
          </ul>

          <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "5px", marginBottom: "10px" }}>Terms & Conditions</h3>
          <p style={{ fontSize: "10px", lineHeight: "1.4", color: "#333", whiteSpace: "pre-wrap", marginBottom: "40px" }}>{TERMS}</p>

          <div style={{ borderTop: "2px solid #000", paddingTop: "20px" }}>
            <p style={{ marginBottom: "20px" }}><strong>Electronic Signature:</strong> I have read and agree to the Terms & Conditions.</p>
            <img src={order.customer_signature || ""} style={{ maxWidth: "300px", borderBottom: "1px solid #000" }} />
            <p style={{ marginTop: "10px" }}>Signed by: {customerName}</p>
            <p style={{ margin: "5px 0" }}>Date: {new Date(order.signed_at || new Date()).toLocaleString()}</p>
          </div>
        </div>
        {/* END HIDDEN PDF TEMPLATE */}

        <div className="slide-up" style={{ maxWidth: "600px", width: "100%" }}>
          <div style={{ background: panelBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: glassBorder, borderRadius: "24px", padding: "48px 32px", textAlign: "center", boxShadow: glassShadow, marginBottom: "24px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: \`rgba(34, 197, 94, 0.1)\`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: \`0 0 30px rgba(34, 197, 94, 0.2)\` }}>
              <CheckCircle size={48} color="#22c55e" />
            </div>
            <h1 style={{ color: "#22c55e", fontSize: "32px", fontWeight: 800, marginBottom: "12px", textShadow: "0 0 15px rgba(34, 197, 94, 0.3)" }}>Order Confirmed!</h1>
            <p style={{ color: textSecondary, fontSize: "16px", marginBottom: "32px", lineHeight: "1.6" }}>
              Thank you, <strong style={{ color: textPrimary }}>{customerName}</strong>.<br/>
              Your transport agreement for <strong style={{ color: neonCyan }}>{order.order_id}</strong> is secure.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", textAlign: "left", background: "rgba(2, 6, 23, 0.5)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
              <div><div style={{ color: textSecondary, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Route</div><div style={{ color: textPrimary, fontSize: "14px" }}>{pickupFullAddress.split(',')[0]} → {dropoffFullAddress.split(',')[0]}</div></div>
              <div><div style={{ color: textSecondary, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Agreed Rate</div><div style={{ color: neonCyan, fontWeight: 800, fontSize: "18px" }}>\${order.customer_price || 0}</div></div>
            </div>
          </div>

          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px", animationDelay: "0.2s" }}>
            <button 
              onClick={handlePrint} 
              disabled={isGeneratingPdf}
              className="hover-scale"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", padding: "20px", background: isGeneratingPdf ? "rgba(148, 163, 184, 0.2)" : \`linear-gradient(135deg, \${neonCyan}, \${neonBlue})\`, color: isGeneratingPdf ? textSecondary : "#020617", border: "none", borderRadius: "16px", fontWeight: 800, fontSize: "16px", cursor: isGeneratingPdf ? "not-allowed" : "pointer", transition: "all 0.3s ease", boxShadow: isGeneratingPdf ? "none" : \`0 0 25px \${neonCyan}50\` }}
            >
              {isGeneratingPdf ? <><Loader2 size={20} className="animate-spin" /> Generating PDF...</> : <><Download size={20} /> Download Official Agreement</>}
            </button>
            <button 
              onClick={() => setSubmitted(false)} 
              className="hover-scale"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", padding: "18px", background: "transparent", color: textSecondary, border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: "16px", fontWeight: 700, fontSize: "15px", cursor: "pointer", transition: "all 0.3s ease" }}
            >
              <ChevronLeft size={18} /> Edit Submission
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ──
  const inputStyle = {
    width: "100%",
    padding: "16px",
    background: "rgba(2, 6, 23, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    borderRadius: "14px",
    color: textPrimary,
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "all 0.3s ease",
  };

  const labelStyle = { display: "block", color: textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "8px" };

  const sectionStyle = {
    background: panelBg,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: glassBorder,
    borderRadius: "24px",
    padding: "32px",
    marginBottom: "24px",
    boxShadow: glassShadow,
  };

  const sectionHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "28px",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
  };

  return (
    <>
      <style>{\`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        input:focus, textarea:focus { border-color: \${neonCyan} !important; box-shadow: 0 0 0 4px \${neonCyan}20, inset 0 0 10px \${neonCyan}10 !important; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: \${neonBlue}; border-radius: 10px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
      \`}</style>

      <div style={{ width: "100%", minHeight: "100vh", background: themeBg, padding: "40px 20px 100px", overflowX: "hidden" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

          {/* ── Header ── */}
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "16px", marginBottom: "24px", padding: "12px 24px", background: "rgba(0, 240, 255, 0.05)", border: "1px solid rgba(0, 240, 255, 0.2)", borderRadius: "100px", boxShadow: \`0 0 20px \${neonCyan}10\` }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: \`linear-gradient(135deg, \${neonCyan}, \${neonBlue})\`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Truck size={18} color="#020617" />
              </div>
              <div style={{ color: neonCyan, fontWeight: 800, fontSize: "16px", letterSpacing: "3px" }}>NEON AUTO TRANSPORT</div>
            </div>
            <h1 style={{ color: textPrimary, fontSize: "40px", fontWeight: 900, marginBottom: "16px", letterSpacing: "-1px", textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
              Order Confirmation
            </h1>
            <div style={{ color: textSecondary, fontSize: "16px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Order <span style={{ color: neonCyan, fontWeight: 700, padding: "4px 10px", background: "rgba(0,240,255,0.1)", borderRadius: "6px" }}>#{order.order_id}</span>
            </div>
          </div>

          {/* ── Customer Info ── */}
          <div className="fade-up delay-1" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(0,240,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: \`0 0 15px \${neonCyan}20\` }}>
                <User size={20} color={neonCyan} />
              </div>
              <div>
                <div style={{ color: textPrimary, fontWeight: 800, fontSize: "18px" }}>Your Information</div>
                <div style={{ color: textSecondary, fontSize: "13px" }}>Review and update if needed</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input style={inputStyle} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(555) 000-0000" />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input style={inputStyle} value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="you@email.com" />
              </div>
            </div>
          </div>

          {/* ── Vehicle Info ── */}
          <div className="fade-up delay-2" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(0,240,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: \`0 0 15px \${neonCyan}20\` }}>
                <Car size={20} color={neonCyan} />
              </div>
              <div>
                <div style={{ color: textPrimary, fontWeight: 800, fontSize: "18px" }}>Vehicle Details</div>
                <div style={{ color: textSecondary, fontSize: "13px" }}>Verify your vehicles and provide VINs</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {vehicles.map((v, i) => (
                <div key={v.id} style={{ padding: "20px", background: "rgba(2, 6, 23, 0.5)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <div style={{ color: textPrimary, fontWeight: 800, fontSize: "16px", marginBottom: "8px" }}>
                      {v.year} {v.make} {v.model}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", background: v.is_operable ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: v.is_operable ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                        {v.is_operable ? "Operable" : "Inoperable"}
                      </span>
                      <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", background: "rgba(148,163,184,0.1)", color: textSecondary, fontWeight: 700 }}>
                        {v.type || "Open"}
                      </span>
                    </div>
                  </div>
                  <div style={{ flex: "1", minWidth: "250px", maxWidth: "350px" }}>
                    <label style={{ ...labelStyle, fontSize: "11px", marginBottom: "4px" }}>Vehicle VIN (Optional)</label>
                    <input 
                      style={{ ...inputStyle, padding: "12px", fontSize: "14px", fontFamily: "monospace" }} 
                      value={vehicleVins[v.id] || ""} 
                      onChange={e => setVehicleVins(prev => ({...prev, [v.id]: e.target.value}))} 
                      placeholder="17-Digit VIN" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Route & Contacts ── */}
          <div className="fade-up delay-3" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(0,240,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: \`0 0 15px \${neonCyan}20\` }}>
                <MapPin size={20} color={neonCyan} />
              </div>
              <div>
                <div style={{ color: textPrimary, fontWeight: 800, fontSize: "18px" }}>Route & Contacts</div>
                <div style={{ color: textSecondary, fontSize: "13px" }}>Where are we shipping to?</div>
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
              {/* Pickup */}
              <div style={{ paddingRight: "16px", borderRight: "1px solid rgba(148, 163, 184, 0.1)" }}>
                <div style={{ color: neonCyan, fontWeight: 800, fontSize: "15px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}><div style={{width:"8px",height:"8px",borderRadius:"50%",background:neonCyan,boxShadow:\`0 0 10px \${neonCyan}\`}}></div> Origin / Pickup</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div><label style={labelStyle}>Full Address</label><textarea style={{...inputStyle, minHeight: "80px", resize: "none"}} value={pickupFullAddress} onChange={e => setPickupFullAddress(e.target.value)} /></div>
                  <div><label style={labelStyle}>Contact Name</label><input style={inputStyle} value={pickupContactName} onChange={e => setPickupContactName(e.target.value)} /></div>
                  <div><label style={labelStyle}>Contact Phone</label><input style={inputStyle} value={pickupContactPhone} onChange={e => setPickupContactPhone(e.target.value)} /></div>
                </div>
              </div>

              {/* Dropoff */}
              <div>
                <div style={{ color: neonBlue, fontWeight: 800, fontSize: "15px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}><div style={{width:"8px",height:"8px",borderRadius:"50%",background:neonBlue,boxShadow:\`0 0 10px \${neonBlue}\`}}></div> Destination / Dropoff</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div><label style={labelStyle}>Full Address</label><textarea style={{...inputStyle, minHeight: "80px", resize: "none"}} value={dropoffFullAddress} onChange={e => setDropoffFullAddress(e.target.value)} /></div>
                  <div><label style={labelStyle}>Contact Name</label><input style={inputStyle} value={dropoffContactName} onChange={e => setDropoffContactName(e.target.value)} /></div>
                  <div><label style={labelStyle}>Contact Phone</label><input style={inputStyle} value={dropoffContactPhone} onChange={e => setDropoffContactPhone(e.target.value)} /></div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Terms & Signature ── */}
          <div className="fade-up delay-4" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(0,240,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: \`0 0 15px \${neonCyan}20\` }}>
                <PenLine size={20} color={neonCyan} />
              </div>
              <div>
                <div style={{ color: textPrimary, fontWeight: 800, fontSize: "18px" }}>Terms & Signature</div>
                <div style={{ color: textSecondary, fontSize: "13px" }}>Please read and sign below</div>
              </div>
            </div>

            <div style={{ background: "rgba(2, 6, 23, 0.7)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "16px", padding: "24px", height: "240px", overflowY: "auto", marginBottom: "24px", color: textSecondary, fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-wrap", boxShadow: "inset 0 4px 20px rgba(0,0,0,0.5)" }}>
              {TERMS}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", marginBottom: "32px", padding: "16px", background: termsAccepted ? "rgba(0,240,255,0.05)" : "transparent", border: \`1px solid \${termsAccepted ? "rgba(0,240,255,0.3)" : "rgba(148, 163, 184, 0.2)"}\`, borderRadius: "14px", transition: "all 0.3s ease" }}>
              <input 
                type="checkbox" 
                checked={termsAccepted} 
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ width: "20px", height: "20px", accentColor: neonCyan, cursor: "pointer" }}
              />
              <span style={{ color: textPrimary, fontWeight: 600, fontSize: "14px" }}>I have read and agree to the Terms & Conditions</span>
            </label>

            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Draw Your Signature</label>
                <button type="button" onClick={clearSignature} style={{ background: "transparent", border: "none", color: neonCyan, fontSize: "12px", fontWeight: 700, cursor: "pointer", padding: "4px 8px" }}>
                  Clear
                </button>
              </div>
              <div style={{ borderRadius: "16px", overflow: "hidden", border: \`2px solid \${hasSigned ? neonCyan : "rgba(148, 163, 184, 0.2)"}\`, transition: "border-color 0.3s ease", boxShadow: hasSigned ? \`0 0 20px \${neonCyan}20\` : "none" }}>
                <canvas 
                  ref={canvasRef}
                  width={900}
                  height={180}
                  style={{ display: "block", background: "#020617", cursor: "crosshair", width: "100%", touchAction: "none" }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </div>
              {!hasSigned && <div style={{ color: textSecondary, fontSize: "12px", marginTop: "8px", textAlign: "center" }}>Sign within the box above</div>}
            </div>

            {error && (
              <div className="fade-in" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "16px", marginBottom: "24px", color: "#ef4444", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button 
              onClick={handleSubmit} 
              disabled={submitting || !termsAccepted || !hasSigned}
              style={{ width: "100%", padding: "20px", background: (submitting || !termsAccepted || !hasSigned) ? "rgba(148, 163, 184, 0.1)" : \`linear-gradient(135deg, \${neonCyan}, \${neonBlue})\`, color: (submitting || !termsAccepted || !hasSigned) ? textSecondary : "#020617", border: "none", borderRadius: "16px", fontWeight: 800, fontSize: "18px", cursor: (submitting || !termsAccepted || !hasSigned) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", transition: "all 0.3s ease", boxShadow: (submitting || !termsAccepted || !hasSigned) ? "none" : \`0 0 30px \${neonCyan}40\` }}
            >
              {submitting ? <><Loader2 size={24} className="animate-spin" /> Submitting...</> : <><CheckCircle size={24} /> Submit & Sign Agreement</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
