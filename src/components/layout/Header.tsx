"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function Header() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Quote Requested', time: '10 mins ago', read: false },
    { id: 2, title: 'Payment Received', time: '1 hour ago', read: false },
    { id: 3, title: 'Carrier Assigned', time: '2 hours ago', read: false },
  ]);

  // Global Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{type: string, id: string, label: string, url: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      
      const term = searchTerm.trim();
      const results: {type: string, id: string, label: string, url: string}[] = [];

      // Search Orders
      const { data: orders } = await supabase.from('orders')
        .select('id, order_id, customer_name, vehicle_name')
        .or(`order_id.ilike.%${term}%,customer_name.ilike.%${term}%,vehicle_name.ilike.%${term}%`)
        .limit(3);
      
      if (orders) {
        orders.forEach(o => results.push({ 
          type: 'Order', 
          id: o.id, 
          label: `${o.order_id || 'N/A'} - ${o.customer_name} (${o.vehicle_name})`,
          url: `/orders/${o.id}`
        }));
      }

      // Search Leads
      const { data: leads } = await supabase.from('leads')
        .select('id, custom_order_id, customer_name')
        .or(`custom_order_id.ilike.%${term}%,customer_name.ilike.%${term}%`)
        .limit(3);
      
      if (leads) {
        leads.forEach(l => results.push({ 
          type: 'Lead', 
          id: l.id, 
          label: `Lead ${l.custom_order_id || ''} - ${l.customer_name}`,
          url: `/leads/${l.id}`
        }));
      }

      // Search Customers
      const { data: customers } = await supabase.from('customers')
        .select('id, customer_name, email')
        .or(`customer_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(3);
      
      if (customers) {
        customers.forEach(c => results.push({ 
          type: 'Customer', 
          id: c.id, 
          label: `${c.customer_name} (${c.email || 'No email'})`,
          url: `/customers` // They can click the link and search there
        }));
      }

      setSearchResults(results);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
          <input 
            type="text" 
            placeholder="Global search (Orders, Leads, Customers)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if (searchTerm) setShowResults(true); }}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-border bg-background focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-sm transition-all text-foreground placeholder-foreground/50"
          />
          
          {/* Search Dropdown */}
          {showResults && (
            <div className="absolute top-12 left-0 w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              {isSearching ? (
                <div className="p-4 flex items-center justify-center gap-2 text-sm text-foreground/60">
                  <Loader2 size={16} className="animate-spin" /> Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-80 overflow-y-auto py-2">
                  {searchResults.map((result, idx) => (
                    <Link 
                      key={`${result.type}-${result.id}-${idx}`} 
                      href={result.url}
                      onClick={() => setShowResults(false)}
                      className="flex flex-col px-4 py-2 hover:bg-background/80 transition-colors"
                    >
                      <span className="text-xs font-semibold text-neon-blue uppercase tracking-wider">{result.type}</span>
                      <span className="text-sm text-foreground">{result.label}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-foreground/60 text-center">
                  No results found for "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-full hover:bg-border transition-colors text-foreground"
        >
          <Bell size={20} className="text-foreground/80" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-neon-blue rounded-full border-2 border-surface"></span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-neon-blue hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-foreground/50">No notifications</div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b border-border last:border-0 hover:bg-background/50 transition-colors flex items-start gap-3 ${notification.read ? 'opacity-60' : ''}`}
                  >
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notification.read ? 'bg-transparent' : 'bg-neon-blue'}`} />
                    <div className="flex-1">
                      <p className={`text-sm ${notification.read ? 'text-foreground/70' : 'text-foreground font-medium'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-foreground/50 mt-1">{notification.time}</p>
                    </div>
                    {!notification.read && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="text-foreground/40 hover:text-neon-blue p-1"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
