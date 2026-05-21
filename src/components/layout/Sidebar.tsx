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
    <aside className="w-64 bg-[#0a1128] border-r border-gray-800 h-screen sticky top-0 flex flex-col z-10 hidden md:flex shrink-0 text-white">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="text-blue-500 text-3xl font-black italic leading-none">N</div>
            <div className="mt-1">
              <div className="text-xl font-extrabold tracking-tight leading-none text-white">eon</div>
              <div className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5">AUTO TRANSPORT</div>
            </div>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-blue-600 hover:text-white transition-all duration-200"
            >
              <Icon size={18} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-800 mt-auto bg-[#070b1a]">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold uppercase shrink-0 shadow-inner">
              {userEmail ? userEmail.charAt(0) : 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-white">Admin User</p>
              <p className="text-xs text-gray-400 truncate">{userEmail || 'admin@neon.com'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors ml-2" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
