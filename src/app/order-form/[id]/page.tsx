"use client";

import { useState, useEffect, useRef, use } from "react";
import { supabase } from "@/lib/supabase/client";
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

  // Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: orderData } = await supabase
        .from("orders")
        .select(`*, customers (customer_name, phone, email)`)
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
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2.5;
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

  const handlePrint = () => window.print();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = authInput.trim().toLowerCase();
    const orderEmail = (order?.customers?.email || "").toLowerCase().trim();
    
    const cleanPhoneInput = authInput.replace(/\D/g,'');
    const orderPhone = (order?.customers?.phone || "").replace(/\D/g,'');

    if (
      (orderEmail && cleanInput === orderEmail) || 
      (orderPhone && cleanPhoneInput === orderPhone && cleanPhoneInput.length > 5)
    ) {
      setIsAuthenticated(true);
    } else {
      setAuthErrorMsg("The email or phone number does not match our records for this order.");
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#0284c7", display: "flex", alignItems: "center", gap: "12px", fontSize: "18px" }}>
          <Loader2 className="animate-spin" size={24} />
          Loading your order details…
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#ef4444", fontSize: "18px" }}>Order not found. Please check your link.</div>
      </div>
    );
  }

  // ── Security Gate Screen ──
  if (!isAuthenticated && !submitted) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div className="fade-in" style={{ width: "100%", maxWidth: "440px", background: "#ffffff", border: "1px solid rgba(0,240,255,0.2)", borderRadius: "20px", padding: "40px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg,#0284c7,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Truck size={28} color="#f8fafc" />
            </div>
            <h1 style={{ color: "#0f172a", fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Secure Order Access</h1>
            <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6" }}>
              To view and sign your order <strong style={{color:"#0284c7"}}>{order.order_id}</strong>, please verify your identity.
            </p>
          </div>
          
          {authErrorMsg && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#ef4444", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={16} /> {authErrorMsg}
            </div>
          )}

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>Email or Phone Number</label>
              <input 
                type="text" 
                value={authInput}
                onChange={(e) => setAuthInput(e.target.value)}
                placeholder="Enter email or phone" 
                required
                style={{ width: "100%", padding: "14px 16px", background: "#f8fafc", border: "1px solid #94a3b8", borderRadius: "12px", color: "#0f172a", fontSize: "15px", outline: "none", transition: "border-color 0.2s" }}
              />
            </div>
            <button 
              type="submit"
              style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg,#0284c7,#0369a1)", color: "#f8fafc", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 0 20px rgba(0,240,255,0.2)" }}
            >
              Access My Order
            </button>
          </form>
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", marginTop: "24px" }}>
            🔒 Protected by Neon Auto Transport
          </div>
        </div>
      </div>
    );
  }

  // ── Success Screen ──
  if (submitted) {
    return (
      <>
        <style>{`
          @media print {
            body { background: white !important; color: black !important; }
            .no-print { display: none !important; }
            .print-area { padding: 20px; }
          }
        `}</style>
        <div className="print-area" style={{ width: "100%", minHeight: "100vh", background: "#f8fafc", padding: "32px 16px" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#0284c7,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Truck size={24} color="#f8fafc" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "#0284c7", fontWeight: 800, fontSize: "20px", letterSpacing: "2px" }}>NEON AUTO TRANSPORT</div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>Licensed & Insured Auto Carrier</div>
                </div>
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.1), rgba(14,165,233,0.05))", border: "1px solid rgba(0,240,255,0.3)", borderRadius: "24px", padding: "40px", textAlign: "center", marginBottom: "32px" }}>
              <CheckCircle size={64} color="#22c55e" style={{ margin: "0 auto 16px" }} />
              <h1 style={{ color: "#22c55e", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Order Signed & Confirmed!</h1>
              <p style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "4px" }}>Thank you, <strong style={{ color: "#0f172a" }}>{customerName}</strong></p>
              <p style={{ color: "#64748b", fontSize: "14px" }}>Your transport agreement for <strong style={{ color: "#0284c7" }}>{order.order_id}</strong> has been submitted.</p>
            </div>

            {/* Order Summary */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "16px", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>Order Summary</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Order ID</div><div style={{ color: "#0284c7", fontWeight: 700 }}>{order.order_id}</div></div>
                <div><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Status</div><div style={{ color: "#22c55e", fontWeight: 700 }}>✓ Signed</div></div>
                <div><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Origin</div><div style={{ color: "#0f172a", fontWeight: 600 }}>{pickupFullAddress}</div></div>
                <div><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Destination</div><div style={{ color: "#0f172a", fontWeight: 600 }}>{dropoffFullAddress}</div></div>
                <div><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Agreed Rate</div><div style={{ color: "#0f172a", fontWeight: 700, fontSize: "18px" }}>${order.customer_price || 0}</div></div>
                <div><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Date Signed</div><div style={{ color: "#0f172a" }}>{new Date().toLocaleDateString()}</div></div>
              </div>
            </div>

            <div className="no-print" style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 32px", background: "linear-gradient(135deg,#0284c7,#0369a1)", color: "#f8fafc", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
                <Download size={18} /> Download PDF
              </button>
            </div>

            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", marginTop: "32px" }}>
              Questions? Call us at (571) 576-7711 · neonautotransport.com
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Main Form ──
  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    color: "#0f172a",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  };

  const labelStyle = { display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: "6px" };

  const sectionStyle = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
  };

  const sectionHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    paddingBottom: "14px",
    borderBottom: "1px solid #e2e8f0",
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        input:focus, textarea:focus { border-color: #0284c7 !important; box-shadow: 0 0 0 3px rgba(0,240,255,0.1); }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease both; }
      `}</style>

      <div style={{ width: "100%", minHeight: "100vh", background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)", padding: "32px 16px 80px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

          {/* ── Header ── */}
          <div className="fade-in" style={{ textAlign: "center", marginBottom: "36px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "14px", marginBottom: "20px", padding: "14px 24px", background: "rgba(0,240,255,0.05)", border: "1px solid rgba(0,240,255,0.15)", borderRadius: "16px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "linear-gradient(135deg,#0284c7,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Truck size={22} color="#f8fafc" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "#0284c7", fontWeight: 800, fontSize: "18px", letterSpacing: "2px" }}>NEON AUTO TRANSPORT</div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>Licensed & Insured · (571) 576-7711</div>
              </div>
            </div>
            <h1 style={{ color: "#0f172a", fontSize: "26px", fontWeight: 800, marginBottom: "8px" }}>
              Order Confirmation Form
            </h1>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)", borderRadius: "999px" }}>
              <span style={{ color: "#0284c7", fontWeight: 700, fontSize: "14px" }}>{order.order_id}</span>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>· Please review and sign below</span>
            </div>
          </div>

          {/* ── Customer Info ── */}
          <div className="fade-in" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(0,240,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={18} color="#0284c7" />
              </div>
              <div>
                <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "15px" }}>Your Information</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Review and update if needed</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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

          {/* ── Vehicles ── */}
          {vehicles.length > 0 && (
            <div className="fade-in" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(0,240,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Car size={18} color="#0284c7" />
                </div>
                <div>
                  <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "15px" }}>Vehicle Details</div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>Add VIN if not already provided</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {vehicles.map((v, i) => (
                  <div key={v.id} style={{ background: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.1)", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>{v.year} {v.make} {v.model}</div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: v.operable ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: v.operable ? "#22c55e" : "#ef4444" }}>
                            {v.operable ? "Operable" : "Inoperable"}
                          </span>
                          <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: "#e2e8f0", color: "#94a3b8" }}>
                            {v.trailer_type}
                          </span>
                        </div>
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "12px" }}>#{i + 1}</div>
                    </div>
                    <div>
                      <label style={labelStyle}>VIN Number</label>
                      <input
                        style={inputStyle}
                        value={vehicleVins[v.id] || ""}
                        onChange={e => setVehicleVins({ ...vehicleVins, [v.id]: e.target.value })}
                        placeholder="17-character VIN (optional)"
                        maxLength={17}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pickup ── */}
          <div className="fade-in" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(0,240,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={18} color="#0284c7" />
              </div>
              <div>
                <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "15px" }}>Pickup Details</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Where should the driver pick up the vehicle?</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Full Pickup Address *</label>
                <input style={inputStyle} value={pickupFullAddress} onChange={e => setPickupFullAddress(e.target.value)} placeholder="123 Main St, Miami, FL 33101" />
              </div>
              <div>
                <label style={labelStyle}>Contact Name at Pickup</label>
                <input style={inputStyle} value={pickupContactName} onChange={e => setPickupContactName(e.target.value)} placeholder="Person releasing the vehicle" />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone at Pickup</label>
                <input style={inputStyle} value={pickupContactPhone} onChange={e => setPickupContactPhone(e.target.value)} placeholder="(555) 000-0000" />
              </div>
            </div>
          </div>

          {/* ── Dropoff ── */}
          <div className="fade-in" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(14,165,233,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={18} color="#0369a1" />
              </div>
              <div>
                <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "15px" }}>Delivery Details</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Where should the vehicle be delivered?</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Full Delivery Address *</label>
                <input style={inputStyle} value={dropoffFullAddress} onChange={e => setDropoffFullAddress(e.target.value)} placeholder="456 Oak Ave, Dallas, TX 75201" />
              </div>
              <div>
                <label style={labelStyle}>Contact Name at Delivery</label>
                <input style={inputStyle} value={dropoffContactName} onChange={e => setDropoffContactName(e.target.value)} placeholder="Person receiving the vehicle" />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone at Delivery</label>
                <input style={inputStyle} value={dropoffContactPhone} onChange={e => setDropoffContactPhone(e.target.value)} placeholder="(555) 000-0000" />
              </div>
            </div>
          </div>

          {/* ── Shipment Summary (read-only) ── */}
          <div className="fade-in" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DollarSign size={18} color="#22c55e" />
              </div>
              <div>
                <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "15px" }}>Shipment Summary</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Your agreed pricing & dates</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "14px" }}>
                <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Est. Pickup</div>
                <div style={{ color: "#0f172a", fontWeight: 600 }}>{order.est_pickup_date || "TBD"}</div>
              </div>
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "14px" }}>
                <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Est. Delivery</div>
                <div style={{ color: "#0f172a", fontWeight: 600 }}>{order.est_delivery_date || "TBD"}</div>
              </div>
              <div style={{ background: "rgba(0,240,255,0.05)", border: "1px solid rgba(0,240,255,0.15)", borderRadius: "10px", padding: "14px", gridColumn: "1 / -1" }}>
                <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Total Agreed Rate</div>
                <div style={{ color: "#0284c7", fontWeight: 800, fontSize: "28px" }}>${order.customer_price || 0}</div>
                <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>Due upon delivery</div>
              </div>
            </div>
          </div>

          {/* ── Terms & Conditions ── */}
          <div className="fade-in" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircle size={18} color="#f59e0b" />
              </div>
              <div>
                <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "15px" }}>Terms & Conditions</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Please read carefully before signing</div>
              </div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", height: "200px", overflowY: "auto", marginBottom: "16px" }}>
              <pre style={{ color: "#94a3b8", fontSize: "12px", lineHeight: "1.8", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{TERMS}</pre>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "#0284c7", cursor: "pointer" }}
              />
              <span style={{ color: "#0f172a", fontSize: "14px" }}>
                I have read and agree to the Terms & Conditions above. I authorize Neon Auto Transport to arrange the shipment of my vehicle(s).
              </span>
            </label>
          </div>

          {/* ── Digital Signature ── */}
          <div className="fade-in" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PenLine size={18} color="#8b5cf6" />
              </div>
              <div>
                <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "15px" }}>Digital Signature</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Draw your signature in the box below</div>
              </div>
            </div>
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: `2px dashed ${hasSigned ? "rgba(0,240,255,0.4)" : "#cbd5e1"}`, transition: "border-color 0.3s" }}>
              <canvas
                ref={canvasRef}
                width={720}
                height={160}
                style={{ display: "block", background: "#ffffff", cursor: "crosshair", width: "100%", touchAction: "none" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
              {!hasSigned && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ textAlign: "center", color: "#94a3b8" }}>
                    <PenLine size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <div style={{ fontSize: "14px" }}>Sign here with your mouse or finger</div>
                  </div>
                </div>
              )}
            </div>
            {hasSigned && (
              <button onClick={clearSignature} style={{ marginTop: "10px", padding: "6px 14px", background: "#f1f5f9", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>
                Clear Signature
              </button>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "#ef4444" }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: "14px" }}>{error}</span>
            </div>
          )}

          {/* ── Submit Button ── */}
          <div className="no-print" style={{ textAlign: "center" }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "16px 48px",
                background: submitting ? "#1e293b" : "linear-gradient(135deg, #0284c7, #0369a1)",
                color: submitting ? "#94a3b8" : "#f8fafc",
                border: "none",
                borderRadius: "14px",
                fontWeight: 800,
                fontSize: "16px",
                cursor: submitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: submitting ? "none" : "0 0 30px rgba(0,240,255,0.3)",
                transition: "all 0.3s",
                letterSpacing: "0.5px",
              }}
            >
              {submitting ? (
                <><Loader2 size={20} className="animate-spin" /> Submitting…</>
              ) : (
                <><CheckCircle size={20} /> Submit & Sign Order</>
              )}
            </button>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "12px" }}>
              🔒 Your information is secure and encrypted
            </div>
          </div>

          <div style={{ textAlign: "center", color: "#334155", fontSize: "12px", marginTop: "40px" }}>
            Questions? Call us at <span style={{ color: "#0284c7" }}>(571) 576-7711</span> · neonautotransport.com
          </div>
        </div>
      </div>
    </>
  );
}
