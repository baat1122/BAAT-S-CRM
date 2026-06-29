"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, AlertCircle, User, Phone, Mail, ChevronRight, ChevronLeft, CheckCircle, Download } from "lucide-react";
import { useParams } from "next/navigation";
import { generatePDF, TERMS } from "@/lib/pdfGenerator";

export default function OrderFormPage() {
  const { id } = useParams();
  const formRef = useRef<HTMLDivElement>(null);


  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  // Auth Gate
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [authErrorMsg, setAuthErrorMsg] = useState("");

  // Wizard state
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Step 1: Order Info ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");

  // --- Step 2: Origin ---
  const [originAddress, setOriginAddress] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [isOriginContact, setIsOriginContact] = useState(false);
  const [originContactName, setOriginContactName] = useState("");
  const [originContactEmail, setOriginContactEmail] = useState("");
  const [originContactPhone, setOriginContactPhone] = useState("");

  // --- Step 3: Destination ---
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [isDestinationContact, setIsDestinationContact] = useState(false);
  const [destinationContactName, setDestinationContactName] = useState("");
  const [destinationContactEmail, setDestinationContactEmail] = useState("");
  const [destinationContactPhone, setDestinationContactPhone] = useState("");

  // --- Step 4: Terms ---
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [electronicSignature, setElectronicSignature] = useState("");
  const [ipAddress, setIpAddress] = useState("Fetching IP...");
  const [agreedDate, setAgreedDate] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data: orderData } = await supabase
        .from("orders")
        .select(`*, customers (customer_name, phone, email)`)
        .eq("id", id)
        .single() as { data: any };

      if (orderData) {
        setOrder(orderData);
        // Pre-fill some data if available
        const cName = orderData.customers?.customer_name || "";
        const cParts = cName.split(" ");
        setFirstName(cParts[0] || "");
        setLastName(cParts.slice(1).join(" ") || "");
        setEmail(orderData.customers?.email || "");
        setPhone(orderData.customers?.phone || "");
        
        if (orderData.pickup_location) {
          const pParts = orderData.pickup_location.split(", ");
          if (pParts.length > 1) {
            setOriginCity(pParts[pParts.length - 2] + ", " + pParts[pParts.length - 1]);
            setOriginAddress(pParts.slice(0, pParts.length - 2).join(", "));
          } else {
            setOriginAddress(orderData.pickup_location);
          }
        }
        if (orderData.dropoff_location) {
          const dParts = orderData.dropoff_location.split(", ");
          if (dParts.length > 1) {
            setDestinationCity(dParts[dParts.length - 2] + ", " + dParts[dParts.length - 1]);
            setDestinationAddress(dParts.slice(0, dParts.length - 2).join(", "));
          } else {
            setDestinationAddress(orderData.dropoff_location);
          }
        }

        setPickupDate(orderData.est_pickup_date || "");
      }

      const { data: vehiclesData } = await supabase
        .from("order_vehicles")
        .select("*")
        .eq("order_id", id) as { data: any[] | null };

      if (vehiclesData) {
        setVehicles(vehiclesData);
      }

      setLoading(false);
    }
    fetchData();

    // Fetch IP
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress("Unavailable"));
      
    // Set Current Date string for the signature block once mounted
    setAgreedDate(new Date().toString());
  }, [id]);

  // Handlers for Contact checkboxes
  useEffect(() => {
    if (isOriginContact) {
      setOriginContactName(`${firstName} ${lastName}`.trim());
      setOriginContactEmail(email);
      setOriginContactPhone(phone);
    } else {
      setOriginContactName("");
      setOriginContactEmail("");
      setOriginContactPhone("");
    }
  }, [isOriginContact, firstName, lastName, email, phone]);

  useEffect(() => {
    if (isDestinationContact) {
      setDestinationContactName(`${firstName} ${lastName}`.trim());
      setDestinationContactEmail(email);
      setDestinationContactPhone(phone);
    } else {
      setDestinationContactName("");
      setDestinationContactEmail("");
      setDestinationContactPhone("");
    }
  }, [isDestinationContact, firstName, lastName, email, phone]);

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

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));



  const handleSubmit = async () => {
    if (!termsAccepted) {
      setSubmitError("You must agree to the Terms & Conditions.");
      return;
    }
    if (!electronicSignature.trim()) {
      setSubmitError("Please provide your electronic signature.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const fullPickup = originCity ? `${originAddress}, ${originCity}` : originAddress;
    const fullDropoff = destinationCity ? `${destinationAddress}, ${destinationCity}` : destinationAddress;
    const fullName = `${firstName} ${lastName}`.trim();

    const { error: updateError } = await (supabase.from("orders") as any).update({
      pickup_location: fullPickup,
      dropoff_location: fullDropoff,
      pickup_contact_name: originContactName,
      pickup_contact_phone: originContactPhone,
      dropoff_contact_name: destinationContactName,
      dropoff_contact_phone: destinationContactPhone,
      customer_signature: `IP: ${ipAddress} | Date: ${agreedDate} | Signed: ${electronicSignature}`,
      signed_at: new Date().toISOString(),
      terms_accepted: true,
      form_submitted: true
    }).eq("id", id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      setSubmitError("Failed to save your agreement. Please try again or contact support.");
      setSubmitting(false);
      return;
    }

    if (order?.customer_id) {
      await (supabase.from("customers") as any).update({
        customer_name: fullName,
        phone: phone,
        email: email,
      }).eq("id", order.customer_id);
    }


    setSubmitting(false);
    setSubmitted(true);
  };

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f7f9" }}><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  if (!order) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f7f9" }}><div className="text-red-500 text-lg">Order not found.</div></div>;

  if (!isAuthenticated && !submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "sans-serif" }}>
        <div style={{ background: "#0a1128", padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
          <img src="/logo.jpg" alt="Best American Auto Transport" style={{ maxHeight: "40px", width: "auto" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px" }}><Phone size={16} className="text-blue-500" />(302) 355-5544</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: "16px" }}>
          <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-md"><User size={32} /></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Authentication</h1>
            <p className="text-gray-500 text-sm mb-6">Enter the email or phone number associated with quote #{order.order_id} to access your shipment portal.</p>
            {authErrorMsg && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 flex items-center gap-2 border border-red-100"><AlertCircle size={16} /> {authErrorMsg}</div>}
            <form onSubmit={handleAuth}>
              <input type="text" value={authInput} onChange={(e) => setAuthInput(e.target.value)} placeholder="Email or Phone Number" required className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition-all" />
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">Verify Access</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#f4f7f9", padding: "40px 16px", fontFamily: "sans-serif" }}>
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-green-600" /></div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Shipment Booked!</h1>
          <p className="text-gray-600 text-lg mb-8">Thank you, {firstName}. Your transport agreement for Quote #{order.order_id} has been submitted successfully.</p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => generatePDF({
                order,
                vehicles,
                fullName: `${firstName} ${lastName}`.trim(),
                email,
                phone,
                pickupDate,
                originAddress,
                originCity,
                originContactName,
                originContactEmail,
                originContactPhone,
                destinationAddress,
                destinationCity,
                destinationContactName,
                destinationContactEmail,
                destinationContactPhone,
                electronicSignature,
                ipAddress,
                agreedDate
              })}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-lg shadow-md transition-colors text-lg"
            >
              <Download size={22} />
              Download Shipment Agreement PDF
            </button>
            <p className="text-gray-400 text-sm">Your signed agreement is ready to download.</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = ["Order Info", "Origin", "Destination", "Terms & Condition"];
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);

  return (
    <div ref={formRef} style={{ minHeight: "100vh", background: "#f4f7f9", fontFamily: "sans-serif", color: "#333" }}>
      <div style={{ background: "#ffffff", padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
        <img src="/logo.jpg" alt="Best American Auto Transport" style={{ maxHeight: "40px", width: "auto" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "14px" }}>
          <a href="tel:+13023555544" style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#0a1128", textDecoration: "none" }}><Phone size={16} className="text-blue-500" />(302) 355-5544</a>
          <a href="mailto:info@bestamericanautotransport.com" style={{ border: "1px solid #e2e8f0", padding: "8px 16px", color: "#0a1128", textDecoration: "none", borderRadius: "4px" }}><Mail size={14} className="inline mr-2" /> E-Mail Us</a>
        </div>
      </div>
      
      <div style={{ background: "#f0f8ff", padding: "40px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#0a1128", marginBottom: "12px" }}>Book My Shipment</h1>
          <p style={{ color: "#4b5563", marginBottom: "32px", fontSize: "16px" }}>Fill out the form below to book your transportation order</p>
          <div style={{ display: "inline-flex", background: "#fff", alignItems: "center", border: "1px solid #e2e8f0" }}>
            {steps.map((s, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ padding: "12px 24px", background: step === idx + 1 ? "#2563eb" : "transparent", color: step === idx + 1 ? "#fff" : "#4b5563", fontSize: "14px", fontWeight: step === idx + 1 ? 600 : 400 }}>{s}</div>
                {idx < steps.length - 1 && <div style={{ color: "#d1d5db", padding: "0 8px" }}><ChevronRight size={16} /></div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", fontWeight: 600, letterSpacing: "1px", marginBottom: "4px" }}>QUOTE</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#0a1128", borderBottom: "1px solid #0a1128", paddingBottom: "4px", display: "inline-block" }}>#{order.order_id}</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, marginBottom: "4px" }}>Price Expiration Date</div>
            <div style={{ fontSize: "18px", color: "#0a1128", fontWeight: 500 }}>{expirationDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "60px 40px", display: "flex", gap: "60px", maxWidth: "1200px", margin: "0 auto", background: "#fff" }}>
        
        {/* LEFT COLUMN - FORM STEPS */}
        <div style={{ flex: 1 }}>
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: "18px", color: "#1f2937", textTransform: "uppercase", marginBottom: "32px", letterSpacing: "0.5px" }}>CONTACT INFO</h2>
                
                <div style={{ position: "relative", marginBottom: "24px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280" }}>First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>
                
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280" }}>Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>
                <div style={{ color: "#3b82f6", fontSize: "13px", fontWeight: 500, marginBottom: "32px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                  <div style={{ background: "#3b82f6", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>+</div> Add Company
                </div>
                
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280" }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>
                <div style={{ color: "#3b82f6", fontSize: "13px", fontWeight: 500, marginBottom: "32px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                  <div style={{ background: "#3b82f6", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>+</div> Add Another Email
                </div>

                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280" }}>Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>
                <div style={{ color: "#3b82f6", fontSize: "13px", fontWeight: 500, marginBottom: "32px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                  <div style={{ background: "#3b82f6", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>+</div> Add Another Phone
                </div>

                <div style={{ position: "relative", marginBottom: "40px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280" }}>First Available Pickup Date</label>
                  <input type="text" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>
                
                <div className="flex justify-end">
                  <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center transition-colors font-semibold shadow-md" style={{ height: "64px" }}>
                    <span className="px-8 text-xl font-bold">Next</span>
                    <div className="h-full px-6 flex items-center justify-center bg-blue-400" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                      <ChevronRight size={24} className="font-bold" />
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: "18px", color: "#1f2937", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>ORIGIN</h2>
                <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>This is the pickup location.</p>
                
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280", opacity: originAddress ? 1 : 0 }}>Origin Address</label>
                  <input type="text" placeholder="Origin Address" value={originAddress} onChange={e => setOriginAddress(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>
                <div style={{ color: "#3b82f6", fontSize: "13px", fontWeight: 500, marginBottom: "24px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                  <div style={{ background: "#3b82f6", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>+</div> Add Another Address Line
                </div>
                
                <div style={{ position: "relative", marginBottom: "40px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280" }}>Origin City</label>
                  <input type="text" value={originCity} onChange={e => setOriginCity(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg bg-blue-50" />
                </div>

                <h2 style={{ fontSize: "18px", color: "#1f2937", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>ORIGIN CONTACT</h2>
                <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>This is the person that we will contact on the day of the pickup to make arrangements.</p>

                <label className="flex items-center mb-6 cursor-pointer">
                  <input type="checkbox" checked={isOriginContact} onChange={e => setIsOriginContact(e.target.checked)} className="mr-3 w-5 h-5 text-blue-600 rounded border-gray-300" />
                  <span style={{ color: "#4b5563", fontSize: "16px" }}>I Am The Pickup Contact</span>
                </label>

                <div style={{ position: "relative", marginBottom: "24px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280", opacity: originContactName ? 1 : 0 }}>Origin Contact Name</label>
                  <input type="text" placeholder="Origin Contact Name" value={originContactName} onChange={e => setOriginContactName(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>

                <div style={{ position: "relative", marginBottom: "24px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280", opacity: originContactEmail ? 1 : 0 }}>Origin Contact Email</label>
                  <input type="email" placeholder="Origin Contact Email" value={originContactEmail} onChange={e => setOriginContactEmail(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>

                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280", opacity: originContactPhone ? 1 : 0 }}>Origin Contact Phone</label>
                  <input type="tel" placeholder="Origin Contact Phone" value={originContactPhone} onChange={e => setOriginContactPhone(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>
                <div style={{ color: "#3b82f6", fontSize: "13px", fontWeight: 500, marginBottom: "40px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                  <div style={{ background: "#3b82f6", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>+</div> Add Another Phone
                </div>
                
                <div className="flex justify-between items-end">
                  <button onClick={handlePrev} className="bg-white text-gray-800 flex items-center transition-colors text-xl pb-2 border-b border-gray-300 hover:border-gray-500" style={{ paddingLeft: "8px", paddingRight: "32px", height: "48px" }}>
                    <ChevronLeft size={20} className="mr-4 font-bold" />
                    Previous
                  </button>
                  <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center transition-colors font-semibold shadow-md" style={{ height: "64px" }}>
                    <span className="px-8 text-xl font-bold">Next</span>
                    <div className="h-full px-6 flex items-center justify-center bg-blue-400" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                      <ChevronRight size={24} className="font-bold" />
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            {step === 3 && (
               <div>
                 <h2 style={{ fontSize: "18px", color: "#1f2937", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>DESTINATION</h2>
                 <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>This is the delivery location.</p>
                 
                 <div style={{ position: "relative", marginBottom: "12px" }}>
                   <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280", opacity: destinationAddress ? 1 : 0 }}>Destination Address</label>
                   <input type="text" placeholder="Destination Address" value={destinationAddress} onChange={e => setDestinationAddress(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                 </div>
                 <div style={{ color: "#3b82f6", fontSize: "13px", fontWeight: 500, marginBottom: "24px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                   <div style={{ background: "#3b82f6", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>+</div> Add Another Address Line
                 </div>
                 
                 <div style={{ position: "relative", marginBottom: "40px" }}>
                   <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280" }}>Destination City</label>
                   <input type="text" value={destinationCity} onChange={e => setDestinationCity(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg bg-blue-50" />
                 </div>
 
                 <h2 style={{ fontSize: "18px", color: "#1f2937", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>DESTINATION CONTACT</h2>
                 <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>This is the person that we will contact on the day of the delivery to make arrangements.</p>
 
                 <label className="flex items-center mb-6 cursor-pointer">
                   <input type="checkbox" checked={isDestinationContact} onChange={e => setIsDestinationContact(e.target.checked)} className="mr-3 w-5 h-5 text-blue-600 rounded border-gray-300" />
                   <span style={{ color: "#4b5563", fontSize: "16px" }}>I Am The Delivery Contact</span>
                 </label>
 
                 <div style={{ position: "relative", marginBottom: "24px" }}>
                   <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280", opacity: destinationContactName ? 1 : 0 }}>Destination Contact Name</label>
                   <input type="text" placeholder="Destination Contact Name" value={destinationContactName} onChange={e => setDestinationContactName(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                 </div>
 
                 <div style={{ position: "relative", marginBottom: "24px" }}>
                   <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280", opacity: destinationContactEmail ? 1 : 0 }}>Destination Contact Email</label>
                   <input type="email" placeholder="Destination Contact Email" value={destinationContactEmail} onChange={e => setDestinationContactEmail(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                 </div>
 
                 <div style={{ position: "relative", marginBottom: "12px" }}>
                   <label style={{ position: "absolute", top: "-10px", left: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280", opacity: destinationContactPhone ? 1 : 0 }}>Destination Contact Phone</label>
                   <input type="tel" placeholder="Destination Contact Phone" value={destinationContactPhone} onChange={e => setDestinationContactPhone(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                 </div>
                 <div style={{ color: "#3b82f6", fontSize: "13px", fontWeight: 500, marginBottom: "40px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                   <div style={{ background: "#3b82f6", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>+</div> Add Another Phone
                 </div>
                 
                 <div className="flex justify-between items-end">
                  <button onClick={handlePrev} className="bg-white text-gray-800 flex items-center transition-colors text-xl pb-2 border-b border-gray-300 hover:border-gray-500" style={{ paddingLeft: "8px", paddingRight: "32px", height: "48px" }}>
                    <ChevronLeft size={20} className="mr-4 font-bold" />
                    Previous
                  </button>
                  <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center transition-colors font-semibold shadow-md" style={{ height: "64px" }}>
                    <span className="px-8 text-xl font-bold">Next</span>
                    <div className="h-full px-6 flex items-center justify-center bg-blue-400" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                      <ChevronRight size={24} className="font-bold" />
                    </div>
                  </button>
                </div>
               </div>
            )}
            
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: "18px", color: "#1f2937", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.5px" }}>ACCEPTANCE</h2>
                
                <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: 1.6, marginBottom: "32px" }}>
                  <span style={{ color: "#ef4444" }}>*</span>By selecting "I Agree" and entering my full name as a binding electronic signature, I understand that an electronic signature has the same legal effect and can be enforced in the same way as a written signature. Furthermore, I hereby accept terms and conditions of service as described in the "Terms &amp; Conditions" section below.
                </p>

                <div style={{ background: "#f8fafc", padding: "0 0 24px 0", marginBottom: "32px", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "28px", color: "#2563eb", fontWeight: 700, padding: "24px 24px 0 24px", margin: 0 }}>Terms &amp; Conditions</h3>
                    <div style={{ width: "24px", background: "#2563eb" }}></div>
                  </div>
                  <div style={{ color: "#4b5563", fontSize: "13px", lineHeight: 1.6, padding: "0 24px", whiteSpace: "pre-wrap", maxHeight: "250px", overflowY: "auto" }}>
                    {TERMS}
                  </div>
                </div>
                
                <div className="mb-8">
                  <label className="flex items-center mb-6 cursor-pointer">
                    <input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mr-3 w-6 h-6 text-blue-600 rounded border-gray-300" /> 
                    <span style={{ color: "#0a1128", fontSize: "18px", fontWeight: 400 }}>I Agree</span>
                  </label>
                  
                  <div style={{ marginBottom: "24px" }}>
                    <input type="text" placeholder="Electronic signature (Your full name)*" value={electronicSignature} onChange={e=>setElectronicSignature(e.target.value)} className="w-full border border-gray-200 p-4 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
                  </div>

                  <div style={{ position: "relative", marginBottom: "24px" }}>
                    <label style={{ position: "absolute", top: "-10px", right: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280" }}>Your IP address</label>
                    <input type="text" readOnly value={ipAddress} className="w-full border border-gray-200 p-4 text-lg bg-white" style={{ outline: "none" }} />
                  </div>

                  <div style={{ position: "relative", marginBottom: "40px" }}>
                    <label style={{ position: "absolute", top: "-10px", right: "12px", background: "#fff", padding: "0 4px", fontSize: "12px", color: "#6b7280" }}>Agreed to terms on this day</label>
                    <input type="text" readOnly value={agreedDate} className="w-full border border-gray-200 p-4 text-lg bg-white" style={{ outline: "none" }} />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <button onClick={handlePrev} className="bg-white text-gray-800 flex items-center transition-colors text-xl pb-2 border-b border-gray-300 hover:border-gray-500" style={{ paddingLeft: "8px", paddingRight: "32px", height: "48px" }}>
                    <ChevronLeft size={20} className="mr-4 font-bold" />
                    Previous
                  </button>
                  <button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center transition-colors font-semibold shadow-md" style={{ height: "64px" }}>
                    <span className="px-8 text-xl font-bold">{submitting ? "Submitting..." : "Book My Order"}</span>
                    {!submitting && (
                      <div className="h-full px-6 flex items-center justify-center bg-blue-400" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                        <ChevronRight size={24} className="font-bold" />
                      </div>
                    )}
                  </button>
                </div>
                {submitError && <div className="text-red-500 mt-4 p-3 bg-red-50 rounded border border-red-100 text-right">{submitError}</div>}
              </div>
            )}
        </div>

        {/* RIGHT COLUMN - PRICE SUMMARY & CARGO */}
        <div style={{ width: "380px", flexShrink: 0 }}>
          <h2 style={{ fontSize: "18px", color: "#1f2937", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.5px" }}>PRICE</h2>
          
          <div style={{ background: "#f8fafc", padding: "32px", borderTop: "4px solid #3b82f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#0a1128" }}>Total tariff</span>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#0a1128" }}>${order?.customer_price ? `${order.customer_price}.00` : "0.00"}</span>
            </div>
            
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#4b5563", fontSize: "15px" }}>Payment Method</span>
              <span style={{ color: "#0a1128", fontSize: "15px", fontWeight: 500 }}>{order?.payment_method || "Not Specified"}</span>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#4b5563", fontSize: "15px" }}>Payment Timing</span>
              <span style={{ color: "#0a1128", fontSize: "15px", fontWeight: 500 }}>{order?.payment_timing || "Not Specified"}</span>
            </div>
          </div>

          <h2 style={{ fontSize: "18px", color: "#1f2937", textTransform: "uppercase", marginTop: "40px", marginBottom: "16px", letterSpacing: "0.5px" }}>CARGO</h2>
          
          <div style={{ background: "#f8fafc", padding: "32px", borderTop: "4px solid #0a1128" }}>
            {vehicles.map((v, i) => (
              <div key={v.id} style={{ marginBottom: i < vehicles.length - 1 ? "32px" : "0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "24px", marginBottom: "24px" }}>
                  <span style={{ color: "#4b5563", fontSize: "15px" }}>Transport Type:</span>
                  <span style={{ background: "#e2e8f0", color: "#0a1128", padding: "6px 16px", fontWeight: 600, fontSize: "14px" }}>{v.trailer_type || "Open"}</span>
                </div>
                <div>
                  <span style={{ color: "#0a1128", fontSize: "16px", fontWeight: 500, display: "block", marginBottom: "4px" }}>Cargo:</span>
                  <span style={{ color: "#4b5563", fontSize: "15px" }}>{v.year} {v.make} {v.model}</span>
                </div>
              </div>
            ))}
            {vehicles.length === 0 && (
              <div style={{ color: "#6b7280", fontSize: "15px" }}>No vehicles listed.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
