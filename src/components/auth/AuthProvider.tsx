"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-neon-blue">Loading Neon CRM...</div>;
  }

  if (!session) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-dark-navy via-background to-background">
        <div className="glass-panel p-8 rounded-2xl border border-border w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neon-blue tracking-wider mb-2">NEON CRM</h1>
            <p className="text-foreground/70">Sign in to access your dashboard</p>
          </div>
          
          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-6 text-sm text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/80">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all"
                placeholder="agent@neon.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/80">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 mt-4 rounded-xl bg-neon-blue text-dark-navy font-bold hover:bg-electric-cyan transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              Sign In
            </button>
          </form>
          
          <p className="text-center text-xs text-foreground/50 mt-8">
            Note: You must create your user account via the Supabase Dashboard first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar userEmail={session.user.email} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}
