"use client";

import { useState } from 'react';
import { Search, Bell, Check, X } from 'lucide-react';

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Quote Requested', time: '10 mins ago', read: false },
    { id: 2, title: 'Payment Received', time: '1 hour ago', read: false },
    { id: 3, title: 'Carrier Assigned', time: '2 hours ago', read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 glass-panel">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
          <input 
            type="text" 
            placeholder="Global search..." 
            className="w-full pl-10 pr-4 py-2 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-sm transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-full hover:bg-border transition-colors"
        >
          <Bell size={20} className="text-foreground/80" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-neon-blue rounded-full border-2 border-surface"></span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
              <h3 className="font-semibold">Notifications</h3>
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
                      <p className={`text-sm ${notification.read ? 'text-foreground/70' : 'font-medium'}`}>
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
