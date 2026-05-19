"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Zap } from "lucide-react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("crm-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("crm-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-surface border border-border p-2 rounded-full shadow-2xl z-50">
      <button 
        onClick={() => changeTheme("dark")}
        className={`p-2 rounded-full transition-all ${theme === "dark" ? "bg-neon-blue text-dark-navy" : "text-foreground/50 hover:text-foreground hover:bg-foreground/10"}`}
        title="Dark Mode"
      >
        <Moon size={18} />
      </button>
      <button 
        onClick={() => changeTheme("bright")}
        className={`p-2 rounded-full transition-all ${theme === "bright" ? "bg-neon-blue text-white" : "text-foreground/50 hover:text-foreground hover:bg-foreground/10"}`}
        title="Bright Mode"
      >
        <Sun size={18} />
      </button>
      <button 
        onClick={() => changeTheme("neon")}
        className={`p-2 rounded-full transition-all ${theme === "neon" ? "bg-electric-cyan text-white shadow-[0_0_10px_rgba(0,144,208,0.8)]" : "text-foreground/50 hover:text-foreground hover:bg-foreground/10"}`}
        title="Neon Light Mode"
      >
        <Zap size={18} />
      </button>
    </div>
  );
}
