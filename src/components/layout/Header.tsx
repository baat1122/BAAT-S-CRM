"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function Header() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Global Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{type: string, id: string, label: string, url: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: any) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 1. Load initial notifications & ask permission
  useEffect(() => {
    const saved = localStorage.getItem('crm_notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        setNotifications([
          { id: '1', title: 'New Quote Requested', body: 'Demo: Quote request loaded', time: new Date().toISOString(), read: false },
        ]);
      }
    } else {
      setNotifications([
        { id: '1', title: 'New Quote Requested', body: 'Welcome to Best American CRM! Real-time notifications are enabled.', time: new Date().toISOString(), read: false },
      ]);
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // 2. Save notifications to localStorage when updated
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('crm_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // 3. Desktop push notifier
  const showDesktopNotification = (title: string, body: string, url?: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon.png',
      });
      if (url) {
        notification.onclick = () => {
          window.focus();
          router.push(url);
        };
      }
    }
  };

  // 4. Set up Supabase Realtime Listeners
  useEffect(() => {
    // 1. Listen to new leads
    const leadSub = supabase
      .channel('realtime_leads_notification')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          const newLead = payload.new;
          const title = 'New Lead Created';
          const body = `${newLead.customer_name} requested a quote for ${newLead.vehicle_name || 'Vehicle'} from ${newLead.pickup_location} to ${newLead.dropoff_location}`;
          const link = `/leads/${newLead.id}`;
          
          setNotifications(prev => [
            {
              id: `lead-${newLead.id}-${Date.now()}`,
              title,
              body,
              time: new Date().toISOString(),
              read: false,
              url: link
            },
            ...prev
          ]);
          showDesktopNotification(title, body, link);
        }
      )
      .subscribe();

    // 2. Listen to new orders
    const orderSub = supabase
      .channel('realtime_orders_notification')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new;
          const title = 'New Order Placed';
          const body = `Order #${newOrder.custom_order_id || newOrder.id.split('-')[0].toUpperCase()} created for ${newOrder.vehicle_name || 'Vehicle'}`;
          const link = `/orders/${newOrder.id}`;

          setNotifications(prev => [
            {
              id: `order-ins-${newOrder.id}-${Date.now()}`,
              title,
              body,
              time: new Date().toISOString(),
              read: false,
              url: link
            },
            ...prev
          ]);
          showDesktopNotification(title, body, link);
        }
      )
      // 3. Listen to order updates
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const oldOrder = payload.old;
          const newOrder = payload.new;
          
          let title = 'Order Updated';
          let body = `Order #${newOrder.custom_order_id || newOrder.id.split('-')[0].toUpperCase()} was updated.`;

          if (oldOrder.status !== newOrder.status) {
            title = 'Order Status Updated';
            body = `Order #${newOrder.custom_order_id || newOrder.id.split('-')[0].toUpperCase()} status changed to ${newOrder.status}`;
          }

          const link = `/orders/${newOrder.id}`;
          setNotifications(prev => [
            {
              id: `order-upd-${newOrder.id}-${Date.now()}`,
              title,
              body,
              time: new Date().toISOString(),
              read: false,
              url: link
            },
            ...prev
          ]);
          showDesktopNotification(title, body, link);
        }
      )
      .subscribe();

    // 4. Listen to payments
    const paymentSub = supabase
      .channel('realtime_payments_notification')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        (payload) => {
          const newPayment = payload.new;
          const title = 'Payment Received';
          const body = `Payment of $${newPayment.amount_paid} received via ${newPayment.payment_method}`;
          const link = `/payments`;

          setNotifications(prev => [
            {
              id: `payment-${newPayment.id}-${Date.now()}`,
              title,
              body,
              time: new Date().toISOString(),
              read: false,
              url: link
            },
            ...prev
          ]);
          showDesktopNotification(title, body, link);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadSub);
      supabase.removeChannel(orderSub);
      supabase.removeChannel(paymentSub);
    };
  }, [router]);

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
                    onClick={() => {
                      if (notification.url) {
                        router.push(notification.url);
                        setShowNotifications(false);
                      }
                      markAsRead(notification.id);
                    }}
                    className={`p-4 border-b border-border last:border-0 hover:bg-background/50 transition-colors flex items-start gap-3 cursor-pointer ${notification.read ? 'opacity-60' : ''}`}
                  >
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notification.read ? 'bg-transparent' : 'bg-neon-blue'}`} />
                    <div className="flex-1">
                      <p className={`text-sm ${notification.read ? 'text-foreground/70' : 'text-foreground font-medium'}`}>
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="text-xs text-foreground/70 mt-0.5">{notification.body}</p>
                      )}
                      <p className="text-[10px] text-foreground/40 mt-1">
                        {typeof notification.time === 'string' && notification.time.includes('ago') 
                          ? notification.time 
                          : new Date(notification.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    {!notification.read && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
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
