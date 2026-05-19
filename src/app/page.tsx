import { supabase } from "@/lib/supabase/client";
import { DollarSign, Users, Package, Truck, ArrowUpRight } from "lucide-react";
import { SalesChart } from "@/components/dashboard/SalesChart";
import Link from "next/link";

async function getStats() {
  // First, try the RPC function for better performance
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_stats');
  
  if (rpcData && !rpcError) {
    const d = rpcData as any;
    
    // For chart data, we still need all non-cancelled orders from the last 6 months
    // We could add this to RPC, but for now we fetch it if RPC succeeds
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: chartOrders } = await supabase
      .from('orders')
      .select('created_at, profit, status')
      .gte('created_at', sixMonthsAgo.toISOString())
      .not('status', 'ilike', 'cancelled');

    // Group by month
    const monthlyData: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      monthlyData[month] = 0;
    }

    chartOrders?.forEach(order => {
      const month = new Date(order.created_at).toLocaleString('default', { month: 'short' });
      if (monthlyData[month] !== undefined) {
        monthlyData[month] += Number(order.profit) || 0;
      }
    });

    return {
      customersCount: d.customers_count || 0,
      ordersCount: d.orders_count || 0,
      totalProfit: d.total_profit || 0,
      activeOrders: d.active_orders || 0,
      recentOrders: d.recent_orders || [],
      chartData: Object.keys(monthlyData).map(key => ({ name: key, sales: monthlyData[key] }))
    };
  }

  // Fallback: The old way (fetch everything)
  const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  
  const ordersCount = orders?.length || 0;
  const totalProfit = orders?.reduce((acc, order) => acc + (Number(order.profit) || 0), 0) || 0;
  
  const activeOrders = orders?.filter(o => 
    o.status?.toLowerCase() !== 'delivered' && 
    o.status?.toLowerCase() !== 'cancelled'
  ).length || 0;

  const recentOrders = orders?.slice(0, 5) || [];

  // Group orders by month for the chart
  const monthlyData: Record<string, number> = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toLocaleString('default', { month: 'short' });
    monthlyData[month] = 0;
  }

  orders?.forEach(order => {
    if (order.status?.toLowerCase() !== 'cancelled' && order.created_at) {
      const month = new Date(order.created_at).toLocaleString('default', { month: 'short' });
      if (monthlyData[month] !== undefined) {
        monthlyData[month] += Number(order.profit) || 0;
      }
    }
  });

  const chartData = Object.keys(monthlyData).map(key => ({
    name: key,
    sales: monthlyData[key]
  }));

  return {
    customersCount: customersCount || 0,
    ordersCount,
    totalProfit,
    activeOrders,
    recentOrders,
    chartData
  };
}

export default async function Home() {
  const stats = await getStats();

  const statCards = [
    { title: "Total Profit", value: `$${stats.totalProfit.toLocaleString()}`, icon: DollarSign, trend: "Real-time", link: "/payments" },
    { title: "Total Customers", value: stats.customersCount.toString(), icon: Users, trend: "Real-time", link: "/customers" },
    { title: "Active Orders", value: stats.activeOrders.toString(), icon: Package, trend: "Real-time", link: "/orders" },
    { title: "Total Orders", value: stats.ordersCount.toString(), icon: Truck, trend: "Real-time", link: "/orders" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-foreground/70 mt-1">Welcome back. Here is your real-time data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link href={card.link} key={card.title} className="block group">
              <div className="glass-panel p-6 rounded-2xl border border-border group-hover:border-neon-blue/50 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all cursor-pointer h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors">{card.title}</p>
                    <h3 className="text-3xl font-bold mt-2">{card.value}</h3>
                  </div>
                  <div className="p-3 bg-neon-blue/10 text-neon-blue rounded-xl group-hover:bg-neon-blue/20 transition-colors">
                    <Icon size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm">
                  <span className="flex items-center font-medium text-neon-blue">
                    <ArrowUpRight size={16} />
                    {card.trend}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-border">
          <SalesChart data={stats.chartData} />
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-border overflow-y-auto max-h-[400px]">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="flex gap-4 items-start border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-electric-cyan"></div>
                  <div>
                    <p className="text-sm font-medium">Order: {order.order_id}</p>
                    <p className="text-xs text-foreground/60">{order.vehicle_name} - {order.status}</p>
                    <p className="text-xs text-foreground/40 mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/50">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
