"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname?.startsWith("/order-form") ?? false;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(!isPublicRoute);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Add a timeout so we never hang on the loading screen forever
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      setLoading(false);
    } else {
      // Immediately update session — don't wait for onAuthStateChange
      setSession(data.session);
      setLoading(false);
    }
  };

  // Public routes skip the auth gate entirely (customers don't need an account)
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-neon-blue">Loading Best American CRM...</div>;
  }

  // Bypassed login check to allow viewing the CRM directly
  if (false) {
    return (
      <div className="h-screen w-full flex flex-col" style={{ background: "#ffffff" }}>
        {/* Top Header */}
        <div style={{ background: "#0a1128", padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ color: "#3b82f6", fontSize: "32px", fontWeight: 900, fontStyle: "italic", lineHeight: 1 }}>B</div>
            <div style={{ marginTop: "6px" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1 }}>est American</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", marginTop: "2px" }}>AUTO TRANSPORT</div>
            </div>
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#9ca3af" }}>CRM Portal</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="flex-1 flex items-center justify-center" style={{ background: "#f4f7f9" }}>
          <div className="bg-white p-10 rounded-xl border border-gray-200 w-full max-w-md shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#0a1128] tracking-tight mb-2">Welcome Back</h1>
              <p className="text-gray-500">Sign in to access the Best American CRM dashboard</p>
            </div>
            
            {authError && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[15px]"
                  placeholder="agent@bestamericanautotransport.com"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[15px]"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3.5 mt-2 rounded-lg bg-[#2563eb] text-white font-bold hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </form>
            
            <p className="text-center text-xs text-gray-400 mt-8">
              Best American Auto Transport &bull; Internal CRM Access Only
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar userEmail={session?.user?.email || "admin@bestamericanautotransport.com"} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}
