import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Truck, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';

export function Sidebar({ userEmail }: { userEmail?: string }) {
  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Leads (Quotes)', href: '/leads', icon: Users },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Dispatch Board', href: '/dispatch', icon: Truck },
    { name: 'Carriers', href: '/carriers', icon: Truck },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen sticky top-0 flex flex-col glass-panel z-10 hidden md:flex shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Neon Auto Transport" className="h-8 w-auto rounded object-contain" />
          <h1 className="text-xl font-bold text-neon-blue tracking-wider">NEON CRM</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-neon-blue/10 hover:text-neon-blue transition-all duration-200"
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-electric-cyan flex items-center justify-center text-dark-navy font-bold uppercase shrink-0">
              {userEmail ? userEmail.charAt(0) : 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">Logged In</p>
              <p className="text-xs text-foreground/70 truncate">{userEmail || 'admin@neon.com'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-foreground/50 hover:text-red-500 transition-colors ml-2" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
